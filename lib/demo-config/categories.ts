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
    children: {
      bags: { name: "Bags", slug: "bags" },
      clothing: { name: "Clothing", slug: "clothing" },
      shoes: { name: "Shoes", slug: "shoes" },
    },
  },
  men: {
    name: "Men",
    slug: "men",
    icon: Shirt,
    children: {
      clothing: { name: "Clothing", slug: "clothing" },
      shoes: { name: "Shoes", slug: "shoes" },
    },
  },
  accessories: {
    name: "Accessories",
    slug: "accessories",
    icon: Watch,
    children: {
      women: { name: "Women", slug: "women" },
      men: { name: "Men", slug: "men" },
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
