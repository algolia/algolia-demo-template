import { useChat, type UIMessage } from '@ai-sdk/react';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useInstantSearch } from 'react-instantsearch';
import { buildAgentApiUrl, createAgentTransport } from '@/components/sidepanel-agent-studio/lib/create-agent-transport';
import { AGENT_CONFIG } from '@/lib/demo-config/agents';

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

// Re-export for backward compatibility
export const FALLBACK_FOLLOW_UP_QUESTIONS = AGENT_CONFIG.suggestion.fallbackQuestions;

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

  // Keep a ref to always read the latest indexUiState at call time,
  // avoiding stale closures in the memoized transport.
  const indexUiStateRef = useRef(indexUiState);
  useEffect(() => {
    indexUiStateRef.current = indexUiState;
  }, [indexUiState]);

  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const lastProcessedExchangeIdRef = useRef<string | null>(null);
  const lastProcessedStateSigRef = useRef<string | null>(null);

  const apiUrl = useMemo(() => buildAgentApiUrl(config), [config.applicationId, config.agentId]);

  const transport = useMemo(() => {
    return createAgentTransport(apiUrl, config, indexUiStateRef, {
      debugLabel: '[Suggestion Agent]',
    });
  }, [apiUrl, config, indexUiStateRef]);

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
          'Generate exactly 3 short, actionable suggestions that a user might type. ' +
          'They should be phrases the user could say, not questions. ' +
          'Make them relevant to the current page/search context. ' +
          'Return them ONLY via the suggestedQuestions tool call in input.questions.',
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
