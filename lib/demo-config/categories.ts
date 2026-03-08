/**
 * Category tree and icon mapping
 *
 * Edit this file to define the store's category hierarchy.
 * Categories are displayed in the navigation sidebar (CategoriesSheet)
 * and used for icon mapping in the filters sidebar.
 */
import {
  Home,
  Sofa,
  Lamp,
  BedDouble,
  UtensilsCrossed,
  BookOpen,
  Clock,
  Flame,
  Frame,
  FlowerIcon,
  Briefcase,
  Archive,
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
  "home-kitchen": {
    name: "Home & Kitchen",
    slug: "home-kitchen",
    count: 10008,
    icon: Home,
    children: {
      furniture: {
        name: "Furniture",
        slug: "furniture",
        children: {
          "living-room-furniture": { name: "Living Room Furniture", slug: "living-room-furniture" },
          "bedroom-furniture": { name: "Bedroom Furniture", slug: "bedroom-furniture" },
          "dining-room-furniture": { name: "Dining Room Furniture", slug: "dining-room-furniture" },
          "kitchen-furniture": { name: "Kitchen Furniture", slug: "kitchen-furniture" },
          "office-furniture": { name: "Office Furniture", slug: "office-furniture" },
          "bathroom-furniture": { name: "Bathroom Furniture", slug: "bathroom-furniture" },
          "entryway-furniture": { name: "Entryway Furniture", slug: "entryway-furniture" },
          "game-room-furniture": { name: "Game & Recreation Room Furniture", slug: "game-room-furniture" },
        },
      },
      "home-decor": {
        name: "Home Decor Products",
        slug: "home-decor",
        children: {
          clocks: { name: "Clocks", slug: "clocks" },
          "candles-holders": { name: "Candles & Holders", slug: "candles-holders" },
          mirrors: { name: "Mirrors", slug: "mirrors" },
          vases: { name: "Vases", slug: "vases" },
          "picture-frames": { name: "Picture Frames", slug: "picture-frames" },
          "artificial-plants": { name: "Artificial Plants", slug: "artificial-plants" },
          "home-fragrance": { name: "Home Fragrance", slug: "home-fragrance" },
          sculptures: { name: "Sculptures", slug: "sculptures" },
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
  "Home & Kitchen": Home,
};
