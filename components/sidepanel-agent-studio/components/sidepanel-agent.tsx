"use client";

import type { UIMessage } from "@ai-sdk/react";
import type { UIDataTypes, UIMessagePart } from "ai";
import {
  ArrowUpIcon,
  BookOpen,
  BrainIcon,
  CheckIcon,
  ChevronDown,
  CopyIcon,
  Link2Icon,
  Maximize2,
  MicIcon,
  MicOffIcon,
  Minimize2,
  SearchIcon,
  ShoppingCartIcon,
  SparklesIcon,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  XIcon,
} from "lucide-react";
import { marked, type Tokens } from "marked";
import type React from "react";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type FC,
  memo,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import { useSearchBox, useInstantSearch } from "react-instantsearch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AgentStudioConfig,
  useAgentStudio,
} from "@/components/sidepanel-agent-studio/hooks/use-agent-studio";

import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";
import { AGENT_CONFIG } from "@/lib/demo-config/agents";
import { Product } from "@/lib/types/product";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { CompactProductListItem } from "@/components/ProductCard";
import { getObjectsByIds } from "@/lib/getObjectByIDs";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { DEMO_CONFIG } from "@/lib/demo-config";

// ============================================================================
// Types
// ============================================================================

export interface SidepanelAskAIConfig {
  /** Algolia Application ID (required) */
  applicationId: string;
  /** Algolia API Key (required) */
  apiKey: string;
  /** Algolia Index Name (required) */
  indexName: string;
  /** AI Assistant ID (required for chat functionality) */
  assistantId: string;
  /** Suggested Questions Enabled (optional, defaults to false) */
  suggestedQuestionsEnabled?: boolean;
  /** Placeholder text for input (optional, defaults to "Ask AI anything about Algolia") */
  placeholder?: string;
  /** Custom button text (optional, defaults to "Ask AI") */
  buttonText?: string;
  /** Custom button props (optional) */
  buttonProps?: React.ComponentProps<typeof Button>;
  /** Display variant (optional, defaults to 'floating') */
  variant?: "floating" | "inline";
}

export interface AlgoliaSearchIndexTool {
  input: {
    query: string;
    index?: string;
    filters?: string;
    facet_filters?: string[][];
    number_of_results?: number;
  };
  output: {
    query: string;
    filters?: string;
    facet_filters?: string[][];
    hits: Product[];
    nbHits?: number;
    queryID?: string;
  };
}

export interface ShowItemsTool {
  input: {
    objectIDs: string[];
    title?: string;
    explanation?: string;
  };
  output: {
    status: string;
    products: Product[];
    title?: string;
    explanation?: string;
  };
}

export interface AddToCartTool {
  input: {
    objectIDs: string[];
  };
  output: {
    status: string;
    products: Product[];
  };
}

export interface ArticleItem {
  title: string;
  summary: string;
  url?: string;
  category?: string;
}

export interface ShowArticlesTool {
  input: {
    articles: ArticleItem[];
    title?: string;
  };
  output: {
    status: string;
    articles: ArticleItem[];
    title?: string;
  };
}

export type Message = UIMessage<
  unknown,
  UIDataTypes,
  {
    algolia_search_index: AlgoliaSearchIndexTool;
    showItems: ShowItemsTool;
    addToCart: AddToCartTool;
    showArticles: ShowArticlesTool;
  }
>;

export type AIMessagePart = UIMessagePart<
  UIDataTypes,
  {
    algolia_search_index: AlgoliaSearchIndexTool;
    showItems: ShowItemsTool;
    addToCart: AddToCartTool;
    showArticles: ShowArticlesTool;
  }
>;

interface Exchange {
  id: string;
  userMessage: Message;
  assistantMessage: Message | null;
}

interface ExtractedLink {
  url: string;
  title?: string;
}

// ============================================================================
// Utilities & Helpers
// ============================================================================

function useClipboard() {
  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Silently fail - clipboard access might be blocked
    }
  }, []);

  return { copyText };
}

function escapeHtml(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Formats facet_filters array into a readable string.
 * Input: [["inStock:true"], ["categories.lvl1: Vitaminas", "categories.lvl1: Minerales"]]
 * Output: "inStock:true AND (categories.lvl1: Vitaminas OR categories.lvl1: Minerales)"
 */
function formatFacetFilters(facetFilters: (string | string[])[] | undefined): string | null {
  if (!facetFilters || facetFilters.length === 0) return null;

  const formatted = facetFilters.map((group) => {
    // A group can be a plain string (single filter) or an array (OR'd filters)
    if (typeof group === 'string') {
      return group;
    }
    if (group.length === 1) {
      return group[0];
    }
    // Multiple values in a group are OR'd together
    return `(${group.join(" OR ")})`;
  });

  return formatted.join(" AND ");
}

function extractLinksFromMessage(message: Message | null): ExtractedLink[] {
  const links: ExtractedLink[] = [];

  // Used to dedupe multiple urls
  const seen = new Set<string>();

  if (!message) {
    return [];
  }

  message.parts.forEach((part) => {
    if (part.type !== "text") {
      return;
    }

    if (part.text.length === 0) {
      return;
    }

    const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const plainLinkRegex = /(?<!\]\()https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

    // Strip out all code blocks e.g. ```
    const textWithoutCodeBlocks = part.text.replace(/```[\s\S]*?```/g, "");

    // Strip out all inline code blocks e.g. `
    const cleanText = textWithoutCodeBlocks.replace(/`[^`]*`/g, "");

    // Get all markdown image links to exclude them
    const imageMatches = cleanText.matchAll(markdownImageRegex);
    const imageUrls = new Set<string>();
    for (const match of imageMatches) {
      imageUrls.add(match[2]);
    }

    // Get all markdown based links e.g. []()
    const markdownMatches = cleanText.matchAll(markdownLinkRegex);

    // Parses the title and url from the found links
    for (const match of markdownMatches) {
      const title = match[1].trim();
      const url = match[2];

      // Skip image URLs
      if (imageUrls.has(url)) {
        continue;
      }

      if (!seen.has(url)) {
        seen.add(url);
        links.push({ url, title: title || undefined });
      }
    }

    // Get all "plain" links e.g. https://algolia.com/doc
    const plainUrls = cleanText.matchAll(plainLinkRegex);

    for (const match of plainUrls) {
      // Strip any extra punctuation
      const cleanUrl = match[0].replace(/[.,;:!?]+$/, "");

      // Skip image URLs
      if (imageUrls.has(cleanUrl)) {
        continue;
      }

      if (!seen.has(cleanUrl)) {
        seen.add(cleanUrl);
        links.push({ url: cleanUrl });
      }
    }
  });

  return links;
}

// ============================================================================
// Markdown Renderer
// ============================================================================

const markdownRenderer = new marked.Renderer();

markdownRenderer.code = ({ text, lang = "", escaped }: Tokens.Code): string => {
  const languageClass = lang ? `language-${lang}` : "";
  const safeCode = escaped ? text : escapeHtml(text);
  const encodedCode = encodeURIComponent(text);

  const copyIconSvg = `
    <svg class="markdown-copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="m5 15-4-4 4-4"></path>
    </svg>
  `;

  const checkIconSvg = `
    <svg class="markdown-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  `;

  return `
    <div class="markdown-code-snippet">
      <button class="markdown-copy-button" data-code="${encodedCode}" aria-label="Copy code to clipboard" title="Copy code">
        ${copyIconSvg}${checkIconSvg}
        <span class="markdown-copy-label">Copy</span>
      </button>
      <pre><code class="${languageClass}">${safeCode}</code></pre>
    </div>
  `;
};

markdownRenderer.link = ({ href, title, text }: Tokens.Link): string => {
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
  const hrefAttr = href ? escapeHtml(href) : "";
  const textContent = text || "";

  return `<a href="${hrefAttr}" target="_blank" rel="noopener noreferrer"${titleAttr}>${textContent}</a>`;
};

// ============================================================================
// UI Helper Components
// ============================================================================
export interface AnimatedShinyTextProps
  extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number;
}
export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  shimmerWidth = 100,
  ...props
}) => {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className="text-neutral-600/70 dark:text-neutral-400/70 animate-shiny-text bg-size-[var(--shiny-width)_100%] bg-clip-text bg-position-[0_0] bg-no-repeat [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite] bg-linear-to-r from-transparent via-black/80 via-50% to-transparent dark:via-white/80"
      {...props}
    >
      {children}
    </span>
  );
};

