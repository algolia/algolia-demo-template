"use client";

import { useState, useMemo } from "react";
import {
  useRefinementList,
  useHierarchicalMenu,
  useRange,
  useCurrentRefinements,
  useClearRefinements,
} from "react-instantsearch";
import { ChevronDown, X, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/components/user/user-context";
import { type PreferenceKey } from "@/lib/types/user";
import { PREFERENCE_METADATA } from "@/lib/demo-config/users";
import { CATEGORY_ICONS } from "@/lib/demo-config/categories";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language/language-context";

// ============================================================================
// Helper Types and Functions
// ============================================================================

function getCategoryIcon(
  categoryName: string
): React.ComponentType<{ className?: string }> | null {
  return CATEGORY_ICONS[categoryName] || null;
}

interface ParsedPreference {
  facet: string;
  value: string;
  score: number;
}

function parsePersonalizationFilters(
  filters: string[] | undefined
): ParsedPreference[] {
  if (!filters) return [];

  return filters
    .map((filter) => {
      const match = filter.match(/^(.+?):(.+)<score=(\d+)>$/);
      if (!match) return null;
      const [, facet, value, scoreStr] = match;
      return { facet, value, score: parseInt(scoreStr, 10) };
    })
    .filter((pref): pref is ParsedPreference => pref !== null)
    .sort((a, b) => b.score - a.score);
}

// ============================================================================
// Filter Components
// ============================================================================

function ForYouFacetFilter({
  facet,
  preferences,
}: {
  facet: string;
  preferences: ParsedPreference[];
}) {
  const { items, refine } = useRefinementList({ attribute: facet });

  const facetTitle =
    PREFERENCE_METADATA[facet as PreferenceKey]?.title || facet;

  const preferenceItems = preferences.map((pref) => {
    const item = items.find((i) => i.value === pref.value);
    return {
      ...pref,
      isRefined: item?.isRefined ?? false,
      count: item?.count,
    };
  });

  const availableItems = preferenceItems.filter(
    (item) => item.count && item.count > 0
  );

  if (availableItems.length === 0) return null;

  return (
    <div className="space-y-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
        {facetTitle}
      </span>
      {availableItems.map((item) => (
        <label
          key={`${facet}-${item.value}`}
          className="flex items-center gap-2.5 cursor-pointer group py-1 px-2 -mx-2 hover:bg-muted/50 transition-colors"
        >
          <Checkbox
            checked={item.isRefined}
            onCheckedChange={() => refine(item.value)}
          />
          <span className="text-[13px] flex-1 group-hover:text-foreground transition-colors text-foreground/80">
            {item.value}
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground/60 font-medium">
            {item.count}
          </span>
        </label>
      ))}
    </div>
  );
}

export function ForYouFilter() {
  const { personalizationFilters, currentUser } = useUser();
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);

  const parsedPreferences = useMemo(
    () => parsePersonalizationFilters(personalizationFilters),
    [personalizationFilters]
  );

  const groupedPreferences = useMemo(() => {
    const groups: Record<string, ParsedPreference[]> = {};
    parsedPreferences.forEach((pref) => {
      if (!groups[pref.facet]) groups[pref.facet] = [];
      groups[pref.facet].push(pref);
    });
    return groups;
  }, [parsedPreferences]);

  if (!currentUser || parsedPreferences.length === 0) return null;

  return (
    <FilterSection
      title={t("filters.forYou")}
      icon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      accent
    >
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {Object.entries(groupedPreferences).map(([facet, preferences]) => (
          <ForYouFacetFilter key={facet} facet={facet} preferences={preferences} />
        ))}
      </div>
    </FilterSection>
  );
}

// ============================================================================
// Common Filter Components
// ============================================================================

interface RefinementListFilterProps {
  attribute: string;
  title: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  limit?: number;
  showMoreLimit?: number;
  defaultExpanded?: boolean;
  maxHeight?: string;
}

