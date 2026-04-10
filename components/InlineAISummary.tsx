"use client";

import { useEffect, useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";
import { useLanguage } from "@/components/language/language-context";
import { getInlineSummaryPrompt } from "@/lib/demo-config/translations";
import { MemoizedMarkdown } from "@/components/memoized-markdown";

// ============================================================================
// Types
// ============================================================================

interface ShowSummaryInput {
  summary: string;
  sources: Array<{ title: string; url: string; domain?: string }>;
}

// ============================================================================
// Sub-components
// ============================================================================

function SummaryHeader() {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-lg bg-[#9B2335]/8 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#9B2335]" />
        </div>
      </div>
      <div>
        <h3 className="text-[15px] font-bold text-[#1a1a1a] leading-tight">
          Resum amb IA
        </h3>
        <p className="text-[13px] text-[#666] mt-0.5 leading-snug">
          Aquest resum ha estat generat amb IA i pot contenir errors.
        </p>
      </div>
    </div>
  );
}

function SearchingState() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative">
        <Search className="w-4 h-4 text-[#9B2335]/60" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#9B2335] rounded-full animate-ping" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#555] font-medium">
            Cercant informaci&oacute;...
          </span>
          <div className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-[#9B2335]/40 animate-bounce [animation-delay:0ms]" />
            <span className="w-1 h-1 rounded-full bg-[#9B2335]/40 animate-bounce [animation-delay:150ms]" />
            <span className="w-1 h-1 rounded-full bg-[#9B2335]/40 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3.5 bg-[#e8e8e8] rounded-sm w-full animate-pulse" />
          <div className="h-3.5 bg-[#e8e8e8] rounded-sm w-[85%] animate-pulse [animation-delay:75ms]" />
          <div className="h-3.5 bg-[#e8e8e8] rounded-sm w-[70%] animate-pulse [animation-delay:150ms]" />
        </div>
      </div>
    </div>
  );
}

