/**
 * Category tree and icon mapping
 *
 * Edit this file to define the store's category hierarchy.
 * Categories are displayed in the navigation sidebar (CategoriesSheet)
 * and used for icon mapping in the filters sidebar.
 */
import {
  ShoppingBag,
  Shirt,
  Dumbbell,
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
 * - name: Display name
 * - slug: URL-safe identifier
 * - icon: Lucide icon component
 * - count: (optional) Number of products
 * - children: (optional) Nested subcategories
 */
export const HIERARCHICAL_CATEGORIES: Record<string, RootCategory> = {
  women: {
    name: "Women",
    slug: "women",
    count: 7,
    icon: ShoppingBag,
    children: {
      leggings: {
        name: "Leggings",
        slug: "leggings",
        count: 1,
      },
      "sports-bras": {
        name: "Sports Bras",
        slug: "sports-bras",
        count: 2,
      },
      shorts: {
        name: "Shorts",
        slug: "shorts",
        count: 2,
      },
      "t-shirts": {
        name: "T-Shirts",
        slug: "t-shirts",
        count: 1,
      },
      "hoodies-sweatshirts": {
        name: "Hoodies & Sweatshirts",
        slug: "hoodies-sweatshirts",
        count: 1,
      },
    },
  },
  men: {
    name: "Men",
    slug: "men",
    count: 5,
    icon: Shirt,
    children: {
      shorts: {
        name: "Shorts",
        slug: "shorts",
        count: 1,
      },
      "t-shirts": {
        name: "T-Shirts",
        slug: "t-shirts",
        count: 1,
      },
      joggers: {
        name: "Joggers",
        slug: "joggers",
        count: 1,
      },
      "hoodies-sweatshirts": {
        name: "Hoodies & Sweatshirts",
        slug: "hoodies-sweatshirts",
        count: 2,
      },
    },
  },
  accessories: {
    name: "Accessories",
    slug: "accessories",
    count: 3,
    icon: Dumbbell,
    children: {
      bags: {
        name: "Bags",
        slug: "bags",
        count: 1,
      },
      "gym-equipment": {
        name: "Gym Equipment",
        slug: "gym-equipment",
        count: 2,
      },
    },
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
  "Women": ShoppingBag,
  "Men": Shirt,
  "Accessories": Dumbbell,
};
