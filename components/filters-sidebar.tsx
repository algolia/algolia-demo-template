"use client";

import { useState, useMemo } from "react";
import {
  useRefinementList,
  useHierarchicalMenu,
  useRange,
  useCurrentRefinements,
  useClearRefinements,
} from "react-instantsearch";
import { ChevronDown, X } from "lucide-react";
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
    <div className="space-y-2">
      {availableItems.map((item) => (
        <label
          key={`${facet}-${item.value}`}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <Checkbox
            checked={item.isRefined}
            onCheckedChange={() => refine(item.value)}
          />
          <span className="text-sm flex-1 group-hover:text-primary transition-colors">
            <span className="text-xs text-muted-foreground">{facetTitle}:</span>{" "}
            {item.value}
          </span>
          <span className="text-xs text-muted-foreground">({item.count})</span>
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
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      <div className="space-y-4 max-h-80 overflow-y-auto">
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
  maxHeight = "max-h-60",
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
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-3 h-9 text-sm"
        />
      )}
      <div className={`space-y-2 ${maxHeight} overflow-y-auto`}>
        {filteredItems.map((item) => (
          <label
            key={item.value}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <Checkbox
              checked={item.isRefined}
              onCheckedChange={() => refine(item.value)}
            />
            <span className="text-sm flex-1 group-hover:text-primary transition-colors truncate">
              {item.label}
            </span>
            <span className="text-xs text-muted-foreground">
              ({item.count})
            </span>
          </label>
        ))}
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
        className={`flex items-center gap-3 w-full transition-all ${
          isTopLevel
            ? `p-3 rounded-lg border ${
                item.isRefined
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background border-border hover:border-primary hover:bg-muted"
              }`
            : `py-2 px-3 rounded-md ${
                item.isRefined
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted"
              }`
        }`}
        style={!isTopLevel ? { marginLeft: `${level * 12}px` } : undefined}
      >
        {IconComponent && (
          <IconComponent
            className={`h-5 w-5 shrink-0 ${
              item.isRefined ? "text-primary-foreground" : "text-primary"
            }`}
          />
        )}
        <span
          className={`text-sm truncate flex-1 text-left ${
            isTopLevel ? "font-medium" : ""
          }`}
        >
          {item.label}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
            isTopLevel
              ? item.isRefined
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
              : "text-muted-foreground"
          }`}
        >
          {item.count}
        </span>
      </button>
      {item.data && item.data.length > 0 && (
        <div className="mt-1 space-y-1">
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
      <div className="space-y-2">
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
          <Input type="number" placeholder={`${minPlaceholder} (${range.min ?? 0})`} value={localMin} onChange={(e) => setLocalMin(e.target.value)} className="h-9 text-sm" />
          <span className="text-muted-foreground">-</span>
          <Input type="number" placeholder={`${maxPlaceholder} (${range.max ?? 0})`} value={localMax} onChange={(e) => setLocalMax(e.target.value)} className="h-9 text-sm" />
        </div>
        <Button onClick={handleApply} variant="outline" size="sm" className="w-full">Aplicar</Button>
      </div>
    </FilterSection>
  );
}

// ============================================================================
// Filter Section (shared layout)
// ============================================================================

export function FilterSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border pb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 text-left font-medium"
      >
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>
      {isExpanded && <div className="pt-2">{children}</div>}
    </div>
  );
}

// ============================================================================
// Assembled Sidebar
// ============================================================================

export function FiltersSidebar() {
  const { t } = useLanguage();

  return (
    <aside className="space-y-4">
      <ForYouFilter />
      <HierarchicalCategoryFilter
        attributes={[
          "hierarchical_categories.lvl0",
          "hierarchical_categories.lvl1",
        ]}
        title={t("filters.topic")}
      />
      <RefinementListFilter
        attribute="domain"
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

  if (!canRefine) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {items.map((item) =>
        item.refinements.map((refinement) => (
          <button
            key={`${item.attribute}-${refinement.label}`}
            onClick={() => refine(refinement)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-all hover:scale-105"
          >
            <span>{item.label}: {refinement.label}</span>
            <X className="w-3.5 h-3.5" />
          </button>
        ))
      )}
      <button
        onClick={() => clearAll()}
        className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        {useLanguage().t("filters.clearAll")}
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
