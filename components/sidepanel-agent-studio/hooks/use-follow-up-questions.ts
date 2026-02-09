import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useInstantSearch } from 'react-instantsearch';
import {
  resolveContextWithUiState,
  hydrateContext,
  makeContextSystemMessage,
} from '@/components/sidepanel-agent-studio/lib/context-snapshot';

// Configuration for the follow-up questions agent
export interface FollowUpQuestionsConfig {
  applicationId: string;
  apiKey: string;
  agentId: string;
}

export type ToolCallInput = {
  questions: string[];
};

export type ToolCallOutput = {
  status: 'Successfully generated follow-up questions';
  question: string;
};

export type FollowUpQuestionsToolCall = {
  tool: 'suggestedQuestions';
  toolCallId: string;
  input: ToolCallInput;
  output?: ToolCallOutput;
};

// Fallback suggestions to show in empty state or when generation fails
export const FALLBACK_FOLLOW_UP_QUESTIONS = [
  "Muéstrame los ingredientes de este producto",
  "Buscar suplementos de proteína",
  "Ver opciones veganas disponibles",
  "Comparar con productos similares",
  "Explorar vitaminas y minerales",
];

// Extract questions from assistant message parts
function extractQuestionsFromMessages(
  messages: UIMessage[]
): string[] {
  const questions: string[] = [];

  for (const message of messages) {
    if (message.role !== 'assistant') continue;

    for (const part of message.parts) {
      // Check for tool calls that contain questions (AI SDK v5 format)
      // Handle both input-available and output-available states
      if (part.type === 'tool-suggestedQuestions' && 'state' in part) {
        const state = part.state as string;
        
        // When tool input is available (questions are in input.questions)
        if (
          (state === 'input-available' || state === 'input-streaming') &&
          'input' in part &&
          part.input
        ) {
          const input = part.input as ToolCallInput;
          if (input?.questions && Array.isArray(input.questions)) {
            questions.push(...input.questions);
            continue;
          }
        }
        
        // When tool output is available (questions might be in output)
        if (
          (state === 'output-available' || state === 'output-streaming') &&
          'output' in part &&
          part.output
        ) {
          const output = part.output as { questions?: string[] };
          if (output?.questions && Array.isArray(output.questions)) {
            questions.push(...output.questions);
          }
        }
      }
    }
  }

  return questions;
}

export function useFollowUpQuestions(config: FollowUpQuestionsConfig) {
  if (!config) {
    throw new Error('config is required for useFollowUpQuestions');
  }

  const { indexUiState } = useInstantSearch();

  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const lastProcessedExchangeIdRef = useRef<string | null>(null);
  const lastProcessedStateSigRef = useRef<string | null>(null);

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
          const baseCtx = resolveContextWithUiState(indexUiState);
          // Hydrate with product data if on a product page
          const ctx = await hydrateContext(baseCtx);
          // Create context message
          const ctxMsg = makeContextSystemMessage(ctx);

          if (process.env.NODE_ENV === 'development') {
            console.debug('[Suggestion Agent] Injected context:', ctx);
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
            console.warn('[Suggestion Agent] Failed to resolve context:', error);
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
  }, [apiUrl, config.applicationId, config.apiKey, indexUiState]);

  const chat = useChat({
    transport,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === 'suggestedQuestions') {
        const input = toolCall.input as ToolCallInput;
        
        // Store the generated questions
        if (input?.questions && Array.isArray(input.questions)) {
          setFollowUpQuestions(input.questions); // Limit to 3 questions
        }

        chat.addToolOutput({
          tool: 'suggestedQuestions',
          toolCallId: toolCall.toolCallId,
          output: {
            status: 'Successfully generated follow-up questions',
            question: input.questions?.[0] || '',
          },
        });
      }
    },
  });

  const isGenerating =
    chat.status === 'submitted' || chat.status === 'streaming';

  // Generate follow-up questions based on conversation history
  const generateFollowUps = useCallback(
    (conversationHistory: UIMessage[], exchangeId: string) => {
      // Prevent duplicate generation for the same exchange
      if (lastProcessedExchangeIdRef.current === exchangeId) {
        return;
      }
      lastProcessedExchangeIdRef.current = exchangeId;

      // Clear previous questions and messages
      setFollowUpQuestions([]);
      chat.setMessages?.([]);

      // Build a summary of the conversation for the follow-up agent
      const conversationSummary = conversationHistory
        .map((msg) => {
          const textParts = msg.parts
            .filter((part) => part.type === 'text')
            .map((part) => (part as { type: 'text'; text: string }).text)
            .join(' ');
          return `${msg.role}: ${textParts}`;
        })
        .join('\n');

      // Send to follow-up agent
      chat.sendMessage({
        text: `\n\n${conversationSummary}`,
      });
    },
    [chat]
  );

  // Generate initial suggestions based on current page state (empty chat state)
  const generateInitialSuggestions = useCallback(
    (stateSig: string) => {
      // Prevent duplicate generation for the same page state
      if (lastProcessedStateSigRef.current === stateSig) {
        return;
      }
      lastProcessedStateSigRef.current = stateSig;

      // Clear previous questions and messages
      setFollowUpQuestions([]);
      chat.setMessages?.([]);

      if (process.env.NODE_ENV === 'development') {
        console.debug('[Suggestion Agent] Generating initial suggestions for state:', stateSig);
      }

      // Send to follow-up agent - context is injected via transport
      chat.sendMessage({
        text:
          'Genera esattamente 3 suggerimenti brevi y accionables que un usuario podría escribir. ' +
          'Deben ser frases que el usuario podría decir, no preguntas. ' +
          'Relevantes al contexto de la página/búsqueda actual. ' +
          'Devuélvelas SOLO mediante la llamada al tool suggestedQuestions en input.questions.',
      });
    },
    [chat]
  );

  // Reset for new conversation
  const reset = useCallback(() => {
    setFollowUpQuestions([]);
    lastProcessedExchangeIdRef.current = null;
    lastProcessedStateSigRef.current = null;
    chat.setMessages?.([]);
  }, [chat]);

  // Extract any questions from the chat messages (in case tool call format differs)
  const extractedQuestions = useMemo(
    () => extractQuestionsFromMessages(chat.messages),
    [chat.messages]
  );

  // Use extracted questions if available, otherwise use stored questions from onToolCall
  const questions =
    extractedQuestions.length > 0 ? extractedQuestions : followUpQuestions;

  return {
    followUpQuestions: questions,
    fallbackQuestions: FALLBACK_FOLLOW_UP_QUESTIONS,
    generateFollowUps,
    generateInitialSuggestions,
    isGenerating,
    reset,
  };
}
