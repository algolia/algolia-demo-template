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
  Gem,
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
    count: 120,
    icon: ShoppingBag,
    children: {
      leggings: { name: "Leggings", slug: "leggings", count: 20 },
      "sports-bras": { name: "Sports Bras", slug: "sports-bras", count: 15 },
      shorts: { name: "Shorts", slug: "shorts", count: 15 },
      "t-shirts-tops": { name: "T-Shirts & Tops", slug: "t-shirts-tops", count: 12 },
      "hoodies-sweatshirts": { name: "Hoodies & Sweatshirts", slug: "hoodies-sweatshirts", count: 12 },
      sets: { name: "Sets", slug: "sets", count: 10 },
      "tank-tops": { name: "Tank Tops", slug: "tank-tops", count: 10 },
      "joggers-pants": { name: "Joggers & Pants", slug: "joggers-pants", count: 10 },
      tops: { name: "Tops", slug: "tops", count: 8 },
      jackets: { name: "Jackets", slug: "jackets", count: 6 },
      "long-sleeves": { name: "Long Sleeves", slug: "long-sleeves", count: 6 },
      underwear: { name: "Underwear", slug: "underwear", count: 6 },
    },
  },
  men: {
    name: "Men",
    slug: "men",
    count: 100,
    icon: Shirt,
    children: {
      shorts: { name: "Shorts", slug: "shorts", count: 18 },
      "t-shirts-tops": { name: "T-Shirts & Tops", slug: "t-shirts-tops", count: 18 },
      "hoodies-sweatshirts": { name: "Hoodies & Sweatshirts", slug: "hoodies-sweatshirts", count: 12 },
      "joggers-pants": { name: "Joggers & Pants", slug: "joggers-pants", count: 12 },
      "tank-tops": { name: "Tank Tops", slug: "tank-tops", count: 10 },
      "long-sleeves": { name: "Long Sleeves", slug: "long-sleeves", count: 8 },
      underwear: { name: "Underwear", slug: "underwear", count: 8 },
    },
  },
  accessories: {
    name: "Accessories",
    slug: "accessories",
    count: 40,
    icon: Gem,
    children: {
      footwear: { name: "Footwear", slug: "footwear", count: 12 },
      "training-accessories": { name: "Training Accessories", slug: "training-accessories", count: 12 },
      socks: { name: "Socks", slug: "socks", count: 10 },
      headwear: { name: "Headwear", slug: "headwear", count: 6 },
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
  "Accessories": Gem,
};