// ============================================================================
// Markdown Component
// ============================================================================

interface MemoizedMarkdownProps {
  children: string;
  className?: string;
}

const MemoizedMarkdown = memo(function MemoizedMarkdown({
  children,
  className = "",
}: MemoizedMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    try {
      return marked(children, {
        renderer: markdownRenderer,
        breaks: true,
        gfm: true,
      });
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return escapeHtml(children);
    }
  }, [children]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleCopyClick = async (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest(
        ".markdown-copy-button"
      ) as HTMLButtonElement;

      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const encodedCode = button.getAttribute("data-code");
      if (!encodedCode) return;

      try {
        const code = decodeURIComponent(encodedCode);
        await navigator.clipboard.writeText(code);

        button.classList.add("markdown-copied");

        setTimeout(() => {
          button.classList.remove("markdown-copied");
        }, 2000);
      } catch (error) {
        console.error("Failed to copy code:", error);
      }
    };

    container.addEventListener("click", handleCopyClick);

    return () => {
      container.removeEventListener("click", handleCopyClick);
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={`text-foreground [word-break:break-word] leading-relaxed max-w-none flex flex-col word [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:mb-2 [&_h1]:text-foreground [&_h1]:text-2xl [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-2
        [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:mb-2 [&_h2]:text-foreground [&_h2]:text-xl
        [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:mb-2 [&_h3]:text-foreground [&_h3]:text-lg
        [&_h4]:font-semibold [&_h4]:leading-tight [&_h4]:mb-2 [&_h4]:text-foreground [&_h4]:text-base
        [&_h5]:font-semibold [&_h5]:leading-tight [&_h5]:mb-2 [&_h5]:text-foreground [&_h5]:text-base
        [&_h6]:font-semibold [&_h6]:leading-tight [&_h6]:mb-2 [&_h6]:text-foreground [&_h6]:text-base
        [&_p]:p-0 [&_p]:my-2 [&_p:last-child]:mb-0
        [&_a]:text-blue-600 [&_a]:no-underline [&_a]:border-b [&_a]:border-transparent [&_a]:transition-all [&_a]:duration-200 [&_a:hover]:border-blue-600 [&_a:hover]:bg-blue-50 dark:[&_a:hover]:bg-slate-900
        [&_ul]:ps-6 [&_ul]:mt-0 [&_ul]:mb-0 [&_ul]:list-disc
        [&_ol]:ps-6 [&_ol]:mt-0 [&_ol]:mb-0 [&_ol]:list-decimal
        [&_li]:mb-1 [&_li::marker]:text-muted-foreground
        [&_ul_ul]:mb-0 [&_ul_ul]:mt-1 [&_ol_ol]:mb-0 [&_ol_ol]:mt-1 [&_ul_ol]:mb-0 [&_ul_ol]:mt-1 [&_ol_ul]:mb-0 [&_ol_ul]:mt-1
        [&_code:not(.markdown-code-snippet_code)]:bg-muted [&_code:not(.markdown-code-snippet_code)]:text-foreground [&_code:not(.markdown-code-snippet_code)]:text-sm [&_code:not(.markdown-code-snippet_code)]:font-mono [&_code:not(.markdown-code-snippet_code)]:px-1 [&_code:not(.markdown-code-snippet_code)]:py-0.5 [&_code:not(.markdown-code-snippet_code)]:rounded [&_code:not(.markdown-code-snippet_code)]:border [&_code:not(.markdown-code-snippet_code)]:border-border
        [&_.markdown-code-snippet]:relative [&_.markdown-code-snippet]:my-4 [&_.markdown-code-snippet]:rounded-lg [&_.markdown-code-snippet]:overflow-hidden [&_.markdown-code-snippet]:border [&_.markdown-code-snippet]:border-border [&_.markdown-code-snippet]:bg-muted
        [&_.markdown-code-snippet_pre]:m-0 [&_.markdown-code-snippet_pre]:p-4 [&_.markdown-code-snippet_pre]:overflow-x-auto [&_.markdown-code-snippet_pre]:text-sm [&_.markdown-code-snippet_pre]:leading-normal [&_.markdown-code-snippet_pre]:font-mono [&_.markdown-code-snippet_pre]:bg-transparent
        [&_.markdown-code-snippet_code]:bg-transparent [&_.markdown-code-snippet_code]:text-foreground [&_.markdown-code-snippet_code]:p-0 [&_.markdown-code-snippet_code]:border-none
        [&_.markdown-copy-button]:absolute [&_.markdown-copy-button]:top-2 [&_.markdown-copy-button]:right-2 [&_.markdown-copy-button]:flex [&_.markdown-copy-button]:items-center [&_.markdown-copy-button]:gap-1 [&_.markdown-copy-button]:px-3 [&_.markdown-copy-button]:py-1.5 [&_.markdown-copy-button]:bg-background [&_.markdown-copy-button]:border [&_.markdown-copy-button]:border-border [&_.markdown-copy-button]:rounded-md [&_.markdown-copy-button]:text-xs [&_.markdown-copy-button]:cursor-pointer [&_.markdown-copy-button]:transition-all [&_.markdown-copy-button]:duration-200 [&_.markdown-copy-button]:text-foreground [&_.markdown-copy-button]:opacity-0 [&_.markdown-copy-button]:-translate-y-1
        [&_.markdown-code-snippet:hover_.markdown-copy-button]:opacity-100 [&_.markdown-code-snippet:hover_.markdown-copy-button]:translate-y-0
        [&_.markdown-copy-button:hover]:bg-blue-50 dark:[&_.markdown-copy-button:hover]:bg-slate-900 [&_.markdown-copy-button:hover]:shadow-sm
        [&_.markdown-copy-button_.markdown-check-icon]:hidden
        [&_.markdown-copy-button.markdown-copied_.markdown-copy-icon]:hidden
        [&_.markdown-copy-button.markdown-copied_.markdown-check-icon]:block
        [&_.markdown-copy-button.markdown-copied]:text-green-600 [&_.markdown-copy-button.markdown-copied]:border-green-600
        [&_.markdown-copy-label]:font-medium
        [&_.markdown-copied_.markdown-copy-label]:after:content-['ed']
        [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_table]:bg-background [&_table]:my-4 [&_table]:rounded-lg [&_table]:border [&_table]:border-border [&_table]:overflow-hidden
        [&_thead]:bg-muted
        [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th]:border-b-2 [&_th]:border-border
        [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-border [&_td]:text-foreground
        [&_tr:last-child_td]:border-b-0
        [&_tbody_tr:hover]:bg-blue-50 dark:[&_tbody_tr:hover]:bg-slate-900
        [&_blockquote]:border-l-4 [&_blockquote]:border-blue-600 [&_blockquote]:my-4 [&_blockquote]:py-2 [&_blockquote]:px-4 [&_blockquote]:bg-blue-50 [&_blockquote]:text-foreground [&_blockquote]:italic
        [&_blockquote_p]:mb-2 [&_blockquote_p:last-child]:mb-0
        [&_strong]:font-semibold [&_strong]:text-foreground
        [&_em]:italic
        [&_hr]:border-none [&_hr]:border-t [&_hr]:border-border [&_hr]:my-6
        [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-2
        ${className}`.trim()}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: its alright :)
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

// ============================================================================
// Related Sources Component
// ============================================================================

// ============================================================================
// Show Items Component (displays products from showItems tool)
// ============================================================================

interface ShowItemsDisplayProps {
  products: Product[];
  title?: string;
  explanation?: string;
  isLoading?: boolean;
}

const ShowItemsDisplay = memo(function ShowItemsDisplay({
  products,
  title,
  explanation,
  isLoading,
}: ShowItemsDisplayProps) {
  if (isLoading) {
    return (
      <div className="my-3 p-4 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <SparklesIcon size={14} className="animate-pulse" />
          <AnimatedShinyText>Loading products...</AnimatedShinyText>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="my-3">
      {(title || explanation) && (
        <div className="mb-3">
          {title && (
            <h4 className="font-semibold text-foreground text-sm mb-1">{title}</h4>
          )}
          {explanation && (
            <p className="text-muted-foreground text-sm">{explanation}</p>
          )}
        </div>
      )}
      <div className="grid gap-2">
        {products.map((product, index) => (
          <CompactProductListItem
            key={product.objectID || index}
            product={product}
          />
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// Show Articles Component (displays articles from showArticles tool)
// ============================================================================

interface ShowArticlesDisplayProps {
  articles: ArticleItem[];
  title?: string;
  isLoading?: boolean;
}

const ShowArticlesDisplay = memo(function ShowArticlesDisplay({
  articles,
  title,
  isLoading,
}: ShowArticlesDisplayProps) {
  if (isLoading) {
    return (
      <div className="my-3 p-4 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
          <BookOpen size={14} className="animate-pulse" />
          <AnimatedShinyText>Loading articles...</AnimatedShinyText>
        </div>
      </div>
    );
  }

  if (!articles || articles.length === 0) return null;

  return (
    <div className="my-3">
      {title && (
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={14} className="text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-foreground text-sm">{title}</h4>
          <span className="text-[10px] font-medium text-blue-500/70 dark:text-blue-400/60">
            articles
          </span>
        </div>
      )}
      <div className="grid gap-2">
        {articles.map((article, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          >
            <div className="flex items-start gap-2">
              <div className="shrink-0 w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mt-0.5">
                <BookOpen size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                {article.url ? (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
                  >
                    {article.title}
                  </a>
                ) : (
                  <p className="font-medium text-sm text-foreground line-clamp-2">
                    {article.title}
                  </p>
                )}
                {article.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {article.summary}
                  </p>
                )}
                {article.category && (
                  <span className="inline-block text-[10px] font-medium text-blue-600/80 dark:text-blue-400/80 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded mt-1.5">
                    {article.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// Search Results Preview Component (fetches full product data with images)
// ============================================================================

interface SearchResultsPreviewProps {
  hits: Product[];
  onViewMore: () => void;
}

const SearchResultsPreview = memo(function SearchResultsPreview({
  hits,
  onViewMore,
}: SearchResultsPreviewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!hits || hits.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const objectIDs = hits
          .slice(0, 3)
          .map((hit) => hit.objectID)
          .filter(Boolean) as string[];

        if (objectIDs.length === 0) {
          setProducts(hits.slice(0, 3));
          setIsLoading(false);
          return;
        }

        const fullProducts = await getObjectsByIds<Product>(
          objectIDs,
          ALGOLIA_CONFIG.INDEX_NAME
        );
        setProducts(fullProducts.filter(Boolean));
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts(hits.slice(0, 3));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [hits]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <SparklesIcon size={14} className="animate-pulse" />
          <AnimatedShinyText>Loading products...</AnimatedShinyText>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3">
        {products.map((product) => (
          <CompactProductListItem
            key={product.objectID}
            product={product}
          />
        ))}
      </div>
      {hits.length > 3 && (
        <button
          type="button"
          className="w-full text-xs text-muted-foreground text-center pt-3 mt-2 border-t border-border cursor-pointer hover:text-foreground transition-colors"
          onClick={onViewMore}
        >
          +{hits.length - 3} more result{hits.length - 3 !== 1 ? "s" : ""}
        </button>
      )}
    </>
  );
});

// ============================================================================
// Article Search Results Preview (displays article hits in hover popover)
// ============================================================================

interface ArticleSearchResultsPreviewProps {
  hits: Array<{ objectID?: string; title?: string; summary?: string; url?: string; categories?: string[] }>;
}

const ArticleSearchResultsPreview = memo(function ArticleSearchResultsPreview({
  hits,
}: ArticleSearchResultsPreviewProps) {
  if (!hits || hits.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">No articles found</div>
    );
  }

  return (
    <div className="grid gap-2">
      {hits.slice(0, 5).map((hit, index) => (
        <div
          key={hit.objectID || index}
          className="p-3 rounded-md border border-border bg-background hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
        >
          <div className="flex items-start gap-2">
            <div className="shrink-0 w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mt-0.5">
              <BookOpen size={12} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              {hit.url ? (
                <a
                  href={hit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sm text-foreground hover:text-blue-600 transition-colors line-clamp-2"
                >
                  {hit.title}
                </a>
              ) : (
                <p className="font-medium text-sm text-foreground line-clamp-2">{hit.title}</p>
              )}
              {hit.summary && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{hit.summary}</p>
              )}
              {hit.categories?.[0] && (
                <span className="inline-block text-[10px] font-medium text-blue-600/80 dark:text-blue-400/80 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded mt-1">
                  {hit.categories[0]}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

// ============================================================================
// Collapsible Search Group (groups 2+ consecutive search tool calls)
// ============================================================================

const CollapsibleSearchGroup = memo(function CollapsibleSearchGroup({
  queries,
  children,
}: {
  queries: string[];
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="my-1">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-start gap-1.5 text-[0.85rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-0.5 text-left"
      >
        <ChevronDown
          size={14}
          className={`shrink-0 mt-0.5 transition-transform duration-200 ${
            isExpanded ? "" : "-rotate-90"
          }`}
        />
        <SearchIcon size={12} className="shrink-0 mt-0.5" />
        <span className="min-w-0">
          {queries.length} searches
          {!isExpanded && queries.length > 0 && (
            <span className="text-muted-foreground/60">
              {" — "}
              {queries.map((q) => `"${q}"`).join(", ")}
            </span>
          )}
        </span>
      </button>
      {isExpanded && (
        <div className="ml-5 mt-1 border-l-2 border-border pl-3">
          {children}
        </div>
      )}
    </div>
  );
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function groupConsecutiveSearches(
  elements: React.ReactNode[],
  parts: any[]
): React.ReactNode[] {
  // Fast path: check if there are 2+ consecutive search parts
  let consecutive = 0;
  let hasGroup = false;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (typeof p !== "string" && p?.type === "tool-algolia_search_index") {
      consecutive++;
      if (consecutive >= 2) {
        hasGroup = true;
        break;
      }
    } else {
      consecutive = 0;
    }
  }
  if (!hasGroup) return elements;

  const result: React.ReactNode[] = [];
  let i = 0;
  while (i < elements.length) {
    const p = parts[i];
    if (typeof p !== "string" && p?.type === "tool-algolia_search_index") {
      const start = i;
      const queries: string[] = [];
      while (i < elements.length) {
        const curr = parts[i];
        if (
          typeof curr !== "string" &&
          curr?.type === "tool-algolia_search_index"
        ) {
          const q = curr.input?.query || curr.output?.query || "";
          if (q) queries.push(q);
          i++;
        } else {
          break;
        }
      }
      if (i - start >= 2) {
        result.push(
          <CollapsibleSearchGroup
            key={`search-group-${start}`}
            queries={queries}
          >
            {elements.slice(start, i)}
          </CollapsibleSearchGroup>
        );
      } else {
        result.push(elements[start]);
      }
    } else {
      result.push(elements[i]);
      i++;
    }
  }
  return result;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================================
// Follow-up Questions Component
// ============================================================================

interface FollowUpQuestionsProps {
  questions: string[];
  isGenerating: boolean;
  onQuestionClick: (question: string) => void;
}

const FollowUpQuestions = memo(function FollowUpQuestions({
  questions,
  isGenerating,
  onQuestionClick,
}: FollowUpQuestionsProps) {
  if (isGenerating) {
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <SparklesIcon size={14} className="animate-pulse" />
          <AnimatedShinyText>
            Generating suggestions...
          </AnimatedShinyText>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
        <SparklesIcon size={12} />
        Try saying
      </h3>
      <div className="flex flex-col gap-2">
        {questions.map((question, index) => (
          <button
            key={`followup-${index}`}
            type="button"
            onClick={() => onQuestionClick(question)}
            className="text-left px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground hover:bg-blue-50 dark:hover:bg-slate-900 hover:border-blue-600 transition-colors duration-200 cursor-pointer"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// Chat Component
// ============================================================================

interface ChatWidgetProps {
  messages: Message[];
  error: Error | null;
  isGenerating: boolean;
  onCopy?: (text: string) => Promise<void> | void;
  onThumbsUp?: (userMessageId: string) => Promise<void> | void;
  onThumbsDown?: (userMessageId: string) => Promise<void> | void;
  applicationId: string;
  assistantId: string;
  onSuggestedQuestionClick: (question: string) => void;
  followUpQuestions: string[];
  isFollowUpGenerating: boolean;
}

const ChatWidget = memo(function ChatWidget({
  messages,
  error,
  isGenerating,
  onCopy,
  onSuggestedQuestionClick,
  followUpQuestions,
  isFollowUpGenerating,
}: ChatWidgetProps) {
  const { copyText } = useClipboard();
  const { setIndexUiState } = useInstantSearch();
  const [copiedExchangeId, setCopiedExchangeId] = useState<string | null>(null);

  // Apply search query and facet filters to InstantSearch in a single atomic update
  const applySearchWithFilters = useCallback(
    (query: string, facetFilters?: string[][], filters?: string) => {
      setIndexUiState(() => {
        const newState: Record<string, unknown> = { query, page: 1 };
        const refinementList: Record<string, string[]> = {};
        const hierarchicalMenu: Record<string, string[]> = {};

        const addFacet = (facetName: string, facetValue: string) => {
          if (facetName.startsWith("hierarchical_categories.")) {
            const rootAttr = "hierarchical_categories.lvl0";
            if (!hierarchicalMenu[rootAttr]) hierarchicalMenu[rootAttr] = [];
            if (!hierarchicalMenu[rootAttr].includes(facetValue))
              hierarchicalMenu[rootAttr].push(facetValue);
          } else {
            if (!refinementList[facetName]) refinementList[facetName] = [];
            if (!refinementList[facetName].includes(facetValue))
              refinementList[facetName].push(facetValue);
          }
        };

        if (facetFilters && facetFilters.length > 0) {
          for (const group of facetFilters) {
            for (const filter of group) {
              const colonIndex = filter.indexOf(":");
              if (colonIndex <= 0) continue;
              addFacet(
                filter.slice(0, colonIndex).trim(),
                filter.slice(colonIndex + 1).trim()
              );
            }
          }
        }

        if (filters) {
          const cleaned = filters.replace(/[()]/g, "");
          const parts = cleaned.split(/\s+(?:AND|OR)\s+/);
          for (const part of parts) {
            const trimmed = part.trim();
            const colonIndex = trimmed.indexOf(":");
            if (colonIndex <= 0) continue;
            const facetName = trimmed.slice(0, colonIndex).trim();
            const facetValue = trimmed.slice(colonIndex + 1).trim();
            if (/^[<>=!]/.test(facetValue)) continue;
            addFacet(facetName, facetValue);
          }
        }

        if (Object.keys(refinementList).length > 0)
          newState.refinementList = refinementList;
        if (Object.keys(hierarchicalMenu).length > 0)
          newState.hierarchicalMenu = hierarchicalMenu;

        return newState;
      });
    },
    [setIndexUiState]
  );
  const copyResetTimeoutRef = useRef<number | null>(null);
  const [acknowledgedExchangeIds, setAcknowledgedExchangeIds] = useState<
    Set<string>
  >(new Set());
  const [submittingExchangeId, setSubmittingExchangeId] = useState<
    string | null
  >(null);
  const [hoveredQueryIndex, setHoveredQueryIndex] = useState<string | null>(
    null
  );
  const hoverTimeoutRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group messages into exchanges (user + assistant pairs)
  // Hide the hidden greeting user message but keep the assistant's greeting response
  const HIDDEN_GREETING_TEXT = "__greeting__";

  const { exchanges, greetingMessage } = useMemo(() => {
    if (isFollowUpGenerating) return { exchanges: [], greetingMessage: null as Message | null };
    const grouped: Exchange[] = [];
    let greeting: Message | null = null;

    for (let i = 0; i < messages.length; i++) {
      const current = messages[i];
      if (current.role === "user") {
        const userMessage = current as Message;
        const nextMessage = messages[i + 1];
        const isHiddenGreeting = userMessage.parts.some(
          (p) => p.type === "text" && p.text === HIDDEN_GREETING_TEXT
        );

        if (isHiddenGreeting) {
          // Don't show the hidden greeting as an exchange — extract assistant response as greeting
          if (nextMessage?.role === "assistant") {
            greeting = nextMessage as Message;
            i++; // Skip assistant
          }
          continue;
        }

        if (nextMessage?.role === "assistant") {
          grouped.push({
            id: userMessage.id,
            userMessage,
            assistantMessage: nextMessage as Message,
          });
          i++; // Skip the assistant message since we've already processed it
        } else {
          // No assistant yet – show a pending exchange immediately
          grouped.push({
            id: userMessage.id,
            userMessage,
            assistantMessage: null,
          });
        }
      }
    }
    return { exchanges: grouped, greetingMessage: greeting };
  }, [messages, isFollowUpGenerating]);

  // Auto-scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [exchanges.length, isGenerating]);

  // Cleanup any pending reset timers on unmount
  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 bg-muted">
      {/* Spacer pushes conversation to the bottom of the scroll area */}
      <div className="flex-1 min-h-0" />
      <div className="flex flex-col gap-4">
        {exchanges.length === 0 && (
          <div className="flex flex-col gap-4 py-8">
            {/* Show the agent's greeting if available, otherwise a static fallback */}
            {greetingMessage ? (
              <div className="text-lg text-foreground">
                {greetingMessage.parts.map((part, i) =>
                  part.type === "text" ? <span key={i}>{part.text}</span> : null
                )}
              </div>
            ) : isFollowUpGenerating ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <SparklesIcon size={16} className="animate-pulse" />
                <AnimatedShinyText className="text-lg">
                  Thinking...
                </AnimatedShinyText>
              </div>
            ) : (
              <h2 className="text-2xl font-semibold text-foreground">
                How can I help you today?
              </h2>
            )}

            {/* Suggested questions — show loading when fetching new ones */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <SparklesIcon size={12} />
                Try saying
              </h3>
              {isFollowUpGenerating && followUpQuestions.length > 0 ? (
                /* Skeleton only when refreshing existing suggestions */
                <div className="flex flex-wrap gap-2">
                  {[140, 180, 120].map((w, i) => (
                    <div
                      key={i}
                      className="h-9 rounded-md bg-muted animate-pulse"
                      style={{ width: w }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(followUpQuestions.length > 0
                    ? followUpQuestions
                    : AGENT_CONFIG.fallbackSuggestions
                  ).map((question: string, index: number) => (
                    <Button
                      key={`suggestion-${index}`}
                      type="button"
                      variant="outline"
                      className="cursor-pointer text-left"
                      onClick={() => onSuggestedQuestionClick(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* errors */}
        {error && (
          <div className="border border-red-300 bg-red-100 text-red-900 px-4 py-3 rounded-lg">
            {error.message}
          </div>
        )}

        {/* exchanges */}
        {exchanges.map((exchange) => {
          const isLastExchange =
            exchanges[exchanges.length - 1]?.id === exchange.id;

          return (
            <article key={exchange.id} className="rounded-sm bg-background p-4">
              <div className="flex items-start gap-3">
                <div className="font-semibold text-xl text-foreground mb-2">
                  {exchange.userMessage.parts.map((part, index) =>
                    part.type === "text" ? (
                      <span key={index}>{part.text}</span>
                    ) : null
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-start gap-3">
                <div className="flex-1 gap-3">
                  {exchange.assistantMessage ? (
                    <>
                      <div className="text-foreground">
                        {groupConsecutiveSearches(exchange.assistantMessage.parts.map((part, index) => {
                          if (typeof part === "string") {
                            return <p key={`${index}`}>{part}</p>;
                          }
                          if (part.type === "text") {
                            return (
                              <MemoizedMarkdown key={`${index}`}>
                                {part.text}
                              </MemoizedMarkdown>
                            );
                          } else if (
                            part.type === "reasoning" &&
                            part.state === "streaming"
                          ) {
                            return (
                              <p
                                className="text-[0.95rem] flex my-2 gap-2 items-center text-muted-foreground"
                                key={`${index}`}
                              >
                                <BrainIcon />{" "}
                                <AnimatedShinyText>
                                  Reasoning...
                                </AnimatedShinyText>
                              </p>
                            );
                          } else if (
                            part.type === "tool-algolia_search_index"
                          ) {
                            const isArticleSearch = part.input?.index?.includes("articles");
                            if (part.state === "input-streaming") {
                              return (
                                <p
                                  className={`text-[0.95rem] flex my-2 gap-2 items-center ${isArticleSearch ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
                                  key={`${index}`}
                                >
                                  {isArticleSearch && <BookOpen size={14} className="shrink-0" />}
                                  <AnimatedShinyText>
                                    {isArticleSearch ? "Searching articles..." : "Searching..."}
                                  </AnimatedShinyText>
                                </p>
                              );
                            } else if (part.state === "input-available") {
                              const query = part.input?.query || "";
                              const facetFilters = part.input?.facet_filters;
                              const filtersStr = part.input?.filters;
                              const facetFiltersStr = formatFacetFilters(facetFilters);
                              const filtersDisplay = filtersStr || facetFiltersStr;
                              return (
                                <div
                                  className={`text-[0.95rem] flex flex-col my-2 gap-1 ${isArticleSearch ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
                                  key={`${index}`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {isArticleSearch && <BookOpen size={14} className="shrink-0" />}
                                    <AnimatedShinyText>
                                      Looking for{" "}
                                      <button
                                        type="button"
                                        onClick={() => applySearchWithFilters(query, facetFilters, filtersStr)}
                                        className={`bg-transparent underline decoration-2 underline-offset-4 cursor-pointer transition-colors ${isArticleSearch ? "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300" : "text-muted-foreground hover:text-foreground"}`}
                                      >
                                        &quot;{query}&quot;
                                      </button>
                                    </AnimatedShinyText>
                                  </span>
                                  {isArticleSearch && (
                                    <span className="text-[10px] font-medium text-blue-500/70 dark:text-blue-400/60 ml-5">
                                      {part.input?.index}
                                    </span>
                                  )}
                                  {filtersDisplay && (
                                    <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                                      <span>Filter:</span>
                                      <code className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">
                                        {filtersDisplay}
                                      </code>
                                    </span>
                                  )}
                                </div>
                              );
                            } else if (part.state === "output-available") {
                              const query = part.input?.query || "";
                              const facetFilters = part.input?.facet_filters || part.output?.facet_filters;
                              const filtersStr = part.input?.filters || part.output?.filters;
                              const facetFiltersStr = formatFacetFilters(facetFilters);
                              const filtersDisplay = filtersStr || facetFiltersStr;
                              const hits = part.output?.hits || [];
                              const queryKey = `${exchange.id}-${index}`;
                              const isHovered = hoveredQueryIndex === queryKey;

                              const handleMouseEnter = () => {
                                if (hoverTimeoutRef.current) {
                                  window.clearTimeout(hoverTimeoutRef.current);
                                }
                                setHoveredQueryIndex(queryKey);
                              };

                              const handleMouseLeave = () => {
                                hoverTimeoutRef.current = window.setTimeout(
                                  () => {
                                    setHoveredQueryIndex(null);
                                  },
                                  200
                                );
                              };

                              return (
                                <div
                                  key={`${index}`}
                                  className={`text-[0.95rem] flex flex-col my-2 gap-1 ${isArticleSearch ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
                                >
                                  <span className="flex items-center gap-1.5 flex-wrap">
                                    {isArticleSearch && <BookOpen size={14} className="shrink-0" />}
                                    Searched for{" "}
                                    {hits.length > 0 ? (
                                      <Popover
                                        open={isHovered}
                                        onOpenChange={(open) => {
                                          if (!open) {
                                            setHoveredQueryIndex(null);
                                          }
                                        }}
                                      >
                                        <PopoverTrigger asChild>
                                          <button
                                            type="button"
                                            onClick={() => !isArticleSearch && applySearchWithFilters(query, facetFilters, filtersStr)}
                                            onMouseEnter={handleMouseEnter}
                                            onMouseLeave={handleMouseLeave}
                                            className={`bg-transparent underline decoration-1 underline-offset-4 cursor-pointer transition-colors ${isArticleSearch ? "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300" : "text-muted-foreground hover:text-foreground"}`}
                                          >
                                            &quot;{query}&quot;
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-[420px] max-h-[600px] overflow-y-auto p-4"
                                          onMouseEnter={handleMouseEnter}
                                          onMouseLeave={handleMouseLeave}
                                          align="start"
                                          side="bottom"
                                        >
                                          {isArticleSearch ? (
                                            <ArticleSearchResultsPreview hits={hits as unknown as ArticleSearchResultsPreviewProps["hits"]} />
                                          ) : (
                                            <SearchResultsPreview
                                              hits={hits}
                                              onViewMore={() => applySearchWithFilters(query, facetFilters, filtersStr)}
                                            />
                                          )}
                                        </PopoverContent>
                                      </Popover>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => !isArticleSearch && applySearchWithFilters(query, facetFilters, filtersStr)}
                                        className={`bg-transparent underline decoration-1 underline-offset-4 cursor-pointer transition-colors ${isArticleSearch ? "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300" : "text-muted-foreground hover:text-foreground"}`}
                                      >
                                        &quot;{query}&quot;
                                      </button>
                                    )}{" "}
                                    found {hits.length || "no"} {isArticleSearch ? "articles" : "results"}
                                  </span>
                                  {isArticleSearch && (
                                    <span className="text-[10px] font-medium text-blue-500/70 dark:text-blue-400/60 ml-5">
                                      {part.input?.index}
                                    </span>
                                  )}
                                  {!isArticleSearch && filtersDisplay && (
                                    <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                                      <span>Filter:</span>
                                      <code className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">
                                        {filtersDisplay}
                                      </code>
                                    </span>
                                  )}
                                </div>
                              );
                            } else if (part.state === "output-error") {
                              return (
                                <p
                                  className="text-[0.95rem] flex my-2 gap-2 items-center text-muted-foreground"
                                  key={`${index}`}
                                >
                                  {part.errorText}
                                </p>
                              );
                            } else {
                              return null;
                            }
                          } else if (part.type === "tool-showItems") {
                            if (
                              part.state === "input-streaming" ||
                              part.state === "input-available"
                            ) {
                              return (
                                <ShowItemsDisplay
                                  key={`${index}`}
                                  products={[]}
                                  isLoading={true}
                                />
                              );
                            } else if (part.state === "output-available") {
                              const products = part.output?.products || [];
                              const title = part.output?.title;
                              const explanation = part.output?.explanation;
                              return (
                                <ShowItemsDisplay
                                  key={`${index}`}
                                  products={products}
                                  title={title}
                                  explanation={explanation}
                                />
                              );
                            } else if (part.state === "output-error") {
                              return (
                                <p
                                  className="text-[0.95rem] flex my-2 gap-2 items-center text-red-500"
                                  key={`${index}`}
                                >
                                  Error loading products
                                </p>
                              );
                            } else {
                              return null;
                            }
                          } else if (part.type === "tool-addToCart") {
                            if (
                              part.state === "input-streaming" ||
                              part.state === "input-available"
                            ) {
                              return (
                                <div
                                  key={`${index}`}
                                  className="my-3 p-3 rounded-lg border border-border bg-muted/30"
                                >
                                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <ShoppingCartIcon
                                      size={16}
                                      className="animate-pulse"
                                    />
                                    <AnimatedShinyText>
                                      Adding to cart...
                                    </AnimatedShinyText>
                                  </div>
                                </div>
                              );
                            } else if (part.state === "output-available") {
                              const products = part.output?.products || [];
                              return (
                                <div
                                  key={`${index}`}
                                  className="my-3 p-3 rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30"
                                >
                                  <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm font-medium mb-2">
                                    <ShoppingCartIcon size={16} />
                                    <span>
                                      Added {products.length} item
                                      {products.length !== 1 ? "s" : ""} to cart
                                    </span>
                                  </div>
                                  <div className="grid gap-2">
                                    {products.slice(0, 3).map((product) => (
                                      <div
                                        key={product.objectID}
                                        className="flex items-center gap-2 text-sm"
                                      >
                                        <span className="text-foreground truncate">
                                          {product.name}
                                        </span>
                                      </div>
                                    ))}
                                    {products.length > 3 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{products.length - 3} more item
                                        {products.length - 3 !== 1 ? "s" : ""}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            } else if (part.state === "output-error") {
                              return (
                                <p
                                  className="text-[0.95rem] flex my-2 gap-2 items-center text-red-500"
                                  key={`${index}`}
                                >
                                  Failed to add items to cart
                                </p>
                              );
                            } else {
                              return null;
                            }
                          } else if (part.type === "tool-showArticles") {
                            if (
                              part.state === "input-streaming" ||
                              part.state === "input-available"
                            ) {
                              return (
                                <ShowArticlesDisplay
                                  key={`${index}`}
                                  articles={[]}
                                  isLoading={true}
                                />
                              );
                            } else if (part.state === "output-available") {
                              const articles = part.output?.articles || [];
                              const title = part.output?.title;
                              return (
                                <ShowArticlesDisplay
                                  key={`${index}`}
                                  articles={articles}
                                  title={title}
                                />
                              );
                            } else if (part.state === "output-error") {
                              return (
                                <p
                                  className="text-[0.95rem] flex my-2 gap-2 items-center text-red-500"
                                  key={`${index}`}
                                >
                                  Error loading articles
                                </p>
                              );
                            } else {
                              return null;
                            }
                          } else {
                            return null;
                          }
                        }), exchange.assistantMessage.parts)}
                        {/* Show loading indicator while generating more content */}
                        {isGenerating && isLastExchange && (
                          <div className="text-muted-foreground mt-2">
                            <AnimatedShinyText>Generating...</AnimatedShinyText>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">
                      <AnimatedShinyText>
                        {isGenerating && isLastExchange ? "Thinking..." : ""}
                      </AnimatedShinyText>
                    </div>
                  )}
                </div>
              </div>

              {exchange.assistantMessage && !isGenerating ? (
                <div className="mt-4 flex items-center justify-start gap-2">
                  {acknowledgedExchangeIds.has(exchange.id) ? (
                    <span className="text-muted-foreground text-[0.85rem] animate-in fade-in slide-in-from-bottom-1">
                      Thanks for your feedback!
                    </span>
                  ) : submittingExchangeId === exchange.id ? (
                    <span className="text-muted-foreground text-[0.85rem] shimmer-text">
                      Submitting...
                    </span>
                  ) : null}
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      title="Like"
                      aria-label="Like"
                      className="border-none bg-transparent rounded-md px-2.5 py-1.5 text-muted-foreground cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-blue-50 dark:hover:bg-slate-900 disabled:text-foreground disabled:cursor-not-allowed"
                      disabled={
                        !exchange.assistantMessage ||
                        submittingExchangeId === exchange.id
                      }
                      onClick={async () => {
                        if (!exchange.assistantMessage) return;
                        try {
                          setSubmittingExchangeId(exchange.id);
                          setAcknowledgedExchangeIds((prev) => {
                            const next = new Set(prev);
                            next.add(exchange.id);
                            return next;
                          });
                        } catch {
                          // ignore errors
                        } finally {
                          setSubmittingExchangeId(null);
                        }
                      }}
                    >
                      <ThumbsUp size={18} />
                    </button>
                    <button
                      type="button"
                      title="Dislike"
                      aria-label="Dislike"
                      className="border-none bg-transparent rounded-md px-2.5 py-1.5 text-muted-foreground cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-blue-50 dark:hover:bg-slate-900 disabled:text-foreground disabled:cursor-not-allowed"
                      disabled={
                        !exchange.assistantMessage ||
                        submittingExchangeId === exchange.id
                      }
                      onClick={async () => {
                        if (!exchange.assistantMessage) return;
                        try {
                          setSubmittingExchangeId(exchange.id);
                          setAcknowledgedExchangeIds((prev) => {
                            const next = new Set(prev);
                            next.add(exchange.id);
                            return next;
                          });
                        } catch {
                          // ignore errors
                        } finally {
                          setSubmittingExchangeId(null);
                        }
                      }}
                    >
                      <ThumbsDown size={18} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className={`border-none bg-transparent rounded-md px-2.5 py-1.5 text-muted-foreground cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-blue-50 dark:hover:bg-slate-900 disabled:text-foreground disabled:cursor-not-allowed ${
                      copiedExchangeId === exchange.id
                        ? "bg-blue-50 dark:bg-slate-900 text-blue-600 -translate-y-px"
                        : ""
                    }`}
                    aria-label={
                      copiedExchangeId === exchange.id
                        ? "Copied"
                        : "Copy answer"
                    }
                    title={
                      copiedExchangeId === exchange.id
                        ? "Copied"
                        : "Copy answer"
                    }
                    disabled={
                      !exchange.assistantMessage ||
                      copiedExchangeId === exchange.id
                    }
                    onClick={async () => {
                      const parts = exchange.assistantMessage?.parts ?? [];
                      const textContent = parts
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("")
                        .trim();
                      if (!textContent) return;
                      try {
                        if (onCopy) {
                          await onCopy(textContent);
                        } else {
                          await copyText(textContent);
                        }
                        setCopiedExchangeId(exchange.id);
                        if (copyResetTimeoutRef.current) {
                          window.clearTimeout(copyResetTimeoutRef.current);
                        }
                        copyResetTimeoutRef.current = window.setTimeout(() => {
                          setCopiedExchangeId(null);
                        }, 1500);
                      } catch {
                        // noop – copy may fail silently
                      }
                    }}
                  >
                    {copiedExchangeId === exchange.id ? (
                      <CheckIcon size={18} />
                    ) : (
                      <CopyIcon size={18} />
                    )}
                  </button>
                </div>
              ) : null}

              {/* Show follow-up questions only for the last exchange */}
              {isLastExchange && exchange.assistantMessage && !isGenerating && (
                <FollowUpQuestions
                  questions={followUpQuestions}
                  isGenerating={isFollowUpGenerating}
                  onQuestionClick={onSuggestedQuestionClick}
                />
              )}
            </article>
          );
        })}
        <div ref={messagesEndRef} data-sidepanel-messages-end />
      </div>
    </div>
  );
});

// ============================================================================
// Sidepanel Component
// ============================================================================

interface SidepanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: SidepanelAskAIConfig;
  messages: Message[];
  error: Error | null;
  isGenerating: boolean;
  sendMessage: (options: { text: string }) => void | Promise<void>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onOpenNewConversation: () => void;
  followUpQuestions: string[];
  isFollowUpGenerating: boolean;
}

const MAX_PROMPT_ROWS = 20;

const Sidepanel = memo(function Sidepanel({
  isOpen,
  onClose,
  config,
  messages,
  error,
  isGenerating,
  sendMessage,
  inputRef,
  onOpenNewConversation,
  followUpQuestions,
  isFollowUpGenerating,
}: SidepanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const variant = config.variant || "floating";

  // Speech recognition for voice input
  const handleTranscriptEnd = useCallback((finalTranscript: string) => {
    setInputValue(finalTranscript);
  }, []);

  const {
    supported: speechSupported,
    listening,
    transcript,
    toggle: toggleSpeech,
  } = useSpeechRecognition({
    lang: "en-US",
    onTranscriptEnd: handleTranscriptEnd,
  });

  // When listening, display transcript; otherwise display typed input
  const displayValue = listening && transcript ? transcript : inputValue;

  // Handle mount/unmount and closing animation
  useEffect(() => {
    if (isOpen) {
      // Use startTransition to prevent cascading renders
      startTransition(() => {
        setShouldRender(true);
      });
      // Allow initial render before animating in (double rAF for paint)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      // Focus input when opening
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else if (shouldRender) {
      // Start closing animation immediately
      // Use startTransition to prevent cascading renders
      startTransition(() => {
        setIsVisible(false);
      });
      // Unmount after animation completes (match 0.28s duration + buffer)
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender, inputRef]);
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Inline variant: push page content by adjusting body padding-right on desktop
  useEffect(() => {
    if (variant !== "inline") return;
    if (typeof window === "undefined") return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const panelWidth = isMaximized ? 580 : 360;

    if (isOpen && isDesktop) {
      const prevPadding = document.body.style.paddingRight;
      const prevTransition = document.body.style.transition;
      document.body.style.transition =
        "padding-right 0.28s cubic-bezier(0.22, 1, 0.36, 1)";
      document.body.style.paddingRight = `${panelWidth}px`;
      return () => {
        document.body.style.paddingRight = prevPadding;
        document.body.style.transition = prevTransition;
      };
    }

    return;
  }, [variant, isOpen, isMaximized]);

  const managePromptHeight = useCallback((): void => {
    if (!inputRef.current) return;

    const textArea = inputRef.current;

    textArea.style.height = "auto";

    const styles = getComputedStyle(textArea);

    const lineHeight = parseFloat(styles.lineHeight);
    const paddingTop = parseFloat(styles.paddingTop);
    const paddingBottom = parseFloat(styles.paddingBottom);
    const padding = paddingTop + paddingBottom;

    const fullHeight = textArea.scrollHeight;
    const maxHeight = MAX_PROMPT_ROWS * lineHeight + padding;

    textArea.style.overflowY = fullHeight > maxHeight ? "auto" : "hidden";
    textArea.style.height = `${Math.min(fullHeight, maxHeight)}px`;
  }, [inputRef]);

  const sendMessageAndReset = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isGenerating) return;

      sendMessage({ text: trimmed });
      setInputValue("");
      // Reset textarea height after clearing input
      setTimeout(() => {
        managePromptHeight();
        inputRef.current?.focus();
      }, 50);
    },
    [isGenerating, sendMessage, inputRef, managePromptHeight]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      sendMessageAndReset(displayValue);
    },
    [displayValue, sendMessageAndReset]
  );

  const handleSuggestedQuestionClick = useCallback(
    (question: string) => {
      sendMessageAndReset(question);
    },
    [sendMessageAndReset]
  );

  const resizeSidepanel = useCallback(() => {
    setIsMaximized((prev) => !prev);
  }, []);

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 ${
        variant === "inline"
          ? "bg-transparent dark:bg-transparent md:p-0"
          : "bg-black/20 dark:bg-black/60 md:p-4"
      } flex items-center justify-end pointer-events-none ${
        isVisible ? "animate-in fade-in-0" : "animate-out fade-out-0"
      }`}
      style={{ animationDuration: "0.2s" }}
    >
      <div
        className={`bg-background h-screen w-full md:h-full flex flex-col pointer-events-auto transition-all duration-300 ease-out ${
          variant === "inline"
            ? "rounded-none border-l border-border"
            : "md:rounded-lg shadow-2xl"
        } ${
          isVisible
            ? "animate-in slide-in-from-right"
            : "animate-out slide-out-to-right"
        } ${isMaximized ? "md:w-[580px]" : "md:w-[360px]"}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          animationDuration: "0.28s",
          animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          animationFillMode: "both",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-primary/50">
          <div className="flex items-center gap-2">
            <SparklesIcon
              size={20}
              className="text-foreground dark:text-white"
            />
            <h2 className="text-sm font-semibold text-foreground">{DEMO_CONFIG.brand.agentName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onOpenNewConversation}
              disabled={messages.length === 0}
              className="px-1 text-muted-foreground disabled:cursor-not-allowed"
              aria-label="Open new conversation"
              title="Open new conversation"
            >
              <SquarePen size={18} />
            </Button>
            <Button
              variant="ghost"
              onClick={resizeSidepanel}
              className="hidden md:flex px-1 cursor-pointer text-muted-foreground"
              aria-label={isMaximized ? "Minimize" : "Maximize"}
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </Button>
            <Button
              variant="ghost"
              className="px-1 text-xs text-muted-foreground cursor-pointer"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <span className="hidden md:inline">
                <XIcon size={18} />
              </span>
              <span className="md:hidden">
                <XIcon />
              </span>
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <ChatWidget
          messages={messages}
          error={error}
          isGenerating={isGenerating}
          applicationId={config.applicationId}
          assistantId={config.assistantId}
          onSuggestedQuestionClick={handleSuggestedQuestionClick}
          followUpQuestions={followUpQuestions}
          isFollowUpGenerating={isFollowUpGenerating}
        />

        {/* Input Bar */}
        <div className="border-t border-border p-4">
          <form
            onSubmit={handleSubmit}
            className="flex border-border border rounded-md gap-2 p-2 focus-within:ring-1 focus-within:ring-blue-600 focus-within:border-transparent transition-all"
          >
            <textarea
              ref={inputRef}
              value={displayValue}
              id="sidepanel-input"
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isGenerating) {
                    handleSubmit();
                  }
                }
              }}
              onInput={managePromptHeight}
              rows={1}
              placeholder={config.placeholder || "Ask AI anything"}
              className="flex-1 pt-1 border-none outline-none bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-transparent resize-none overflow-y-hidden"
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleSpeech}
                disabled={isGenerating}
                className={`self-end p-1.5 rounded-full transition-colors ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-muted-foreground hover:bg-muted"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={
                  listening ? "Stop voice input" : "Start voice input"
                }
              >
                {listening ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
              </button>
            )}
            <Button
              size="icon-sm"
              type="submit"
              className="self-end"
              disabled={!displayValue.trim() || isGenerating}
            >
              <ArrowUpIcon size={18} />
            </Button>
          </form>
          <div className="mt-2 flex items-center justify-center text-xs text-muted-foreground">
            <p className="m-0 text-center">
              Answers are generated with AI which can make mistakes.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});

// ============================================================================
// Main Export Component
// ============================================================================

export default function SidepanelExperience(config: AgentStudioConfig) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const variant = config.variant || "floating";
  const pendingMessageRef = useRef<string | null>(null);
  const isOpenRef = useRef(false);
  const sendMessageRef = useRef<((options: { text: string }) => void) | null>(
    null
  );
  const sidepanelContext = useSidepanel();

  // Keep ref and context in sync with state
  useEffect(() => {
    isOpenRef.current = isOpen;
    sidepanelContext.notifyOpenChange(isOpen);
  }, [isOpen, sidepanelContext]);

  const { messages, setMessages, error, isGenerating, sendMessage, suggestions, resetConversation, stop } =
    useAgentStudio({
      applicationId: config.applicationId,
      apiKey: config.apiKey,
      agentId: config.agentId,
    });

  // Hidden greeting state — declared early so wrappedSendMessage can reference it
  const initialGreetingDoneRef = useRef(false);
  const [initialSuggestionsLoading, setInitialSuggestionsLoading] = useState(false);
  const [greetingTrigger, setGreetingTrigger] = useState(0);

  // Wrap sendMessage to abort hidden greeting if user sends a real message
  const wrappedSendMessage = useCallback(
    (options: { text: string }) => {
      if (initialSuggestionsLoading) {
        // User is sending a real message while suggestions are still loading — abort and clear
        stop();
        setMessages?.([]);
        setInitialSuggestionsLoading(false);
        // Small delay for the abort to settle, then send the real message
        setTimeout(() => {
          sendMessage(options);
        }, 50);
      } else {
        sendMessage(options);
      }
    },
    [sendMessage, stop, setMessages, initialSuggestionsLoading]
  );

  // Keep sendMessage ref in sync
  useEffect(() => {
    sendMessageRef.current = wrappedSendMessage;
  }, [wrappedSendMessage]);

  // Register controls with context
  useEffect(() => {
    const handleOpenSidepanel = (message?: string) => {
      if (isOpenRef.current && message && sendMessageRef.current) {
        // Already open, send message directly
        sendMessageRef.current({ text: message });
      } else {
        setIsOpen(true);
        if (message) {
          // Store message to send after sidepanel opens
          pendingMessageRef.current = message;
        }
      }
    };

    const handleCloseSidepanel = () => {
      setIsOpen(false);
    };

    const handleSendMessage = (message: string) => {
      if (isOpenRef.current && sendMessageRef.current) {
        sendMessageRef.current({ text: message });
      } else {
        // If not open, open it first and store message
        pendingMessageRef.current = message;
        setIsOpen(true);
      }
    };

    const unregister = sidepanelContext.register({
      openSidepanel: handleOpenSidepanel,
      closeSidepanel: handleCloseSidepanel,
      sendMessage: handleSendMessage,
      isOpen: () => isOpenRef.current,
    });

    return unregister;
  }, [sidepanelContext]);

  // Send pending message when sidepanel opens — inject initial context if available
  useEffect(() => {
    if (isOpen && pendingMessageRef.current && sendMessageRef.current) {
      const message = pendingMessageRef.current;
      pendingMessageRef.current = null;

      // If there are initial messages from the summary, inject them first
      const initialMessages = sidepanelContext.initialMessagesRef.current;
      if (initialMessages && setMessages) {
        sidepanelContext.initialMessagesRef.current = null;
        initialGreetingDoneRef.current = true; // skip greeting since we have context
        setMessages(initialMessages as any);
        // Delay sending follow-up to let messages settle and scroll to bottom
        setTimeout(() => {
          // Scroll to the end of injected context before sending follow-up
          const endEl = document.querySelector("[data-sidepanel-messages-end]");
          endEl?.scrollIntoView({ behavior: "instant" });
          sendMessageRef.current?.({ text: message });
        }, 300);
      } else {
        // Small delay to ensure sidepanel is fully rendered
        setTimeout(() => {
          sendMessageRef.current?.({ text: message });
        }, 150);
      }
    }
  }, [isOpen, sendMessage, setMessages, sidepanelContext]);

  // Sync suggestions and loading state to sidepanel context so other pages can access them
  useEffect(() => {
    sidepanelContext.setAgentSuggestions(suggestions);
  }, [suggestions, sidepanelContext]);

  useEffect(() => {
    sidepanelContext.setAgentSuggestionsLoading(initialSuggestionsLoading);
  }, [initialSuggestionsLoading, sidepanelContext]);

  // The hidden greeting message text — used to filter it out of the UI
  const HIDDEN_GREETING_TEXT = "__greeting__";

  useEffect(() => {
    // Trigger on mount (or URL change via greetingTrigger), regardless of sidepanel open state.
    // This ensures suggestions are ready before the user opens the chat.
    if (messages.length > 0 || initialGreetingDoneRef.current || initialSuggestionsLoading) return;
    if (!sendMessageRef.current) return;
    // Skip greeting if we have pending context from the summary (will be injected separately)
    if (sidepanelContext.initialMessagesRef.current) return;

    initialGreetingDoneRef.current = true;
    setInitialSuggestionsLoading(true);

    // Small delay to ensure transport is ready
    setTimeout(() => {
      sendMessageRef.current?.({ text: HIDDEN_GREETING_TEXT });
    }, 100);
  }, [messages.length, initialSuggestionsLoading, greetingTrigger, sidepanelContext]);

  // Mark suggestions as loaded once the greeting response finishes
  useEffect(() => {
    if (!initialSuggestionsLoading) return;
    if (isGenerating) return; // still streaming
    if (messages.length === 0) return; // not yet received

    // Response finished — suggestions were captured via onData, keep messages for greeting display
    setInitialSuggestionsLoading(false);
  }, [initialSuggestionsLoading, isGenerating, messages.length]);

  // Regenerate greeting when URL changes (category/search navigation)
  // Only if conversation is empty (no user messages beyond the initial greeting)
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlKey = `${pathname}?${searchParams.toString()}`;
  const prevUrlKeyRef = useRef(urlKey);

  // Check if there are real user messages (not the hidden greeting)
  const hasRealConversation = useMemo(() => {
    return messages.some(
      (m) => m.role === "user" && !m.parts.some((p) => p.type === "text" && p.text === HIDDEN_GREETING_TEXT)
    );
  }, [messages]);

  useEffect(() => {
    if (urlKey === prevUrlKeyRef.current) return;
    prevUrlKeyRef.current = urlKey;

    // Only regenerate if there's no real conversation and the greeting has already been done once
    if (!initialGreetingDoneRef.current) return;
    if (hasRealConversation) return; // user has an active conversation
    if (isGenerating || initialSuggestionsLoading) return;

    // Debounce: wait a short period before regenerating
    const timer = setTimeout(() => {
      // Re-check conditions after debounce
      if (hasRealConversation || isGenerating || initialSuggestionsLoading) return;
      // Clear stale suggestions and reset the greeting flow
      resetConversation();
      initialGreetingDoneRef.current = false;
      setGreetingTrigger((n) => n + 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [urlKey, hasRealConversation, isGenerating, initialSuggestionsLoading]);

  // Keyboard shortcut: Command+I (Mac) or Ctrl+I (Windows)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed = event.metaKey || event.ctrlKey;

      if (isModifierPressed && event.key.toLowerCase() === "i") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openSidepanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSidepanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openNewConversation = () => {
    resetConversation();
    initialGreetingDoneRef.current = false;
    setGreetingTrigger((n) => n + 1);
    setIsOpen(true);
  };

  const showTrigger = config.showTrigger !== false; // Default to true

  return (
    <>
      {/* Trigger button - only show for floating variant and if showTrigger is true */}
      {variant === "floating" && showTrigger && (
        <Button
          onClick={openSidepanel}
          variant="outline"
          className="justify-between hover:shadow-md transition-transform duration-400 translate-y-0 py-3 h-auto cursor-pointer hover:bg-transparent hover:translate-y-[-2px] border shadow-none"
        >
          <span className="flex items-center gap-2 opacity-80">
            <span className="inline text-muted-foreground">
              {config.buttonText || "Ask AI"}
            </span>
          </span>
          <div className="hidden md:inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
            ⌘ I
          </div>
        </Button>
      )}

      {/* For inline variant, auto-open or provide external control - only if showTrigger is true */}
      {variant === "inline" && !isOpen && showTrigger && (
        <Button
          onClick={openSidepanel}
          variant="default"
          size="icon-lg"
          className="cursor-pointer"
          aria-label="Open AI chat"
        >
          <SparklesIcon className="size-8" />
        </Button>
      )}

      <Sidepanel
        isOpen={isOpen}
        onClose={closeSidepanel}
        config={{
          applicationId: config.applicationId,
          apiKey: config.apiKey,
          indexName: ALGOLIA_CONFIG.INDEX_NAME,
          assistantId: config.agentId,
          variant: variant, // Pass variant through
          placeholder: config.placeholder,
        }}
        messages={messages as unknown as Message[]}
        error={error as Error | null}
        isGenerating={isGenerating && !initialSuggestionsLoading}
        sendMessage={wrappedSendMessage}
        inputRef={inputRef}
        onOpenNewConversation={openNewConversation}
        followUpQuestions={suggestions}
        isFollowUpGenerating={initialSuggestionsLoading}
      />
    </>
  );
}
