import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo } from "react";
import { CheckoutContext } from "@/lib/types/checkout-context";

export interface CheckoutSuggestionAgentConfig {
  applicationId: string;
  apiKey: string;
  agentId: string;
  context?: CheckoutContext;
}

export type SuggestionItem = {
  ObjectID: string;
  reasoning: string;
};

export type SuggestProductsWithReasonToolCallInput = {
  items: SuggestionItem[];
};

export type SuggestProductsWithReasonToolCallOutput = {
  status: string;
  items: SuggestionItem[];
};

export type SuggestProductsWithReasonToolCall = {
  type: "tool-SuggestProductsWithReason";
  toolCallId: string;
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: SuggestProductsWithReasonToolCallInput;
  output?: SuggestProductsWithReasonToolCallOutput;
};

export function useCheckoutSuggestionAgent(
  config: CheckoutSuggestionAgentConfig
) {
  const apiUrl = useMemo(
    () =>
      `https://${config.applicationId}.algolia.net/agent-studio/1/agents/${config.agentId}/completions?stream=true&compatibilityMode=ai-sdk-5`,
    [config.applicationId, config.agentId]
  );

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: apiUrl,
      headers: {
        "x-algolia-application-id": config.applicationId,
        "x-algolia-api-key": config.apiKey,
        "content-type": "application/json",
      },
    });
  }, [apiUrl, config.applicationId, config.apiKey]);

  const chat = useChat({
    transport,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === "SuggestProductsWithReason") {
        const input = toolCall.input as SuggestProductsWithReasonToolCallInput;

        chat.addToolOutput({
          tool: "SuggestProductsWithReason",
          toolCallId: toolCall.toolCallId,
          state: "output-available",
          output: {
            status: "success",
            items: input.items,
          } as SuggestProductsWithReasonToolCallOutput,
        });
      }
    },
  });

  const isGenerating =
    chat.status === "submitted" || chat.status === "streaming";

  function formatContextMessage(context: CheckoutContext): string {
    return `[CONTEXT]${JSON.stringify(context)}[/CONTEXT]`;
  }

  const generateSuggestions = useCallback(() => {
    const contextPrefix = config.context
      ? formatContextMessage(config.context)
      : "";

    chat.sendMessage({
      text: `${contextPrefix}Suggest complementary products for this checkout.`,
    });
  }, [chat, config.context]);

  return {
    generateSuggestions,
    messages: chat.messages,
    isGenerating,
    status: chat.status,
  };
}