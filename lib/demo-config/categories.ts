/**
 * Category tree and icon mapping for e-commerce store
 */
import { ShoppingBag, Shirt, Footprints, Watch } from "lucide-react";

export type CategoryNode = {
  name: string;
  slug: string;
  count?: number;
  children?: Record<string, CategoryNode>;
};

export type RootCategory = CategoryNode & {
  icon: React.ComponentType<{ className?: string }>;
};

export const HIERARCHICAL_CATEGORIES: Record<string, RootCategory> = {
  women: {
    name: "Women",
    slug: "women",
    icon: ShoppingBag,
    count: 1303,
    children: {
      bags: { name: "Bags", slug: "bags", count: 693 },
      clothing: { name: "Clothing", slug: "clothing", count: 459 },
      shoes: { name: "Shoes", slug: "shoes", count: 151 },
    },
  },
  men: {
    name: "Men",
    slug: "men",
    icon: Shirt,
    count: 278,
    children: {
      clothing: { name: "Clothing", slug: "clothing", count: 196 },
      shoes: { name: "Shoes", slug: "shoes", count: 82 },
    },
  },
  accessories: {
    name: "Accessories",
    slug: "accessories",
    icon: Watch,
    count: 211,
    children: {
      women: { name: "Women", slug: "women", count: 140 },
      men: { name: "Men", slug: "men", count: 71 },
    },
  },
};

export const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Women: ShoppingBag,
  Men: Shirt,
  Accessories: Watch,
};
