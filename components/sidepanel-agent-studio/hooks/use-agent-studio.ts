import { useChat } from '@ai-sdk/react';
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { useMemo } from 'react';

import { useCart } from '@/components/cart/cart-context';
import { getObjectsByIds } from '@/lib/getObjectByIDs';
import { Product } from '@/lib/types/product';
import { ALGOLIA_CONFIG } from '@/lib/algolia-config';
import {
  resolveContextFromUrl,
  hydrateContext,
  makeContextSystemMessage,
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
};

export type ShowItemsToolCallOutput = {
  status: 'Successfully showed items';
  products: Product[];
};



export function useAgentStudio(config: AgentStudioConfig) {
  if (!config) {
    throw new Error('config is required for useAgentStudio');
  }

  const { addItem } = useCart();

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
          // Resolve context from current URL state
          const baseCtx = resolveContextFromUrl();
          // Hydrate with product data if on a product page
          const ctx = await hydrateContext(baseCtx);
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
            },
          };
        }
      },
    });
  }, [apiUrl, config.applicationId, config.apiKey]);

  const chat = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
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
            id: product.objectID || product.productid || '',
            name: product.productname || product.producttitle || 'Unknown Product',
            price: product.fullSellingPrice,
            image: product.images?.[0],
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
          },
        });
      }
    },
  });

  const isGenerating =
    chat.status === 'submitted' || chat.status === 'streaming';

  return {
    ...chat,
    isGenerating,
  };
}