function SourcesList({
  sources,
}: {
  sources: ShowSummaryInput["sources"];
}) {
  if (!sources.length) return null;

  return (
    <div className="mt-4 pt-3 border-t border-[#e0e0e0]">
      <p className="text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-2">
        Fonts
      </p>
      <div className="space-y-1.5">
        {sources.map((source, i) => (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2.5 py-1.5 px-2 -mx-2 rounded-md hover:bg-[#ebebeb] transition-colors duration-150"
          >
            <span className="shrink-0 w-5 h-5 rounded-full bg-[#9B2335]/10 text-[#9B2335] flex items-center justify-center text-[11px] font-bold mt-px">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] text-[#1a1a1a] group-hover:text-[#9B2335] transition-colors font-medium leading-tight line-clamp-1">
                {source.title}
              </span>
              {source.domain && (
                <span className="text-[11px] text-[#999] block mt-0.5 leading-tight">
                  {source.domain}
                </span>
              )}
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#bbb] group-hover:text-[#9B2335] transition-colors shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/** Truncate markdown at a clean boundary without breaking syntax */
function truncateMarkdown(text: string): string {
  if (text.length <= 400) return text;
  const maxLen = 350;
  const chunk = text.slice(0, maxLen);
  const sentenceEnd = Math.max(
    chunk.lastIndexOf(". "),
    chunk.lastIndexOf(".\n"),
    chunk.lastIndexOf("? "),
    chunk.lastIndexOf("! ")
  );
  let cut = sentenceEnd > 100 ? sentenceEnd + 1 : -1;
  if (cut < 0) {
    const nl = chunk.lastIndexOf("\n");
    if (nl > 100) cut = nl;
  }
  if (cut < 0) {
    const sp = chunk.lastIndexOf(" ");
    if (sp > 100) cut = sp;
  }
  if (cut < 0) cut = maxLen;
  let truncated = text.slice(0, cut).trimEnd();
  const boldCount = (truncated.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) truncated += "**";
  return truncated + "...";
}

// ============================================================================
// Main Component
// ============================================================================

interface InlineAISummaryProps {
  query: string;
  submitCount: number;
}

export function InlineAISummary({ query, submitCount }: InlineAISummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [lastSubmitCount, setLastSubmitCount] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { openSidepanel, openSidepanelWithContext, setAgentSuggestions } = useSidepanel();
  const { t } = useLanguage();

  /** Build initial context messages from the summary for the sidepanel */
  const buildContextMessages = () => {
    // Get summary text from the current derived state
    const text =
      phase === "complete" && completedData
        ? completedData.summary
        : phase === "streaming"
          ? streamingSummary
          : phase === "fallback"
            ? fallbackText
            : "";
    if (!text) return null;
    return [
      {
        id: `summary-user-${Date.now()}`,
        role: "user" as const,
        parts: [{ type: "text" as const, text: query }],
      },
      {
        id: `summary-assistant-${Date.now()}`,
        role: "assistant" as const,
        parts: [{ type: "text" as const, text }],
      },
    ];
  };

  const agentId = ALGOLIA_CONFIG.AGENT_ID;

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: `https://${ALGOLIA_CONFIG.APP_ID}.algolia.net/agent-studio/1/agents/${agentId}/completions?stream=true&compatibilityMode=ai-sdk-5`,
      headers: {
        "x-algolia-application-id": ALGOLIA_CONFIG.APP_ID,
        "x-algolia-api-key": ALGOLIA_CONFIG.SEARCH_API_KEY,
        "content-type": "application/json",
      },
    });
  }, [agentId]);

  const chat = useChat({
    id: "inline-summary",
    transport,
    onData(dataPart) {
      if (dataPart.type === "data-suggestions") {
        const data = dataPart.data as { suggestions?: string[] };
        if (data?.suggestions) {
          setSuggestions(data.suggestions);
        }
      }
    },
    onToolCall: async ({ toolCall }) => {
      // Required so the SDK marks the tool call as handled
      if (toolCall.toolName === "showSummary") {
        return;
      }
    },
  });

  const isGenerating =
    chat.status === "submitted" || chat.status === "streaming";

  // ── Derive display state from message parts ──────────────────────────
  const { phase, streamingSummary, completedData, fallbackText } = useMemo(() => {
    const lastAssistant = [...chat.messages]
      .reverse()
      .find((m) => m.role === "assistant");

    if (!lastAssistant) {
      return { phase: "none" as const, streamingSummary: "", completedData: null, fallbackText: "" };
    }

    // Scan parts for showSummary tool call
    for (const part of lastAssistant.parts) {
      if (typeof part !== "object" || !("type" in part)) continue;
      const p = part as any;

      if (p.type === "tool-showSummary") {
        const data: ShowSummaryInput = {
          summary: p.input?.summary || "",
          sources: Array.isArray(p.input?.sources) ? p.input.sources : [],
        };
        if (p.state === "input-streaming") {
          return { phase: "streaming" as const, streamingSummary: data.summary, completedData: data, fallbackText: "" };
        }
        if (p.state === "input-available" || p.state === "output-available") {
          return { phase: "complete" as const, streamingSummary: "", completedData: data, fallbackText: "" };
        }
      }
    }

    // Check for algolia_search_index tool (still searching)
    for (const part of lastAssistant.parts) {
      if (typeof part !== "object" || !("type" in part)) continue;
      const p = part as any;
      if (p.type === "tool-algolia_search_index") {
        return { phase: "searching" as const, streamingSummary: "", completedData: null, fallbackText: "" };
      }
    }

    // Fallback: plain text response
    const text = lastAssistant.parts
      .filter(
        (p): p is { type: "text"; text: string } =>
          typeof p === "object" && "type" in p && (p as any).type === "text"
      )
      .map((p) => p.text)
      .join("");

    if (text) {
      return { phase: "fallback" as const, streamingSummary: "", completedData: null, fallbackText: text };
    }

    return { phase: "none" as const, streamingSummary: "", completedData: null, fallbackText: "" };
  }, [chat.messages]);

  // Push suggestions to sidepanel context
  const suggestionsKey = suggestions.join("|");
  useEffect(() => {
    if (suggestions.length > 0) {
      setAgentSuggestions(suggestions);
    }
  }, [suggestionsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger agent call on submit
  useEffect(() => {
    if (submitCount === lastSubmitCount) return;
    if (!query || query.length < 5) return;

    setLastSubmitCount(submitCount);
    if (query === lastQuery) return;

    chat.setMessages([]);
    setIsExpanded(false);
    setSuggestions([]);
    setTriggered(true);
    setLastQuery(query);

    chat.sendMessage({
      text: getInlineSummaryPrompt(query),
    });
  }, [submitCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Determine what to render ─────────────────────────────────────────

  // Not triggered yet
  if (!triggered) return null;

  // Determine the summary text and sources based on phase
  const summaryText =
    phase === "complete" && completedData
      ? completedData.summary
      : phase === "streaming"
        ? streamingSummary
        : phase === "fallback"
          ? fallbackText
          : "";

  const sources = completedData?.sources || [];

  const isSearching =
    (phase === "none" || phase === "searching") && isGenerating;

  const isStreaming = phase === "streaming";
  const hasContent = !!summaryText;

  const shouldTruncate = !isStreaming && summaryText.length > 400;
  const displayText =
    !isExpanded && shouldTruncate
      ? truncateMarkdown(summaryText)
      : summaryText;

  // Nothing to show at all
  if (!hasContent && !isGenerating && !isSearching) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#f5f5f5] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="px-6 py-5">
        <SummaryHeader />

        {/* Searching skeleton — shown when no content yet */}
        {isSearching && !hasContent && <SearchingState />}

        {/* Summary body — stable DOM, always mounted once content starts */}
        <div className={`flex gap-3 ${!hasContent ? "hidden" : ""}`}>
          <Bot className="w-5 h-5 text-[#999] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-[14.5px] text-[#2a2a2a] leading-[1.65] [&_p]:my-1 [&_strong]:font-semibold [&_strong]:text-[#1a1a1a] [&_a]:text-[#9B2335] [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-[#9B2335]/30 hover:[&_a]:decoration-[#9B2335] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:my-0.5">
              <MemoizedMarkdown
                content={displayText}
                id="inline-ai-summary"
              />
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-[#9B2335]/40 animate-pulse ml-0.5 align-middle rounded-sm" />
              )}
            </div>

            {/* Expand/collapse — directly under the text */}
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-[13px] text-[#9B2335] font-medium hover:text-[#7a1c2a] transition-colors mt-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Mostra&apos;n menys
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Mostra&apos;n m&eacute;s
                  </>
                )}
              </button>
            )}

            {/* Sources */}
            <SourcesList sources={sources} />
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#e0e0e0] ml-8">
            <div className="flex items-center gap-2 flex-wrap">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAgentSuggestions(suggestions);
                    const ctx = buildContextMessages();
                    if (ctx) {
                      openSidepanelWithContext(ctx, s);
                    } else {
                      openSidepanel(s);
                    }
                  }}
                  className="px-3 py-1.5 text-[12px] font-medium border border-[#ddd] rounded-full bg-white hover:bg-[#ebebeb] hover:border-[#9B2335]/30 text-[#333] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {(phase === "complete" || phase === "fallback") && (
          <div className="mt-3 pt-3 border-t border-[#e0e0e0] ml-8">
            <button
              onClick={() => {
                if (suggestions.length > 0) {
                  setAgentSuggestions(suggestions);
                }
                const ctx = buildContextMessages();
                if (ctx) {
                  openSidepanelWithContext(ctx, query);
                } else {
                  openSidepanel(query);
                }
              }}
              className="flex items-center gap-1 text-[13px] text-[#9B2335] font-medium hover:text-[#7a1c2a] transition-colors"
            >
              {t("ai.continueConversation")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