export function RefinementListFilter({
  attribute,
  title,
  searchable = false,
  searchPlaceholder = "",
  limit = 10,
  showMoreLimit = 50,
  defaultExpanded = true,
}: RefinementListFilterProps) {
  const { items, refine } = useRefinementList({
    attribute,
    limit,
    showMore: true,
    showMoreLimit,
  });
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <FilterSection
      title={title}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      {searchable && (
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-[13px] pl-8 bg-muted/30 border-transparent focus:border-border focus:bg-background transition-colors"
          />
        </div>
      )}
      <div className="space-y-0.5 max-h-60 overflow-y-auto">
        {filteredItems.map((item) => (
          <label
            key={item.value}
            className="flex items-center gap-2.5 cursor-pointer group py-1.5 px-2 -mx-2 hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={item.isRefined}
              onCheckedChange={() => refine(item.value)}
            />
            <span className="text-[13px] flex-1 group-hover:text-foreground transition-colors truncate text-foreground/80">
              {item.label}
            </span>
            <span className="text-[11px] tabular-nums text-muted-foreground/60 font-medium">
              {item.count}
            </span>
          </label>
        ))}
        {filteredItems.length === 0 && (
          <p className="text-[12px] text-muted-foreground/50 py-2 px-2">
            No results
          </p>
        )}
      </div>
    </FilterSection>
  );
}

// ============================================================================
// Hierarchical Menu
// ============================================================================

interface HierarchicalMenuItemProps {
  item: {
    value: string;
    label: string;
    count: number;
    isRefined: boolean;
    data: HierarchicalMenuItemProps["item"][] | null;
  };
  refine: (value: string) => void;
  level?: number;
}

