import { useChat, type UIMessage } from '@ai-sdk/react';
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { useInstantSearch } from 'react-instantsearch';

import { useSelection, SelectedProduct } from '@/components/selection/selection-context';
import { useLanguage } from '@/components/language/language-context';
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
  variant?: "floating" | "inline";
  placeholder?: string;
  buttonText?: string;
  showTrigger?: boolean;
}

export type Item = {
  imageUrl: string;
  name: string;
  objectID: string;
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

  const { selectedProducts } = useSelection();
  const { indexUiState } = useInstantSearch();
  const { language } = useLanguage();

  const selectedProductsRef = useRef<SelectedProduct[]>(selectedProducts);
  const indexUiStateRef = useRef(indexUiState);
  const languageRef = useRef(language);
  useEffect(() => {
    selectedProductsRef.current = selectedProducts;
  }, [selectedProducts]);
  useEffect(() => {
    indexUiStateRef.current = indexUiState;
  }, [indexUiState]);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const apiUrl = useMemo(() => buildAgentApiUrl(config), [config.applicationId, config.agentId]);

  const transport = useMemo(() => {
    return createAgentTransport(apiUrl, config, indexUiStateRef, {
      debugLabel: '[Agent Studio]',
      enrichContext: (ctx) => {
        // Inject UI language so agent responds in the correct language
        const enriched = { ...ctx, uiLanguage: languageRef.current } as ContextSnapshot & { uiLanguage: string };

        // Add selected pages to context
        if (ctx.page.pageType !== 'product') {
          const currentSelectedProducts = selectedProductsRef.current;
          if (currentSelectedProducts.length > 0) {
            return {
              ...enriched,
              selectedProducts: currentSelectedProducts.map((p) => ({
                objectID: p.objectID,
                name: p.name || p.title,
              })),
            } as ContextSnapshot;
          }
        }
        return enriched as ContextSnapshot;
      },
    });
  }, [apiUrl, config, indexUiStateRef]);

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
      } else if (toolCall.toolName === 'showArticles') {
        const input = toolCall.input as { articles: Array<{ title: string; summary: string; url?: string; category?: string }>; title?: string };

        chat.addToolOutput({
          tool: 'showArticles',
          toolCallId: toolCall.toolCallId,
          state: 'output-available',
          output: {
            status: 'Successfully showed articles',
            articles: input.articles,
            title: input.title,
          },
        });
      }
    },
  });

  const isGenerating =
    chat.status === 'submitted' || chat.status === 'streaming';

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

  const resetConversation = useCallback(() => {
    chat.setMessages?.([]);
    setSuggestions([]);
  }, [chat]);

  return {
    ...chat,
    isGenerating,
    resetConversation,
    suggestions: extractedSuggestions,
    stop: chat.stop,
  };
}
