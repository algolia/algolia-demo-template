import { useChat, type UIMessage } from '@ai-sdk/react';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useInstantSearch } from 'react-instantsearch';

import { useCart } from '@/components/cart/cart-context';
import { useSelection, SelectedProduct } from '@/components/selection/selection-context';
import { getObjectsByIds } from '@/lib/getObjectByIDs';
import { Product } from '@/lib/types/product';
import { ALGOLIA_CONFIG } from '@/lib/algolia-config';
import { ContextSnapshot } from '@/components/sidepanel-agent-studio/lib/context-snapshot';
import { buildAgentApiUrl, createAgentTransport } from '@/components/sidepanel-agent-studio/lib/create-agent-transport';

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

  const apiUrl = useMemo(() => buildAgentApiUrl(config), [config.applicationId, config.agentId]);

  const transport = useMemo(() => {
    return createAgentTransport(apiUrl, config, indexUiStateRef, {
      debugLabel: '[Agent Studio]',
      enrichContext: (ctx) => {
        // Add selected products to context only when NOT on a product page
        if (ctx.page.pageType !== 'product') {
          const currentSelectedProducts = selectedProductsRef.current;
          if (currentSelectedProducts.length > 0) {
            return {
              ...ctx,
              selectedProducts: currentSelectedProducts.map((p) => ({
                objectID: p.objectID,
                name: p.title,
                brand: p.brand,
                price: p.price?.toString(),
              })),
            } as ContextSnapshot;
          }
        }
        return ctx;
      },
    });
  }, [apiUrl, config, indexUiStateRef]);

  // Client-side tools that we handle locally (not server-side like algolia_search_index)
  const CLIENT_SIDE_TOOLS = ['addToCart', 'showItems'];

  // Custom condition: only auto-send when client-side tools have outputs
  // This prevents duplicate sends when server-side tools (algolia_search_index) are used
  const shouldAutoSend = useCallback(({ messages }: { messages: UIMessage[] }): boolean => {
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
      if (toolCall.dynamic) return;

      if (toolCall.toolName === 'addToCart') {
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

  // Reset conversation state
  const resetConversation = useCallback(() => {
    chat.setMessages?.([]);
  }, [chat]);

  return {
    ...chat,
    isGenerating,
    resetConversation,
  };
}
