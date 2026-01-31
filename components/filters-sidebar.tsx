"use client";

import { useState, useMemo } from "react";
import {
  useRefinementList,
  useHierarchicalMenu,
  useRange,
  useCurrentRefinements,
  useClearRefinements,
} from "react-instantsearch";
import { ChevronDown, X, Dog, Cat, Rabbit, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/components/user/user-context";
import { PREFERENCE_METADATA, type PreferenceKey } from "@/lib/types/user";

// ============================================================================
// Helper Types and Functions
// ============================================================================

/**
 * Category icon mapping for hierarchicalCategories.lvl0
 */
const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Cane: Dog,
  Gatto: Cat,
  "Piccoli Animali": Rabbit,
  "Persona e Casa": Home,
};

/**
 * Get icon component for a category name
 */
function getCategoryIcon(
  categoryName: string
): React.ComponentType<{ className?: string }> | null {
  return CATEGORY_ICONS[categoryName] || null;
}

/**
 * Parsed user preference with facet, value, and score
 */
interface ParsedPreference {
  facet: string;
  value: string;
  score: number;
}

/**
 * Parses personalization filters from UserContext format into structured preferences
 *
 * Input format: "facetName:value<score=N>"
 * Examples:
 *   - "età.value:PUPPY<score=20>"
 *   - "brand:ROYAL CANIN<score=17>"
 *   - "hierarchicalCategories.lvl0:Gatto<score=20>"
 *
 * @param filters - Array of personalization filter strings from UserContext
 * @returns Parsed preferences sorted by score (descending)
 */
function parsePersonalizationFilters(
  filters: string[] | undefined
): ParsedPreference[] {
  if (!filters) return [];

  return filters
    .map((filter) => {
      // Format: "facetName:value<score=N>"
      const match = filter.match(/^(.+?):(.+)<score=(\d+)>$/);
      if (!match) return null;

      const [, facet, value, scoreStr] = match;
      return {
        facet,
        value,
        score: parseInt(scoreStr, 10),
      };
    })
    .filter((pref): pref is ParsedPreference => pref !== null)
    .sort((a, b) => b.score - a.score); // Sort by score descending
}

// ============================================================================
// Filter Components
// ============================================================================

/**
 * Renders personalized filter options for a single facet
 *
 * This component:
 * - Uses Algolia's useRefinementList to manage filter state
 * - Only shows preferences that have available results (count > 0)
 * - Displays facet title from PREFERENCE_METADATA
 * - Allows users to toggle individual preferences on/off
 *
 * @param facet - The Algolia facet attribute name (e.g., "età.value", "brand")
 * @param preferences - User preferences for this facet, sorted by score
 */
