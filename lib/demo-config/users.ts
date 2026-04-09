import type { User, PreferenceKey, PreferenceMetadata } from "@/lib/types/user";

export const users: User[] = [
  {
    id: "1",
    description: "Home Renovator",
    slug: "home_renovator",
    preferences: {
      "hierarchical_categories.lvl0": { "Baths": 20, "Showers": 18 },
      "hierarchical_categories.lvl1": {
        "Baths > Freestanding Baths": 20,
        "Showers > Shower Enclosures": 18,
        "Baths > Double Ended Baths": 15,
      },
    },
  },
  {
    id: "2",
    description: "Bathroom Designer",
    slug: "bathroom_designer",
    preferences: {
      "hierarchical_categories.lvl0": { "Sanitaryware": 20, "Furniture": 18 },
      "hierarchical_categories.lvl1": {
        "Sanitaryware > Toilets": 20,
        "Sanitaryware > Basins": 18,
        "Furniture > Vanity Units": 16,
        "Furniture > Bathroom Cabinets": 14,
      },
    },
  },
  {
    id: "3",
    description: "First-Time Buyer",
    slug: "first_time_buyer",
    preferences: {
      "hierarchical_categories.lvl0": { "Showers": 20, "Sanitaryware": 15 },
      "hierarchical_categories.lvl1": {
        "Showers > Electric Showers": 20,
        "Showers > Shower Trays": 18,
        "Sanitaryware > Toilets": 15,
        "Sanitaryware > Basins": 12,
      },
    },
  },
  {
    id: "4",
    description: "Contractor",
    slug: "contractor",
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
