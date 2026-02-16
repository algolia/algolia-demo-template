// components/ProductAskAI.tsx
"use client";
import { ArrowUpIcon, SparklesIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/types/product";
import { useFollowUpQuestions } from "../hooks/use-follow-up-questions";
import { useSidepanel } from "../context/sidepanel-context";
import { getPageStateSignature } from "../lib/context-snapshot";

// ============================================================================
// Main Component
// ============================================================================

interface ProductAskAIProps {
  product: Product;
}

export default function ProductAskAI({ product }: ProductAskAIProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasGeneratedRef = useRef(false);

  // Separate instance of useFollowUpQuestions for product page
  const {
    followUpQuestions,
    generateInitialSuggestions,
    isGenerating,
    fallbackQuestions,
  } = useFollowUpQuestions({
    applicationId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
    apiKey: process.env.NEXT_PUBLIC_AGENT_API_KEY || "",
    agentId:
      process.env.NEXT_PUBLIC_ALGOLIA_SUGGESTION_AGENT_ID ||
      process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID ||
      "",
  });

  // Get sidepanel context to open it and send messages
  const { openSidepanel } = useSidepanel();

  // Generate initial suggestions on first render
  useEffect(() => {
    if (!hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      const stateSig = getPageStateSignature();
      generateInitialSuggestions(stateSig);
    }
  }, [generateInitialSuggestions]);

  const handleSubmit = useCallback(
    (text: string) => {
      // Open sidepanel and send the message
      openSidepanel(text);
      setInputValue("");
    },
    [openSidepanel]
  );

  // Use generated questions if available, otherwise fallback
  const questionsToShow =
    followUpQuestions.length > 0 ? followUpQuestions : fallbackQuestions;

  return (
    <div className="border border-border rounded-lg bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
        <SparklesIcon size={18} className="text-blue-600" />
        <h3 className="text-sm font-semibold text-foreground">
          Ask about this product
        </h3>
      </div>

      {/* Messages Area */}
      <div className="max-h-80 overflow-y-auto p-4 space-y-4 bg-muted/30">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ask any question about{" "}
            <span className="font-medium text-foreground">
              {product.title || "this product"}
            </span>
          </p>
          {isGenerating && followUpQuestions.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <SparklesIcon size={14} className="animate-pulse" />
              <span>Generating suggestions...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {questionsToShow.map((question: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSubmit(`${question}: ${product.title || "this product"}`)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-foreground hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-600 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 p-3 border-t border-border">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (inputValue.trim()) {
                handleSubmit(inputValue);
              }
            }
          }}
          rows={1}
          placeholder="Ask a question..."
          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50 resize-none"
        />
        <Button
          type="button"
          size="icon"
          onClick={() => {
            if (inputValue.trim()) {
              handleSubmit(inputValue);
            }
          }}
          disabled={!inputValue.trim()}
        >
          <ArrowUpIcon size={16} />
        </Button>
      </div>
    </div>
  );
}
