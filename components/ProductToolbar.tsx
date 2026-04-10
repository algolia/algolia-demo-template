"use client";

import { Grid3X3, LayoutList, SlidersHorizontal } from "lucide-react";
import { useStats } from "react-instantsearch";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/components/language/language-context";

export function SearchStats() {
  const { nbHits, processingTimeMS } = useStats();
  const { t } = useLanguage();

  return (
    <p className="text-sm text-muted-foreground">
      {nbHits.toLocaleString()} {t("toolbar.results")}
      <span className="hidden sm:inline"> ({processingTimeMS}ms)</span>
    </p>
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
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-4">
        {sidebar && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {t("filters.filters")}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t("filters.filters")}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{sidebar}</div>
            </SheetContent>
          </Sheet>
        )}

        <div className="hidden sm:flex items-center border border-border rounded-md">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 ${
              viewMode === "grid"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label={t("toolbar.gridView")}
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
            aria-label={t("toolbar.listView")}
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
    </div>
  );
}
