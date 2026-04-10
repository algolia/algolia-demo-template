/**
 * Category tree and icon mapping for e-commerce store
 */
import { Shirt, Laptop, Home, Dumbbell, ShoppingBag } from "lucide-react";

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
  fashion: {
    name: "Fashion",
    slug: "fashion",
    icon: Shirt,
    children: {
      tops: { name: "Tops", slug: "tops" },
      bottoms: { name: "Bottoms", slug: "bottoms" },
      shoes: { name: "Shoes", slug: "shoes" },
    },
  },
  electronics: {
    name: "Electronics",
    slug: "electronics",
    icon: Laptop,
    children: {
      phones: { name: "Phones", slug: "phones" },
      laptops: { name: "Laptops", slug: "laptops" },
    },
  },
  home: {
    name: "Home",
    slug: "home",
    icon: Home,
    children: {},
  },
  sports: {
    name: "Sports",
    slug: "sports",
    icon: Dumbbell,
    children: {},
  },
};

export const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Fashion: Shirt,
  Electronics: Laptop,
  Home: Home,
  Sports: Dumbbell,
  Accessories: ShoppingBag,
};
