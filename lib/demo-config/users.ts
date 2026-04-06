import type { User, PreferenceKey, PreferenceMetadata } from "@/lib/types/user";

export const users: User[] = [
  {
    id: "1",
    description: "Gym Enthusiast",
    slug: "gym_enthusiast",
    preferences: {
      "hierarchical_categories.lvl0": { "Women": 20 },
      "hierarchical_categories.lvl1": {
        "Women > Leggings": 20,
        "Women > Sports Bras": 18,
        "Women > T-Shirts & Tops": 15,
        "Women > Crop Tops": 12,
      },
    },
  },
  {
    id: "2",
    description: "Runner",
    slug: "runner",
    preferences: {
      "hierarchical_categories.lvl0": { "Men": 20 },
      "hierarchical_categories.lvl1": {
        "Men > Shorts": 20,
        "Men > T-Shirts & Tops": 18,
        "Men > Sleeveless & Tank Tops": 16,
      },
    },
  },
  {
    id: "3",
    description: "Weightlifter",
    slug: "weightlifter",
    preferences: {
      "hierarchical_categories.lvl0": { "Men": 20 },
      "hierarchical_categories.lvl1": {
        "Men > Hoodies & Sweatshirts": 20,
        "Men > Pants": 18,
        "Men > T-Shirts & Tops": 16,
        "Accessories > Bags": 10,
      },
    },
  },
  {
    id: "4",
    description: "New Visitor",
    slug: "new_visitor",
    preferences: {},
  },
];

export const PREFERENCE_METADATA: Record<PreferenceKey, PreferenceMetadata> = {
  "categories.lvl0": { title: "Main Categories", icon: "layers" },
  "categories.lvl1": { title: "Subcategories", icon: "tag" },
  "categories.lvl2": { title: "Specific Categories", icon: "tag" },
  "hierarchical_categories.lvl0": { title: "Main Categories", icon: "layers" },
  "hierarchical_categories.lvl1": { title: "Sub Categories", icon: "layers" },
  "hierarchical_categories.lvl2": { title: "Sub Categories", icon: "layers" },
  "hierarchical_categories.lvl3": { title: "Sub Categories", icon: "layers" },
  brand: { title: "Brands", icon: "tag" },
  characteristics: { title: "Characteristics", icon: "target" },
  format: { title: "Format", icon: "package" },
};
