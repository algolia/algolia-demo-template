import { DefaultChatTransport, type UIMessage } from 'ai';
import { MutableRefObject } from 'react';
import {
  resolveContextWithUiState,
  hydrateContext,
  makeContextSystemMessage,
  ContextSnapshot,
} from '@/components/sidepanel-agent-studio/lib/context-snapshot';

/**
 * Strip non-standard parts (e.g. data-suggestions) from assistant messages
 * before sending them back to the API, which would reject unknown part types.
 */
function filterDataParts(messages: UIMessage[]): UIMessage[] {
  return messages.map((msg) => {
    if (msg.role !== 'assistant') return msg;
    const filtered = msg.parts.filter(
      (p) =>
        !(
          typeof p === 'object' &&
          'type' in p &&
          typeof (p as { type: string }).type === 'string' &&
          (p as { type: string }).type.startsWith('data-')
        )
    );
    return filtered.length === msg.parts.length ? msg : { ...msg, parts: filtered };
  });
}

export interface AgentTransportConfig {
  applicationId: string;
  apiKey: string;
  agentId: string;
}

/**
 * Builds the Agent Studio completions URL for the given config.
 */
export function buildAgentApiUrl(config: AgentTransportConfig): string {
  return `https://${config.applicationId}.algolia.net/agent-studio/1/agents/${config.agentId}/completions?stream=true&compatibilityMode=ai-sdk-5`;
}

/**
 * Creates a DefaultChatTransport that injects page context into every request.
 *
 * @param apiUrl - The completions endpoint URL (from buildAgentApiUrl)
 * @param config - Application ID and API key for auth headers
 * @param indexUiStateRef - Ref to the latest InstantSearch uiState
 * @param enrichContext - Optional callback to enrich the context snapshot before sending
 * @param debugLabel - Label for development console messages (e.g. "[Agent Studio]")
 */
export function createAgentTransport(
  apiUrl: string,
  config: AgentTransportConfig,
  indexUiStateRef: MutableRefObject<Record<string, unknown>>,
  options?: {
    enrichContext?: (ctx: ContextSnapshot) => ContextSnapshot;
    debugLabel?: string;
  }
): DefaultChatTransport<UIMessage> {
  const label = options?.debugLabel ?? '[Agent]';

  return new DefaultChatTransport({
    api: apiUrl,
    headers: {
      'x-algolia-application-id': config.applicationId,
      'x-algolia-api-key': config.apiKey,
      'content-type': 'application/json',
    },
    prepareSendMessagesRequest: async ({ messages, trigger, messageId }) => {
      try {
        const baseCtx = resolveContextWithUiState(indexUiStateRef.current);
        let ctx = await hydrateContext(baseCtx);

        if (options?.enrichContext) {
          ctx = options.enrichContext(ctx);
        }

        // Flag first user message so the agent can respond more concisely
        const isFirstMessage = messages.filter(m => m.role === 'user').length <= 1;
        const ctxMsg = makeContextSystemMessage({ ...ctx, isFirstMessage } as ContextSnapshot & { isFirstMessage: boolean });

        if (process.env.NODE_ENV === 'development') {
          console.debug(`${label} Injected context:`, ctx);
        }

        return {
          body: {
            messages: [ctxMsg, ...filterDataParts(messages)],
            trigger,
            messageId,
          },
        };
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`${label} Failed to resolve context:`, error);
        }
        return {
          body: {
            messages: filterDataParts(messages),
            trigger,
            messageId,
          },
        };
      }
    },
  });
}
