"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useInfiniteHits,
  useConfigure,
  useSearchBox,
} from "react-instantsearch";
import { ChevronRight, PanelLeftClose, PanelLeftOpen, SparklesIcon } from "lucide-react";
import { Product } from "@/lib/types/product";
import { ProductCard, ProductListItem } from "@/components/ProductCard";
import { ProductToolbar, SearchStats } from "@/components/ProductToolbar";
import { FiltersSidebar, ActiveFilters } from "@/components/filters-sidebar";
import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";
import { useCollapsibleFilters } from "@/components/hooks/use-collapsible-filters";

// ============================================================================
// Agent Suggestions
// ============================================================================

function AgentSuggestions() {
  const { agentSuggestions, agentSuggestionsLoading, openSidepanel } = useSidepanel();

  if (agentSuggestionsLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <SparklesIcon size={14} className="animate-pulse" />
          <span className="animate-pulse">Loading suggestions...</span>
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

// ============================================================================
// Product Grid
// ============================================================================

function ProductGrid({ viewMode, compact }: { viewMode: "grid" | "list"; compact?: boolean }) {
  const { hits, showMore, isLastPage } = useInfiniteHits<Product>();
  const sentinelRef = useRef<HTMLDivElement>(null);

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
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="ais-InfiniteHits">
        <div className="ais-InfiniteHits-list space-y-4">
          {hits.map((hit, index) => (
            <ProductListItem key={`${hit.objectID}-${index}`} product={hit} />
          ))}
          <div ref={sentinelRef} className="ais-InfiniteHits-sentinel" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className="ais-InfiniteHits">
      <div className={`ais-InfiniteHits-list grid grid-cols-2 md:grid-cols-3 ${compact ? "" : "xl:grid-cols-4"} gap-4`}>
        {hits.map((hit, index) => (
          <ProductCard key={`${hit.objectID}-${index}`} product={hit} />
        ))}
        <div ref={sentinelRef} className="ais-InfiniteHits-sentinel col-span-full" aria-hidden="true" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Category Content
// ============================================================================

function CategoryContent({
  categoryPath,
}: {
  categoryPath: string[];
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { isSidepanelOpen } = useSidepanel();
  const { filtersOpen, toggleFilters } = useCollapsibleFilters();
  const categoryName = categoryPath[categoryPath.length - 1] || "All Products";

  // Build filter using hierarchical_categories (supports filtering unlike searchable categoryPageId)
  // e.g. ["Women"] -> hierarchical_categories.lvl0:"Women"
  // e.g. ["Women", "Shoes"] -> hierarchical_categories.lvl1:"Women > Shoes"
  const getCategoryFilter = () => {
    if (categoryPath.length === 0) return undefined;
    const level = categoryPath.length - 1;
    const filterValue = categoryPath.join(" > ");
    return `hierarchical_categories.lvl${level}:"${filterValue}"`;
  };

  // Apply category filter using useConfigure (works with Composition API)
  useConfigure({
    filters: getCategoryFilter(),
    query: "",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          {categoryPath.map((segment, index) => {
            const href =
              "/category/" +
              categoryPath
                .slice(0, index + 1)
                .map((s) => encodeURIComponent(s))
                .join("/");
            const isLast = index === categoryPath.length - 1;

            return (
              <li key={index} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 shrink-0" />
                {isLast ? (
                  <span className="text-foreground">{segment}</span>
                ) : (
                  <Link
                    href={href}
                    className="hover:text-foreground transition-colors"
                  >
                    {segment}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Page Header */}
      <header className="max-w-7xl mx-auto px-4 pb-6">
        <h1 className="text-3xl font-bold text-foreground">{categoryName}</h1>
      </header>

      {/* Agent Suggestions */}
      <div className="max-w-7xl mx-auto px-4">
        <AgentSuggestions />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
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
            <ActiveFilters />
            <div className="flex items-center gap-2 mb-6">
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
              <SearchStats />
              <div className="flex-1" />
              <ProductToolbar
                viewMode={viewMode}
                setViewMode={setViewMode}
                sidebar={<FiltersSidebar />}
              />
            </div>
            <ProductGrid viewMode={viewMode} compact={isSidepanelOpen} />
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Page Export
// ============================================================================

export default function CategoryPage() {
  const params = useParams();

  const slugParam = params.slug;
  const slugArray = Array.isArray(slugParam)
    ? slugParam
    : slugParam
    ? [slugParam]
    : [];

  const categoryPath = slugArray.map((s) => decodeURIComponent(s));

  // Use the InstantSearch provider from components/providers.tsx
  // Apply category filter via useConfigure hook in CategoryContent
  return (
    <CategoryContent categoryPath={categoryPath} />
  );
}
