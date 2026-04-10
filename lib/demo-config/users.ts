/**
 * Demo user profiles — e-commerce shopper personas
 */
import type { User, PreferenceMetadata } from "@/lib/types/user";

export const users: User[] = [
  {
    id: "1",
    description: "Sarah — Fashion enthusiast",
    slug: "sarah-fashion",
    segments: ["fashion_lover"],
    preferences: {
      "hierarchical_categories.lvl0": { Women: 18 },
      brand: { Nike: 12, Adidas: 10 },
    },
  },
  {
    id: "2",
    description: "Mike — Tech buyer",
    slug: "mike-tech",
    segments: ["tech_enthusiast"],
    preferences: {
      "hierarchical_categories.lvl0": { Electronics: 18 },
      brand: { Apple: 14, Samsung: 12 },
    },
  },
];

export const PREFERENCE_METADATA: Record<string, PreferenceMetadata> = {
  "hierarchical_categories.lvl0": { title: "Categories", icon: "layers" },
  "hierarchical_categories.lvl1": { title: "Subcategories", icon: "layers" },
  categoryPageId: { title: "Categories", icon: "layers" },
  brand: { title: "Brands", icon: "tag" },
};
