import { useChat, type UIMessage } from '@ai-sdk/react';
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
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
                name: p.name,
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

  // Suggestions from built-in Agent Studio suggestions feature
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const chat = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onData(dataPart) {
      if (dataPart.type === 'data-suggestions') {
        const data = dataPart.data as { suggestions?: string[] };
        if (data?.suggestions) {
          setSuggestions(data.suggestions);
        }
      }
    },
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === 'addToCart') {
        const input = toolCall.input as CartToolCallInput;
        const products = await getObjectsByIds(input.objectIDs, ALGOLIA_CONFIG.INDEX_NAME) as Product[];

        // Add each product to the cart
        for (const product of products) {
          addItem({
            id: product.objectID || '',
            name: product.name || 'Unknown Product',
            price: product.price?.value || 0,
            image: product.primary_image,
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

  // Fallback: extract suggestions from last assistant message parts
  const extractedSuggestions = useMemo(() => {
    if (suggestions.length > 0) return suggestions;
    const lastAssistant = [...chat.messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistant) return [];
    for (const part of lastAssistant.parts) {
      if (typeof part === 'object' && 'type' in part && (part as { type: string }).type === 'data' && 'data' in part) {
        const d = part as { type: string; data: unknown };
        if (d.data && typeof d.data === 'object' && 'type' in (d.data as Record<string, unknown>)) {
          const dataObj = d.data as { type: string; data?: { suggestions?: string[] } };
          if (dataObj.type === 'data-suggestions' && dataObj.data?.suggestions) {
            return dataObj.data.suggestions;
          }
        }
      }
    }
    return [];
  }, [suggestions, chat.messages]);

  // Reset conversation state
  const resetConversation = useCallback(() => {
    chat.setMessages?.([]);
    setSuggestions([]);
  }, [chat]);

  return {
    ...chat,
    isGenerating,
    resetConversation,
    suggestions: extractedSuggestions,
  };
}
