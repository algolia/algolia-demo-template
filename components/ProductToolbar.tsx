"use client";

import { Grid3X3, LayoutList, SlidersHorizontal } from "lucide-react";
import { useStats, useSortBy } from "react-instantsearch";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";

// Sort options - adjust index names to match your Algolia replicas
const SORT_OPTIONS = [
  { value: ALGOLIA_CONFIG.INDEX_NAME, label: "Relevance" },
  { value: `${ALGOLIA_CONFIG.INDEX_NAME}_price_asc`, label: "Price: Low to High" },
  { value: `${ALGOLIA_CONFIG.INDEX_NAME}_price_desc`, label: "Price: High to Low" },
  { value: `${ALGOLIA_CONFIG.INDEX_NAME}_newest`, label: "Newest First" },
];

export function SearchStats() {
  const { nbHits, processingTimeMS } = useStats();

  return (
    <p className="text-sm text-muted-foreground">
      {nbHits.toLocaleString()} results
      <span className="hidden sm:inline"> ({processingTimeMS}ms)</span>
    </p>
  );
}

export function SortSelector() {
  const { currentRefinement, refine, options } = useSortBy({
    items: SORT_OPTIONS,
  });

  return (
    <Select value={currentRefinement} onValueChange={refine}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface ProductToolbarProps {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  sidebar?: React.ReactNode;
}

export function ProductToolbar({
  viewMode,
  setViewMode,
  sidebar,
}: ProductToolbarProps) {
  return (
    <div className="flex items-center gap-4">
        {/* Mobile Filter Trigger */}
        {sidebar && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{sidebar}</div>
            </SheetContent>
          </Sheet>
        )}

        {/* <SortSelector /> */}

        {/* View Mode Toggle */}
        <div className="hidden sm:flex items-center border border-border rounded-md">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 ${
              viewMode === "grid"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 ${
              viewMode === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="List view"
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
    </div>
  );
}

