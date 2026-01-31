"use client";

import { useEffect, useRef } from "react";
import { Brain } from "lucide-react";
import { useFollowUpQuestions } from "@/components/sidepanel-agent-studio/hooks/use-follow-up-questions";
import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";
import { getPageStateSignature } from "@/components/sidepanel-agent-studio/lib/context-snapshot";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";

/**
 * AgentSuggestions - Displays AI-generated contextual suggestions above search results.
 * Clicking a suggestion opens the agent sidepanel with that message.
 */
export function AgentSuggestions() {
  const { openSidepanel } = useSidepanel();
  const lastStateSigRef = useRef<string | null>(null);

  const {
    followUpQuestions,
    generateInitialSuggestions,
    isGenerating,
  } = useFollowUpQuestions({
    applicationId: ALGOLIA_CONFIG.APP_ID,
    apiKey: ALGOLIA_CONFIG.AGENT_API_KEY,
    agentId: ALGOLIA_CONFIG.SUGGESTION_AGENT_ID,
  });

  // Generate suggestions when page state changes
  useEffect(() => {
    // Skip if no suggestion agent configured
    if (!ALGOLIA_CONFIG.SUGGESTION_AGENT_ID || !ALGOLIA_CONFIG.AGENT_API_KEY) {
      return;
    }

    const currentStateSig = getPageStateSignature();
    if (lastStateSigRef.current !== currentStateSig) {
      lastStateSigRef.current = currentStateSig;
      generateInitialSuggestions(currentStateSig);
    }
  }, [generateInitialSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    openSidepanel(suggestion);
  };

  // Don't render if no agent configured
  if (!ALGOLIA_CONFIG.SUGGESTION_AGENT_ID || !ALGOLIA_CONFIG.AGENT_API_KEY) {
    return null;
  }

  // Show skeleton while generating
  if (isGenerating && followUpQuestions.length === 0) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Generating suggestions...</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 h-9 w-32 bg-muted/50 rounded-full animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Don't render if no suggestions
  if (followUpQuestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">Ask the assistant</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {followUpQuestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="shrink-0 px-4 py-2 text-sm font-medium border border-primary/30 rounded-full bg-primary/5 hover:bg-primary/10 hover:border-primary/50 text-primary transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 cursor-pointer"
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
