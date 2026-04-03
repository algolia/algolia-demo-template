"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteHits, useSearchBox, useInstantSearch } from "react-instantsearch";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Product } from "@/lib/types/product";
import { ProductCard, ProductListItem } from "@/components/ProductCard";
import { ProductToolbar, SearchStats } from "@/components/ProductToolbar";
import { FiltersSidebar, ActiveFilters } from "@/components/filters-sidebar";
import { Configure } from "react-instantsearch";
import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";
import { useCollapsibleFilters } from "@/components/hooks/use-collapsible-filters";
import { SparklesIcon } from "lucide-react";
import { DEMO_CONFIG } from "@/lib/demo-config";
import { InlineAISummary } from "@/components/InlineAISummary";
import { useLanguage } from "@/components/language/language-context";
import { getExampleQueries } from "@/lib/demo-config/translations";
import { LiveSearchBar } from "@/components/navbar/live-search-bar";

function AgentSuggestions() {
  const { agentSuggestions, agentSuggestionsLoading, openSidepanel } = useSidepanel();
  const { t } = useLanguage();

  if (agentSuggestionsLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <SparklesIcon size={14} className="animate-pulse" />
          <span className="animate-pulse">{t("search.loadingSuggestions")}</span>
        </div>
      </div>
    );
  }

  if (agentSuggestions.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <SparklesIcon size={14} className="shrink-0 text-muted-foreground" />
        {agentSuggestions.map((suggestion, index) => (
          <button
            key={`agent-${index}`}
            onClick={() => openSidepanel(suggestion)}
            className="shrink-0 px-4 py-2 text-sm font-medium border border-border rounded-full bg-background hover:bg-muted hover:border-primary/50 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 cursor-pointer"
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomHits({ viewMode, compact }: { viewMode: "grid" | "list"; compact?: boolean }) {
  const { hits, showMore, isLastPage } = useInfiniteHits<Product>();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

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
      return () => observer.disconnect();
    }
  }, [isLastPage, showMore]);

  if (hits.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">{t("search.noResults")}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {t("search.adjustTerms")}
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="ais-InfiniteHits">
        <div className="ais-InfiniteHits-list divide-y divide-gray-200">
          {hits.map((hit, index) => (
            <ProductListItem key={`${hit.objectID}-${index}`} product={hit} selectable={false} />
          ))}
          <div ref={sentinelRef} className="ais-InfiniteHits-sentinel" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className="ais-InfiniteHits">
      <div className={`ais-InfiniteHits-list grid grid-cols-1 md:grid-cols-2 ${compact ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-4`}>
        {hits.map((hit, index) => (
          <ProductCard key={`${hit.objectID}-${index}`} product={hit} selectable={false} />
        ))}
        <div ref={sentinelRef} className="ais-InfiniteHits-sentinel col-span-full" aria-hidden="true" />
      </div>
    </div>
  );
}

// ============================================================================
// Homepage Landing
// ============================================================================

function HomeLanding({ onQueryClick }: { onQueryClick: (q: string) => void }) {
  const { language, t } = useLanguage();
  const queries = getExampleQueries(language);

  return (
    <>
      {/* Gray hero */}
      <div className="bg-[#f5f5f5] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground">Cercador</h1>
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="mb-8">
          <LiveSearchBar />
        </div>

        <p className="text-muted-foreground mb-8 text-center">
          {t("brand.tagline")}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {queries.map((q) => (
            <button
              key={q}
              onClick={() => onQueryClick(q)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-border rounded-full bg-background hover:bg-muted hover:border-primary/50 transition-colors"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              {q}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Main Search Page
// ============================================================================

export default function SearchPage() {
  const { query, refine } = useSearchBox();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const { isSidepanelOpen } = useSidepanel();
  const { filtersOpen, toggleFilters } = useCollapsibleFilters();
  const [submitCount, setSubmitCount] = useState(0);
  const { t } = useLanguage();

  // Listen for Enter key submissions from the search bar
  useEffect(() => {
    const handler = () => setSubmitCount((c) => c + 1);
    window.addEventListener("search-submit", handler);
    return () => window.removeEventListener("search-submit", handler);
  }, []);

  // Show landing when no query
  if (!query) {
    return <HomeLanding onQueryClick={(q) => {
      refine(q);
      setTimeout(() => window.dispatchEvent(new CustomEvent("search-submit")), 100);
    }} />;
  }

  return (
    <>
      {/* Gray hero */}
      <div className="bg-[#f5f5f5] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground">Cercador</h1>
        </div>
      </div>

      {/* Search bar below hero */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <LiveSearchBar />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12">
        {/* Inline AI Summary — triggers on Enter press */}
        <InlineAISummary query={query} submitCount={submitCount} />

        {/* Agent suggestions now shown inside InlineAISummary */}

        {/* Result count */}
        <div className="mb-6">
          <SearchStats />
        </div>

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

          {/* Content Listing */}
          <div className="flex-1 min-w-0">
            <ActiveFilters />
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={toggleFilters}
                className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                aria-label={filtersOpen ? t("search.hideFilters") : t("search.showFilters")}
              >
                {filtersOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4" />
                )}
                <span>{filtersOpen ? t("search.hideFilters") : t("search.showFilters")}</span>
              </button>
              <div className="flex-1" />
              <ProductToolbar
                viewMode={viewMode}
                setViewMode={setViewMode}
                sidebar={<FiltersSidebar />}
              />
            </div>
            <Configure getRankingInfo={true} />
            <CustomHits viewMode={viewMode} compact={isSidepanelOpen} />
          </div>
        </div>
      </div>
    </>
  );
}
