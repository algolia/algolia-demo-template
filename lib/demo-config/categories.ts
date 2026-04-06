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
    slug: "Women",
    count: 842,
    icon: ShoppingBag,
    children: {
      leggings: { name: "Leggings", slug: "Leggings", count: 143 },
      "sports-bras": { name: "Sports Bras", slug: "Sports Bras", count: 149 },
      shorts: { name: "Shorts", slug: "Shorts", count: 114 },
      "t-shirts-tops": { name: "T-Shirts & Tops", slug: "T-Shirts & Tops", count: 79 },
      "sleeveless-tank-tops": { name: "Sleeveless & Tank Tops", slug: "Sleeveless & Tank Tops", count: 65 },
      "joggers-pants": { name: "Pants", slug: "Pants", count: 75 },
      "hoodies-sweatshirts": { name: "Hoodies & Sweatshirts", slug: "Hoodies & Sweatshirts", count: 66 },
      "long-sleeves": { name: "Long Sleeves", slug: "Long Sleeves", count: 50 },
      "crop-tops": { name: "Crop Tops", slug: "Crop Tops", count: 41 },
      jackets: { name: "Jackets & Outerwear", slug: "Jackets & Outerwear", count: 51 },
    },
  },
  men: {
    name: "Men",
    slug: "Men",
    count: 841,
    icon: Shirt,
    children: {
      "t-shirts-tops": { name: "T-Shirts & Tops", slug: "T-Shirts & Tops", count: 230 },
      shorts: { name: "Shorts", slug: "Shorts", count: 181 },
      "sleeveless-tank-tops": { name: "Sleeveless & Tank Tops", slug: "Sleeveless & Tank Tops", count: 119 },
      "hoodies-sweatshirts": { name: "Hoodies & Sweatshirts", slug: "Hoodies & Sweatshirts", count: 110 },
      pants: { name: "Pants", slug: "Pants", count: 103 },
      "long-sleeves": { name: "Long Sleeves", slug: "Long Sleeves", count: 42 },
      jackets: { name: "Jackets & Outerwear", slug: "Jackets & Outerwear", count: 23 },
      underwear: { name: "Underwear", slug: "Underwear", count: 10 },
    },
  },
  accessories: {
    name: "Accessories",
    slug: "Accessories",
    count: 224,
    icon: Dumbbell,
    children: {
      bags: { name: "Bags", slug: "Bags", count: 57 },
      socks: { name: "Socks", slug: "Socks", count: 46 },
      headwear: { name: "Headwear", slug: "Headwear", count: 29 },
      "bottles-shakers": { name: "Bottles & Shakers", slug: "Bottles & Shakers", count: 21 },
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
  "Unisex": Dumbbell,
};
