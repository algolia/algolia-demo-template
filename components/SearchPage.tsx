"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteHits, useSearchBox, useInstantSearch } from "react-instantsearch";
import { algoliasearch } from "algoliasearch";
import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Product } from "@/lib/types/product";
import { ProductCard, ProductListItem } from "@/components/ProductCard";
import { ProductToolbar } from "@/components/ProductToolbar";
import { FiltersSidebar, ActiveFilters } from "@/components/filters-sidebar";
import { Configure } from "react-instantsearch";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { AgentSuggestions } from "@/components/agent-suggestions";
import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";
import { useCollapsibleFilters } from "@/components/hooks/use-collapsible-filters";

// Lazy-initialize search client to avoid issues during SSR/build
let searchClient: ReturnType<typeof algoliasearch> | null = null;
function getSearchClient() {
  if (!searchClient && ALGOLIA_CONFIG.APP_ID && ALGOLIA_CONFIG.SEARCH_API_KEY) {
    searchClient = algoliasearch(ALGOLIA_CONFIG.APP_ID, ALGOLIA_CONFIG.SEARCH_API_KEY);
  }
  return searchClient;
}

// Type for query suggestions
type QuerySuggestion = {
  objectID: string;
  query: string;
  count: number;
  _highlightResult?: {
    query: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
  };
};

// Helper component for highlighted text
function HighlightedText({ value }: { value: string }) {
  const parts = value.split(/(<em>.*?<\/em>)/);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        const emMatch = part.match(/^<em>(.*)<\/em>$/);
        if (emMatch) {
          return (
            <span key={index} className="font-normal">
              {emMatch[1]}
            </span>
          );
        }
        return (
          <span key={index} className="font-semibold">
            {part}
          </span>
        );
      })}
    </>
  );
}

function QuerySuggestions({
  query,
  onSuggestionClick,
}: {
  query: string;
  onSuggestionClick: (query: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.trim().length === 0) {
        setSuggestions([]);
        return;
      }

      try {
        const client = getSearchClient();
        if (!client) {
          setSuggestions([]);
          return;
        }
        const results = await client.search({
          requests: [
            {
              indexName: `${ALGOLIA_CONFIG.INDEX_NAME}_query_suggestions`,
              query: query,
              hitsPerPage: 8,
            },
          ],
        });

        const suggestionsResult = results.results[0];
        if ("hits" in suggestionsResult) {
          setSuggestions(suggestionsResult.hits as QuerySuggestion[]);
        }
      } catch (error) {
        console.error("Query suggestions error:", error);
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {suggestions.map((hit) => (
          <button
            key={hit.objectID}
            onClick={() => onSuggestionClick(hit.query)}
            className="shrink-0 px-4 py-2 text-sm font-medium border border-border rounded-full bg-background hover:bg-muted hover:border-primary/50 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 cursor-pointer"
            type="button"
          >
            {hit._highlightResult?.query?.value ? (
              <HighlightedText value={hit._highlightResult.query.value} />
            ) : (
              hit.query
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Banner {
  image?: {
    urls?: { url: string }[];
    title?: string;
  };
  link?: {
    url?: string;
    target?: string;
  };
}

function RuleBanner() {
  const { results } = useInstantSearch();

  const banners = (results?.renderingContent as {
    widgets?: { banners?: Banner[] };
  })?.widgets?.banners;

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      {banners.map((banner, index) => {
        const imageUrl = banner.image?.urls?.[0]?.url;
        if (!imageUrl) return null;

        const content = (
          <div className="relative w-full overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={banner.image?.title || "Promotional banner"}
              width={1200}
              height={300}
              className="w-full h-auto object-cover"
              priority={index === 0}
            />
          </div>
        );

        if (banner.link?.url) {
          return (
            <a
              key={index}
              href={banner.link.url}
              target={banner.link.target || "_self"}
              rel={banner.link.target === "_blank" ? "noopener noreferrer" : undefined}
              className="block hover:opacity-95 transition-opacity"
            >
              {content}
            </a>
          );
        }

        return <div key={index}>{content}</div>;
      })}
    </div>
  );
}

function CustomHits({ viewMode, compact }: { viewMode: "grid" | "list"; compact?: boolean }) {
  const { hits, showMore, isLastPage } = useInfiniteHits<Product>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Official Algolia pattern for infinite scroll
  useEffect(() => {
    if (sentinelRef.current !== null) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLastPage) {
            showMore();
          }
        });
      });

      observer.observe(sentinelRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [isLastPage, showMore]);

  if (hits.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">No products found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your search terms
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="ais-InfiniteHits">
        <div className="ais-InfiniteHits-list space-y-4">
          {hits.map((hit, index) => (
            <ProductListItem key={`${hit.objectID}-${index}`} product={hit} selectable />
          ))}
          <div ref={sentinelRef} className="ais-InfiniteHits-sentinel" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className="ais-InfiniteHits">
      <div className={`ais-InfiniteHits-list grid grid-cols-2 ${compact ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`}>
        {hits.map((hit, index) => (
          <ProductCard key={`${hit.objectID}-${index}`} product={hit} selectable />
        ))}
        <div ref={sentinelRef} className="ais-InfiniteHits-sentinel col-span-full" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const { query, refine } = useSearchBox();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { isSidepanelOpen } = useSidepanel();
  const { filtersOpen, toggleFilters } = useCollapsibleFilters();

  const handleSuggestionClick = (suggestionQuery: string) => {
    refine(suggestionQuery);
  };

  // Show homepage image when no query
  if (!query) {
    return (
      <Image
        src="/homepage.png"
        alt="Homepage"
        width={0}
        height={0}
        sizes="100vw"
        className="w-full h-auto pointer-events-none select-none"
        priority
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl py-6 px-4">
      {/* Display current search query */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Results for:{" "}
          <span className="text-primary">&quot;{query}&quot;</span>
        </h1>
      </div>

      {/* Agent Suggestions - AI-powered contextual suggestions */}
      <AgentSuggestions />

      {/* Query Suggestions */}
      <QuerySuggestions
        query={query}
        onSuggestionClick={handleSuggestionClick}
      />

      <div className="flex gap-8">
        {/* Desktop Sidebar - collapsible */}
        <div
          className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
            filtersOpen ? "w-64" : "w-0"
          }`}
        >
          <div className="w-64">
            <FiltersSidebar />
          </div>
        </div>

        {/* Product Listing */}
        <div className="flex-1 min-w-0">
          <RuleBanner />
          <ActiveFilters />
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFilters}
              className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              aria-label={filtersOpen ? "Hide filters" : "Show filters"}
            >
              {filtersOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
              <span>{filtersOpen ? "Hide filters" : "Filters"}</span>
            </button>
            <div className="flex-1">
              <ProductToolbar
                viewMode={viewMode}
                setViewMode={setViewMode}
                sidebar={<FiltersSidebar />}
              />
            </div>
          </div>
          <Configure getRankingInfo={true} />
          <CustomHits viewMode={viewMode} compact={isSidepanelOpen} />
        </div>
      </div>
    </div>
  );
}
