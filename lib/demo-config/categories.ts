/**
 * Category tree and icon mapping
 *
 * Edit this file to define the store's category hierarchy.
 * Categories are displayed in the navigation sidebar (CategoriesSheet)
 * and used for icon mapping in the filters sidebar.
 */
import {
  Bike,
  Snowflake,
  Ship,
  Cpu,
  Shield,
  Mountain,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type CategoryNode = {
  name: string;
  slug: string;
  count?: number;
  children?: Record<string, CategoryNode>;
};

export type RootCategory = CategoryNode & {
  icon: React.ComponentType<{ className?: string }>;
};

// ============================================================================
// Category Tree
// ============================================================================

/**
 * Hierarchical category tree for the navigation sidebar.
 *
 * Each root category requires:
 * - name: Display name (MUST match Algolia facet value exactly)
 * - slug: URL-safe identifier
 * - icon: Lucide icon component
 * - count: (optional) Number of products
 * - children: (optional) Nested subcategories
 */
export const HIERARCHICAL_CATEGORIES: Record<string, RootCategory> = {
  motorcycles: {
    name: "Motorcycles",
    slug: "motorcycles",
    icon: Shield,
  },
  snow: {
    name: "Snow",
    slug: "snow",
    icon: Snowflake,
  },
  bike: {
    name: "Bike",
    slug: "bike",
    icon: Bike,
  },
  "d-air": {
    name: "D-Air",
    slug: "d-air",
    icon: Cpu,
  },
  "smart-jacket": {
    name: "Smart Jacket",
    slug: "smart-jacket",
    icon: Cpu,
  },
  "off-road": {
    name: "Off-Road",
    slug: "off-road",
    icon: Mountain,
  },
  sailing: {
    name: "Sailing",
    slug: "sailing",
    icon: Ship,
  },
};

// ============================================================================
// Category Icons (for filters sidebar)
// ============================================================================

/**
 * Maps category names (as they appear in Algolia's hierarchicalCategories.lvl0)
 * to Lucide icon components. Used in the HierarchicalCategoryFilter.
 *
 * Keys must match EXACTLY the category names in your Algolia index.
 */
export const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Motorcycles": Shield,
  "Snow": Snowflake,
  "Bike": Bike,
  "D-Air": Cpu,
  "Smart Jacket": Cpu,
  "Off-Road": Mountain,
  "Sailing": Ship,
};
