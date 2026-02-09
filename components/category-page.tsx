"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useHits,
  usePagination,
  useConfigure,
  useSearchBox,
} from "react-instantsearch";
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/types/product";
import { ProductCard, ProductListItem } from "@/components/ProductCard";
import { ProductToolbar } from "@/components/ProductToolbar";
import { FiltersSidebar, ActiveFilters } from "@/components/filters-sidebar";
import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";

// ============================================================================
// Product Grid
// ============================================================================

function ProductGrid({ viewMode, compact }: { viewMode: "grid" | "list"; compact?: boolean }) {
  const { results } = useHits();
  const hits = (results?.hits || []) as unknown as Product[];

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
      <div className="space-y-4">
        {hits.map((hit) => (
          <ProductListItem key={hit.objectID} product={hit} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 ${compact ? "" : "xl:grid-cols-4"} gap-4`}>
      {hits.map((hit) => (
        <ProductCard key={hit.objectID} product={hit} />
      ))}
    </div>
  );
}

// ============================================================================
// Pagination
// ============================================================================

function Pagination() {
  const { currentRefinement, nbPages, pages, isFirstPage, isLastPage, refine } =
    usePagination({ padding: 2 });

  if (nbPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-1 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => refine(currentRefinement - 1)}
        disabled={isFirstPage}
      >
        Previous
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentRefinement ? "default" : "outline"}
          size="sm"
          onClick={() => refine(page)}
          className="w-10"
        >
          {page + 1}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => refine(currentRefinement + 1)}
        disabled={isLastPage}
      >
        Next
      </Button>
    </nav>
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
  const [filtersOpen, setFiltersOpen] = useState(true);
  const { isSidepanelOpen } = useSidepanel();
  const userToggledRef = useRef(false);
  const categoryName = categoryPath[categoryPath.length - 1] || "All Products";

  // Auto-collapse filters when sidepanel opens, restore when it closes
  useEffect(() => {
    if (isSidepanelOpen) {
      setFiltersOpen(false);
    } else if (!userToggledRef.current) {
      setFiltersOpen(true);
    }
  }, [isSidepanelOpen]);

  const toggleFilters = () => {
    userToggledRef.current = true;
    setFiltersOpen((prev) => !prev);
  };

  // Build the hierarchical filter based on category depth
  // Level 0: "Salud y bienestar" -> hierarchicalCategories.lvl0:"Salud y bienestar"
  // Level 1: ["Salud y bienestar", "Vitaminas"] -> hierarchicalCategories.lvl1:"Salud y bienestar > Vitaminas"
  const getHierarchicalFilter = () => {
    if (categoryPath.length === 0) return undefined;
    const level = categoryPath.length - 1;
    const filterValue = categoryPath.join(" > ");
    return `hierarchicalCategories.lvl${level}:"${filterValue}"`;
  };

  // Apply category filter using useConfigure (works with Composition API)
  useConfigure({
    filters: getHierarchicalFilter(),
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
            <ProductGrid viewMode={viewMode} compact={isSidepanelOpen} />
            <Pagination />
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
