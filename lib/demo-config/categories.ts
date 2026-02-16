/**
 * Category tree and icon mapping
 *
 * Edit this file to define the store's category hierarchy.
 * Categories are displayed in the navigation sidebar (CategoriesSheet)
 * and used for icon mapping in the filters sidebar.
 */
import {
  ShoppingBag,
  Tag,
  Sparkles,
  Percent,
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
  // Example categories - replace with your own:
  featured: {
    name: "Featured",
    slug: "featured",
    count: 100,
    icon: Sparkles,
    children: {
      "new-arrivals": { name: "New Arrivals", slug: "new-arrivals", count: 30 },
      bestsellers: { name: "Bestsellers", slug: "bestsellers", count: 50 },
    },
  },
  products: {
    name: "All Products",
    slug: "products",
    count: 500,
    icon: ShoppingBag,
  },
  brands: {
    name: "Brands",
    slug: "brands",
    count: 50,
    icon: Tag,
  },
  promotions: {
    name: "Promotions",
    slug: "promotions",
    count: 80,
    icon: Percent,
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
  // Example - replace with your own:
  // "Electronics": Monitor,
  // "Clothing": Shirt,
};