function ForYouFacetFilter({
  facet,
  preferences,
}: {
  facet: string;
  preferences: ParsedPreference[];
}) {
  const { items, refine } = useRefinementList({
    attribute: facet,
  });

  // Get the title from metadata
  const facetTitle =
    PREFERENCE_METADATA[facet as PreferenceKey]?.title || facet;

  // Map preferences to items to check if they're refined
  const preferenceItems = preferences.map((pref) => {
    const item = items.find((i) => i.value === pref.value);
    return {
      ...pref,
      isRefined: item?.isRefined ?? false,
      count: item?.count,
    };
  });

  // Filter to only show preferences that have results
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

/**
 * "For You" personalized filter section
 *
 * Displays user-specific filter suggestions based on their profile preferences.
 *
 * Behavior:
 * - Reads personalizationFilters from UserContext
 * - Parses and groups preferences by facet
 * - Sorts preferences within each facet by score (highest first)
 * - Only renders when a user is selected and has preferences
 * - Preferences act as standard Algolia refinements
 *
 * The filter appears at the top of the sidebar and helps users quickly
 * apply filters matching their profile (e.g., age, brand, category preferences).
 *
 * Format: "Facet Name: Value (count)"
 * Example: "Age (Età): PUPPY (42)"
 */
export function ForYouFilter() {
  const { personalizationFilters, currentUser } = useUser();
  const [isExpanded, setIsExpanded] = useState(true);

  const parsedPreferences = useMemo(
    () => parsePersonalizationFilters(personalizationFilters),
    [personalizationFilters]
  );

  // Group preferences by facet
  const groupedPreferences = useMemo(() => {
    const groups: Record<string, ParsedPreference[]> = {};
    parsedPreferences.forEach((pref) => {
      if (!groups[pref.facet]) {
        groups[pref.facet] = [];
      }
      groups[pref.facet].push(pref);
    });
    return groups;
  }, [parsedPreferences]);

  // Don't show if no user selected or no preferences
  if (!currentUser || parsedPreferences.length === 0) {
    return null;
  }

  return (
    <FilterSection
      title="For You"
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {Object.entries(groupedPreferences).map(([facet, preferences]) => (
          <ForYouFacetFilter
            key={facet}
            facet={facet}
            preferences={preferences}
          />
        ))}
      </div>
    </FilterSection>
  );
}

// ============================================================================
// Common Filter Components
// ============================================================================

interface RefinementListFilterProps {
  /** Algolia attribute to filter on */
  attribute: string;
  /** Display title for the filter section */
  title: string;
  /** Whether to show a search input for filtering items */
  searchable?: boolean;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Initial number of items to show */
  limit?: number;
  /** Number of items to show when "show more" is clicked */
  showMoreLimit?: number;
  /** Whether the filter section is initially expanded */
  defaultExpanded?: boolean;
  /** Maximum height for the scrollable list */
  maxHeight?: string;
}

/**
 * A reusable refinement list filter component
 *
 * This component wraps Algolia's useRefinementList hook and provides:
 * - Collapsible filter section
 * - Optional search input for filtering items
 * - Checkbox-based selection with counts
 * - Scrollable list for many items
 */
export function RefinementListFilter({
  attribute,
  title,
  searchable = false,
  searchPlaceholder = "Search...",
  limit = 10,
  showMoreLimit = 50,
  defaultExpanded = true,
  maxHeight = "max-h-60",
}: RefinementListFilterProps) {
  const { items, refine, searchForItems } = useRefinementList({
    attribute,
    limit,
    showMore: true,
    showMoreLimit,
  });
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

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
          onChange={(e) => searchForItems(e.target.value)}
          className="mb-3 h-9 text-sm"
        />
      )}
      <div className={`space-y-2 ${maxHeight} overflow-y-auto`}>
        {items.map((item) => (
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

export function BrandFilter() {
  return (
    <RefinementListFilter
      attribute="brand"
      title="Brand"
      searchable
      searchPlaceholder="Search brands..."
      limit={10}
      showMoreLimit={50}
    />
  );
}

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

/**
 * Recursive component to render hierarchical menu items
 */
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
      {/* Render child items if they exist */}
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
  /** Array of hierarchical category attributes (e.g., ['hierarchicalCategories.lvl0', 'hierarchicalCategories.lvl1']) */
  attributes: string[];
  /** Display title for the filter section */
  title?: string;
}

export function HierarchicalCategoryFilter({
  attributes,
  title = "Category",
}: HierarchicalCategoryFilterProps) {
  const { items, refine } = useHierarchicalMenu({
    attributes,
    limit: 4,
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
          <HierarchicalMenuItem
            key={item.value}
            item={item}
            refine={refine}
          />
        ))}
      </div>
    </FilterSection>
  );
}

export function CategoryFilter() {
  return (
    <RefinementListFilter
      attribute="categories"
      title="Category"
      limit={10}
      showMoreLimit={30}
    />
  );
}

export function SubcategoryFilter() {
  return (
    <RefinementListFilter
      attribute="hierarchicalCategories.lvl1"
      title="Subcategory"
      searchable
      searchPlaceholder="Search subcategories..."
      limit={10}
      showMoreLimit={50}
    />
  );
}

