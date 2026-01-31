import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useInstantSearch } from 'react-instantsearch';

import { useCart } from '@/components/cart/cart-context';
import { useSelection, SelectedProduct } from '@/components/selection/selection-context';
import { getObjectsByIds } from '@/lib/getObjectByIDs';
import { Product } from '@/lib/types/product';
import { ALGOLIA_CONFIG } from '@/lib/algolia-config';
import {
  resolveContextWithUiState,
  hydrateContext,
  makeContextSystemMessage,
  ContextSnapshot,
} from '@/components/sidepanel-agent-studio/lib/context-snapshot';

// use-agent-studio.ts
export interface AgentStudioConfig {
  applicationId: string;
  apiKey: string;
  agentId: string;
  /** Display variant: 'floating' shows as modal, 'inline' pushes page content */
  variant?: "floating" | "inline";
  /** Placeholder text for input */
  placeholder?: string;
  /** Custom button text */
  buttonText?: string;
  /** Whether to show the trigger button (default: true) */
  showTrigger?: boolean;
}

export type Item = {
  imageUrl: string;
  name: string;
  objectID: string;
};


export type CartToolCallInput = {
  objectIDs: string[];
};

export type CartToolCallOutput = {
  status: 'Successfully added to cart';
  combination: {
    products: Product[];
  };
};

export type ShowItemsToolCallInput = {
  objectIDs: string[];
  title?: string;
  explanation?: string;
};

export type ShowItemsToolCallOutput = {
  status: 'Successfully showed items';
  products: Product[];
  title?: string;
  explanation?: string;
};



export function useAgentStudio(config: AgentStudioConfig) {
  if (!config) {
    throw new Error('config is required for useAgentStudio');
  }

  const { addItem } = useCart();
  const { selectedProducts } = useSelection();
  const { indexUiState } = useInstantSearch();

  // Use refs to access latest values in the async callback without re-creating transport
  const selectedProductsRef = useRef<SelectedProduct[]>(selectedProducts);
  const indexUiStateRef = useRef(indexUiState);
  useEffect(() => {
    selectedProductsRef.current = selectedProducts;
  }, [selectedProducts]);
  useEffect(() => {
    indexUiStateRef.current = indexUiState;
  }, [indexUiState]);

  // Conversation ID for tracking in Algolia Agent Studio dashboard
  const conversationIdRef = useRef<string>(crypto.randomUUID());

  // Agent Studio completions endpoint (AI SDK v5 compatible + streaming)
  const apiUrl = useMemo(
    () =>
      `https://${config.applicationId}.algolia.net/agent-studio/1/agents/${config.agentId}/completions?stream=true&compatibilityMode=ai-sdk-5`,
    [config.applicationId, config.agentId]
  );

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: apiUrl,
      headers: {
        'x-algolia-application-id': config.applicationId,
        'x-algolia-api-key': config.apiKey,
        'content-type': 'application/json',
      },
      prepareSendMessagesRequest: async ({ messages, trigger, messageId }) => {
        try {
          // Resolve context using InstantSearch's clean uiState (avoids composition prefix issues)
          const baseCtx = resolveContextWithUiState(indexUiStateRef.current);
          // Hydrate with product data if on a product page
          let ctx = await hydrateContext(baseCtx);

          // Add selected products to context if any are selected
          const currentSelectedProducts = selectedProductsRef.current;
          if (currentSelectedProducts.length > 0) {
            ctx = {
              ...ctx,
              selectedProducts: currentSelectedProducts.map((p) => ({
                objectID: p.objectID,
                name: p.title,
                brand: p.brand,
                price: p.price?.toString(),
              })),
            } as ContextSnapshot;
          }

          // Create system message with context
          const ctxMsg = makeContextSystemMessage(ctx);

          if (process.env.NODE_ENV === 'development') {
            console.debug('[Agent Studio] Injected context:', ctx);
          }

          return {
            body: {
              messages: [ctxMsg, ...messages],
              trigger,
              messageId,
              conversationId: conversationIdRef.current,
            },
          };
        } catch (error) {
          // If context resolution fails, proceed without context
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Agent Studio] Failed to resolve context:', error);
          }
          return {
            body: {
              messages,
              trigger,
              messageId,
              conversationId: conversationIdRef.current,
            },
          };
        }
      },
    });
  }, [apiUrl, config.applicationId, config.apiKey]);

  // Client-side tools that we handle locally (not server-side like algolia_search_index)
  const CLIENT_SIDE_TOOLS = ['addToCart', 'showItems'];

  // Custom condition: only auto-send when client-side tools have outputs
  // This prevents duplicate sends when server-side tools (algolia_search_index) are used
  const shouldAutoSend = useCallback((messages: UIMessage[]): boolean => {
    if (messages.length === 0) return false;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return false;

    // Check if there are any client-side tool calls that need outputs
    let hasClientSideToolCalls = false;
    let allClientSideToolsHaveOutputs = true;

    for (const part of lastMessage.parts) {
      if (typeof part === 'object' && 'type' in part) {
        const partType = part.type as string;
        // Check for tool call parts (format: tool-{toolName})
        if (partType.startsWith('tool-')) {
          const toolName = partType.replace('tool-', '');
          if (CLIENT_SIDE_TOOLS.includes(toolName)) {
            hasClientSideToolCalls = true;
            // Check if this tool call has output
            if ('state' in part && part.state !== 'output-available') {
              allClientSideToolsHaveOutputs = false;
            }
          }
        }
      }
    }

    // Only auto-send if we have client-side tools and all have outputs
    return hasClientSideToolCalls && allClientSideToolsHaveOutputs;
  }, []);

  const chat = useChat({
    transport,
    sendAutomaticallyWhen: shouldAutoSend,
    async onToolCall({ toolCall }) {
      // Handle client-side tools here if you define any on the agent.
      console.log('toolCall', toolCall);
      if (toolCall.dynamic) return;

      if (toolCall.toolName === 'addToCart') {
        console.log('toolCall.input', toolCall);
        const input = toolCall.input as CartToolCallInput;
        const products = await getObjectsByIds(input.objectIDs, ALGOLIA_CONFIG.INDEX_NAME) as Product[];

        // Add each product to the cart
        for (const product of products) {
          addItem({
            id: product.objectID || product.id || '',
            name: product.title || 'Unknown Product',
            price: product.price,
            image: product.imageUrl,
            brand: product.brand,
          });
        }

        chat.addToolOutput({
          tool: 'addToCart',
          toolCallId: toolCall.toolCallId,
          output: {
            status: 'Successfully added to cart',
            products: products,
          },
        });
      }
      if (toolCall.toolName === 'showItems') {
        console.log('toolCall.input', toolCall);
        const input = toolCall.input as ShowItemsToolCallInput;
        const products = await getObjectsByIds(input.objectIDs, ALGOLIA_CONFIG.INDEX_NAME) as Product[];

        chat.addToolOutput({
          tool: 'showItems',
          toolCallId: toolCall.toolCallId,
          state: 'output-available',
          output: {
            status: 'Successfully showed items',
            products: products,
            title: input.title,
            explanation: input.explanation,
          },
        });
      }
    },
  });

  const isGenerating =
    chat.status === 'submitted' || chat.status === 'streaming';

  // Reset conversation ID when starting a new conversation
  const resetConversation = useCallback(() => {
    conversationIdRef.current = crypto.randomUUID();
    chat.setMessages?.([]);
  }, [chat]);

  return {
    ...chat,
    isGenerating,
    resetConversation,
    conversationId: conversationIdRef.current,
  };
}
