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
    count: 1303,
    icon: ShoppingBag,
    children: {
      bags: {
        name: "Bags",
        slug: "bags",
        count: 693,
        children: {
          "shoulder-bags": { name: "Shoulder bags", slug: "shoulder-bags", count: 217 },
          handbag: { name: "Handbag", slug: "handbag", count: 209 },
          wallets: { name: "Wallets", slug: "wallets", count: 175 },
          shopper: { name: "Shopper", slug: "shopper", count: 56 },
          clutches: { name: "Clutches", slug: "clutches", count: 31 },
        },
      },
      clothing: {
        name: "Clothing",
        slug: "clothing",
        count: 459,
        children: {
          "t-shirts": { name: "T-shirts", slug: "t-shirts", count: 217 },
          jackets: { name: "Jackets", slug: "jackets", count: 60 },
          jeans: { name: "Jeans", slug: "jeans", count: 60 },
          tops: { name: "Tops", slug: "tops", count: 27 },
          dresses: { name: "Dresses", slug: "dresses", count: 23 },
          skirts: { name: "Skirts", slug: "skirts", count: 23 },
          blazer: { name: "Blazer", slug: "blazer", count: 16 },
          shirts: { name: "Shirts", slug: "shirts", count: 16 },
          trouser: { name: "Trouser", slug: "trouser", count: 16 },
        },
      },
      shoes: {
        name: "Shoes",
        slug: "shoes",
        count: 151,
        children: {
          sneakers: { name: "Sneakers", slug: "sneakers", count: 66 },
          sandals: { name: "Sandals", slug: "sandals", count: 36 },
          loafers: { name: "Loafers", slug: "loafers", count: 17 },
          pumps: { name: "Pumps", slug: "pumps", count: 15 },
          ballerinas: { name: "Ballerinas", slug: "ballerinas", count: 14 },
        },
      },
    },
  },
  men: {
    name: "Men",
    slug: "men",
    count: 278,
    icon: Shirt,
    children: {
      clothing: {
        name: "Clothing",
        slug: "clothing",
        count: 196,
        children: {
          "t-shirts": { name: "T-shirts", slug: "t-shirts", count: 50 },
          jackets: { name: "Jackets", slug: "jackets", count: 46 },
          tops: { name: "Tops", slug: "tops", count: 36 },
          trousers: { name: "Trousers", slug: "trousers", count: 19 },
          shirts: { name: "Shirts", slug: "shirts", count: 14 },
          jeans: { name: "Jeans", slug: "jeans", count: 12 },
          blazer: { name: "Blazer", slug: "blazer", count: 11 },
          suits: { name: "Suits", slug: "suits", count: 8 },
        },
      },
      shoes: {
        name: "Shoes",
        slug: "shoes",
        count: 82,
        children: {
          sneakers: { name: "Sneakers", slug: "sneakers", count: 55 },
          loafers: { name: "Loafers", slug: "loafers", count: 10 },
          "lace-up-shoes": { name: "Lace-up shoes", slug: "lace-up-shoes", count: 3 },
        },
      },
    },
  },
  accessories: {
    name: "Accessories",
    slug: "accessories",
    count: 211,
    icon: Gem,
    children: {
      women: {
        name: "Women",
        slug: "women",
        count: 140,
        children: {
          clothing: { name: "Clothing", slug: "clothing", count: 18 },
          looks: { name: "Looks", slug: "looks", count: 14 },
          sunglasses: { name: "Sunglasses", slug: "sunglasses", count: 5 },
        },
      },
      men: {
        name: "Men",
        slug: "men",
        count: 71,
        children: {
          clothing: { name: "Clothing", slug: "clothing", count: 17 },
        },
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
  "Accessories": Gem,
};
