import {
  Bath,
  Droplets,
  Home,
  ShowerHead,
  Wrench,
  Wind,
  Layers,
  Square,
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
  baths: {
    name: "Baths",
    slug: "Baths",
    count: 13,
    icon: Bath,
    children: {
      "bath-screens": { name: "Bath Screens", slug: "Bath Screens", count: 11 },
      "standard-baths": { name: "Standard Baths", slug: "Standard Baths", count: 2 },
    },
  },
  basins: {
    name: "Basins",
    slug: "Basins",
    count: 85,
    icon: Droplets,
    children: {
      "basin": { name: "Basin", slug: "Basin", count: 85 },
    },
  },
  showers: {
    name: "Showers",
    slug: "Showers",
    count: 69,
    icon: ShowerHead,
    children: {
      "shower-doors": { name: "Shower Doors", slug: "Shower Doors", count: 60 },
      "shower-riser-rails": { name: "Shower Riser Rails", slug: "Shower Riser Rails", count: 5 },
      "shower-toilets": { name: "Shower Toilets", slug: "Shower Toilets", count: 4 },
    },
  },
  furniture: {
    name: "Furniture",
    slug: "Furniture",
    count: 90,
    icon: Home,
    children: {
      "worktops": { name: "Worktops", slug: "Worktops", count: 45 },
      "vanity-units": { name: "Vanity Units", slug: "Vanity Units", count: 17 },
      "furniture-accessories": { name: "Furniture Accessories", slug: "Furniture Accessories", count: 17 },
      "wc-units": { name: "WC Units", slug: "WC Units", count: 4 },
      "cabinets-storage": { name: "Cabinets & Storage", slug: "Cabinets & Storage", count: 3 },
      "console-units": { name: "Console Units", slug: "Console Units", count: 2 },
    },
  },
  taps: {
    name: "Taps",
    slug: "Taps",
    count: 38,
    icon: Wrench,
    children: {
      "basin-taps": { name: "Basin Taps", slug: "Basin Taps", count: 21 },
      "bath-shower-taps": { name: "Bath Shower Taps", slug: "Bath Shower Taps", count: 15 },
    },
  },
  toilets: {
    name: "Toilets",
    slug: "Toilets",
    count: 41,
    icon: Square,
    children: {
      "flush-plates": { name: "Flush Plates", slug: "Flush Plates", count: 18 },
      "toilet-pans": { name: "Toilet Pans", slug: "Toilet Pans", count: 10 },
      "shower-toilets": { name: "Shower Toilets", slug: "Shower Toilets", count: 6 },
      "toilet-seats": { name: "Toilet Seats", slug: "Toilet Seats", count: 3 },
    },
  },
  accessories: {
    name: "Accessories",
    slug: "Accessories",
    count: 63,
    icon: Layers,
    children: {
      "mirror-cabinets": { name: "Mirror Cabinets", slug: "Mirror Cabinets", count: 44 },
      "bathroom-accessories": { name: "Bathroom Accessories", slug: "Bathroom Accessories", count: 12 },
      "mirrors": { name: "Mirrors", slug: "Mirrors", count: 7 },
    },
  },
};

export const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Baths": Bath,
  "Basins": Droplets,
  "Showers": ShowerHead,
  "Furniture": Home,
  "Taps": Wrench,
  "Toilets": Square,
  "Accessories": Layers,
  "Towel Warmers": Wind,
};