interface RangeFilterProps {
  /** Algolia attribute to filter on */
  attribute: string;
  /** Display title for the filter section */
  title: string;
  /** Placeholder prefix for min input (e.g., "Min") */
  minPlaceholder?: string;
  /** Placeholder prefix for max input (e.g., "Max") */
  maxPlaceholder?: string;
  /** Whether the filter section is initially expanded */
  defaultExpanded?: boolean;
}

/**
 * A reusable range filter component
 *
 * This component wraps Algolia's useRange hook and provides:
 * - Collapsible filter section
 * - Min/max number inputs
 * - Apply button to submit range
 */
export function RangeFilter({
  attribute,
  title,
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  defaultExpanded = true,
}: RangeFilterProps) {
  const { start, range, refine } = useRange({ attribute });
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [localMin, setLocalMin] = useState(start[0]?.toString() || "");
  const [localMax, setLocalMax] = useState(start[1]?.toString() || "");

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
          <Input
            type="number"
            placeholder={`${minPlaceholder} (${range.min ?? 0})`}
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            className="h-9 text-sm"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder={`${maxPlaceholder} (${range.max ?? 0})`}
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <Button
          onClick={handleApply}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Apply
        </Button>
      </div>
    </FilterSection>
  );
}

export function PriceRangeFilter() {
  return (
    <RangeFilter
      attribute="price"
      title="Price"
      minPlaceholder="Min €"
      maxPlaceholder="Max €"
    />
  );
}

export function CharacteristicsFilter() {
  return (
    <RefinementListFilter
      attribute="characteristics"
      title="Characteristics"
      searchable
      searchPlaceholder="Search characteristics..."
      limit={10}
      showMoreLimit={30}
    />
  );
}

export function IngredientsFilter() {
  return (
    <RefinementListFilter
      attribute="ingredients"
      title="Ingredients"
      searchable
      searchPlaceholder="Search ingredients..."
      limit={10}
      showMoreLimit={50}
    />
  );
}

export function FormatFilter() {
  return (
    <RefinementListFilter
      attribute="format"
      title="Format"
      limit={10}
      showMoreLimit={20}
    />
  );
}

export function InStockFilter() {
  const { items, refine } = useRefinementList({
    attribute: "inStock",
  });
  const [isExpanded, setIsExpanded] = useState(true);

  const inStockItem = items.find((item) => item.value === "true");

  if (!inStockItem) return null;

  return (
    <FilterSection
      title="Availability"
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      <label className="flex items-center gap-2 cursor-pointer group">
        <Checkbox
          checked={inStockItem.isRefined}
          onCheckedChange={() => refine("true")}
        />
        <span className="text-sm flex-1 group-hover:text-primary transition-colors">
          In Stock Only
        </span>
        <span className="text-xs text-muted-foreground">
          ({inStockItem.count})
        </span>
      </label>
    </FilterSection>
  );
}

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
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {isExpanded && <div className="pt-2">{children}</div>}
    </div>
  );
}

export function FiltersSidebar() {
  return (
    <aside className="space-y-4">
      <ForYouFilter />
      <InStockFilter />
      <HierarchicalCategoryFilter
        attributes={[
          "hierarchicalCategories.lvl0",
          "hierarchicalCategories.lvl1",
          "hierarchicalCategories.lvl2",
          "hierarchicalCategories.lvl3",
        ]}
        title="Category"
      />
      <BrandFilter />
      <FormatFilter />
      <PriceRangeFilter />
      <CharacteristicsFilter />
      <IngredientsFilter />
    </aside>
  );
}

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
            <span className="capitalize">
              {item.label}: {refinement.label}
            </span>
            <X className="w-3.5 h-3.5" />
          </button>
        ))
      )}
      <button
        onClick={() => clearAll()}
        className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}
