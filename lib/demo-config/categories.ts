import {
  ShoppingBag,
  Shirt,
  Dumbbell,
} from "lucide-react";

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
    count: 935,
    icon: ShoppingBag,
    children: {
      leggings: { name: "Leggings", slug: "leggings", count: 170 },
      "sports-bras": { name: "Sports Bras", slug: "sports-bras", count: 188 },
      shorts: { name: "Shorts", slug: "shorts", count: 136 },
      "t-shirts-tops": { name: "T-Shirts & Tops", slug: "t-shirts-tops", count: 97 },
      "tank-tops": { name: "Tank Tops", slug: "tank-tops", count: 85 },
      "joggers-pants": { name: "Joggers & Pants", slug: "joggers-pants", count: 87 },
      "hoodies-sweatshirts": { name: "Hoodies & Sweatshirts", slug: "hoodies-sweatshirts", count: 52 },
      "long-sleeves": { name: "Long Sleeves", slug: "long-sleeves", count: 58 },
      jackets: { name: "Jackets", slug: "jackets", count: 32 },
      sets: { name: "Sets", slug: "sets", count: 9 },
      underwear: { name: "Underwear", slug: "underwear", count: 1 },
    },
  },
  men: {
    name: "Men",
    slug: "men",
    count: 988,
    icon: Shirt,
    children: {
      shorts: { name: "Shorts", slug: "shorts", count: 253 },
      "t-shirts-tops": { name: "T-Shirts & Tops", slug: "t-shirts-tops", count: 202 },
      "tank-tops": { name: "Tank Tops", slug: "tank-tops", count: 110 },
      "joggers-pants": { name: "Joggers & Pants", slug: "joggers-pants", count: 103 },
      "hoodies-sweatshirts": { name: "Hoodies & Sweatshirts", slug: "hoodies-sweatshirts", count: 94 },
      "long-sleeves": { name: "Long Sleeves", slug: "long-sleeves", count: 39 },
      jackets: { name: "Jackets", slug: "jackets", count: 18 },
      underwear: { name: "Underwear", slug: "underwear", count: 8 },
    },
  },
  accessories: {
    name: "Accessories",
    slug: "accessories",
    count: 221,
    icon: Dumbbell,
    children: {
      bags: { name: "Bags", slug: "bags", count: 61 },
      socks: { name: "Socks", slug: "socks", count: 58 },
      "training-accessories": { name: "Training Accessories", slug: "training-accessories", count: 48 },
      headwear: { name: "Headwear", slug: "headwear", count: 38 },
    },
  },
};

export const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Women": ShoppingBag,
  "Men": Shirt,
  "Accessories": Dumbbell,
};