function HierarchicalMenuItem({ item, refine, level = 0 }: HierarchicalMenuItemProps) {
  const IconComponent = level === 0 ? getCategoryIcon(item.label) : null;
  const isTopLevel = level === 0;

  return (
    <div>
      <button
        onClick={() => refine(item.value)}
        className={cn(
          "flex items-center gap-2.5 w-full transition-all",
          isTopLevel
            ? cn(
                "py-2.5 px-3 border",
                item.isRefined
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background border-border hover:border-foreground/30 hover:bg-muted/50"
              )
            : cn(
                "py-1.5 px-2.5 text-[13px]",
                item.isRefined
                  ? "text-foreground font-medium bg-primary/10"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
              )
        )}
        style={!isTopLevel ? { marginLeft: `${level * 10}px` } : undefined}
      >
        {IconComponent && (
          <IconComponent
            className={cn(
              "h-4 w-4 shrink-0",
              item.isRefined ? "text-background" : "text-foreground/60"
            )}
          />
        )}
        <span
          className={cn(
            "truncate flex-1 text-left",
            isTopLevel ? "text-[13px] font-semibold tracking-tight" : ""
          )}
        >
          {item.label}
        </span>
        <span
          className={cn(
            "text-[11px] tabular-nums font-medium shrink-0",
            isTopLevel
              ? item.isRefined
                ? "text-background/60"
                : "text-muted-foreground/50"
              : "text-muted-foreground/50"
          )}
        >
          {item.count}
        </span>
      </button>
      {item.data && item.data.length > 0 && (
        <div className="mt-0.5 space-y-0.5">
          {item.data.map((childItem) => (
            <HierarchicalMenuItem
              key={childItem.value}
              item={childItem}
              refine={refine}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HierarchicalCategoryFilterProps {
  attributes: string[];
  title?: string;
}

export function HierarchicalCategoryFilter({
  attributes,
  title = "Tema",
}: HierarchicalCategoryFilterProps) {
  const { items, refine } = useHierarchicalMenu({
    attributes,
    limit: 10,
    sortBy: ["count:desc"],
  });
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <FilterSection
      title={title}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      <div className="space-y-1">
        {items.map((item) => (
          <HierarchicalMenuItem key={item.value} item={item} refine={refine} />
        ))}
      </div>
    </FilterSection>
  );
}

// ============================================================================
// Range Filter (kept for potential use)
// ============================================================================

interface RangeFilterProps {
  attribute: string;
  title: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  defaultExpanded?: boolean;
}

export function RangeFilter({
  attribute,
  title,
  minPlaceholder = "Mín",
  maxPlaceholder = "Màx",
  defaultExpanded = true,
}: RangeFilterProps) {
  const { start, range, refine } = useRange({ attribute });
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [localMin, setLocalMin] = useState(Number.isFinite(start[0]) ? start[0]!.toString() : "");
  const [localMax, setLocalMax] = useState(Number.isFinite(start[1]) ? start[1]!.toString() : "");

  const handleApply = () => {
    const min = localMin ? Number(localMin) : undefined;
    const max = localMax ? Number(localMax) : undefined;
    refine([min, max]);
  };

  return (
    <FilterSection
      title={title}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input type="number" placeholder={`${minPlaceholder} (${range.min ?? 0})`} value={localMin} onChange={(e) => setLocalMin(e.target.value)} className="h-8 text-[13px] bg-muted/30 border-transparent focus:border-border focus:bg-background" />
          <span className="text-muted-foreground/40 text-xs">—</span>
          <Input type="number" placeholder={`${maxPlaceholder} (${range.max ?? 0})`} value={localMax} onChange={(e) => setLocalMax(e.target.value)} className="h-8 text-[13px] bg-muted/30 border-transparent focus:border-border focus:bg-background" />
        </div>
        <Button onClick={handleApply} variant="outline" size="sm" className="w-full h-8 text-[13px]">Aplicar</Button>
      </div>
    </FilterSection>
  );
}

// ============================================================================
// Filter Section (shared layout)
// ============================================================================

export function FilterSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  accent,
}: {
  title: string;
  icon?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      "pb-5",
      accent ? "bg-primary/[0.04] -mx-3 px-3 pt-3 border-l-2 border-primary" : "border-b border-border/60"
    )}>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-1 text-left group"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/70 group-hover:text-foreground transition-colors">
            {title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-200",
            isExpanded ? "rotate-180" : ""
          )}
        />
      </button>
      {isExpanded && <div className="pt-3">{children}</div>}
    </div>
  );
}

// ============================================================================
// Assembled Sidebar
// ============================================================================

export function FiltersSidebar() {
  const { t } = useLanguage();

  return (
    <aside className="space-y-1">
      <ForYouFilter />
      <HierarchicalCategoryFilter
        attributes={[
          "hierarchical_categories.lvl0",
          "hierarchical_categories.lvl1",
        ]}
        title={t("filters.topic")}
      />
      <RefinementListFilter
        attribute="siteLabel"
        title={t("filters.website")}
        searchable
        searchPlaceholder={t("filters.searchWebsite")}
        limit={10}
        showMoreLimit={30}
      />
      <RefinementListFilter
        attribute="mimeType"
        title={t("filters.fileType")}
        limit={5}
      />
    </aside>
  );
}

// ============================================================================
// Active Filters
// ============================================================================

export function ActiveFilters() {
  const { items, refine } = useCurrentRefinements();
  const { refine: clearAll, canRefine } = useClearRefinements();
  const { t } = useLanguage();

  if (!canRefine) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-6">
      {items.map((item) =>
        item.refinements.map((refinement) => (
          <button
            key={`${item.attribute}-${refinement.label}`}
            onClick={() => refine(refinement)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-semibold bg-foreground text-background hover:bg-foreground/80 transition-colors"
          >
            <span>{refinement.label}</span>
            <X className="w-3 h-3 opacity-60" />
          </button>
        ))
      )}
      <button
        onClick={() => clearAll()}
        className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors ml-1"
      >
        {t("filters.clearAll")}
      </button>
    </div>
  );
}

// Keep parseColorValue export for any remaining references
export function parseColorValue(value: string): { name: string; hex: string | null } {
  const semicolonIndex = value.indexOf(";");
  if (semicolonIndex === -1) return { name: value, hex: null };
  return { name: value.slice(0, semicolonIndex), hex: value.slice(semicolonIndex + 1) };
}
