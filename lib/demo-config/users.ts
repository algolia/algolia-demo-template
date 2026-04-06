/**
 * Demo user profiles and preference metadata
 *
 * Edit this file to define personas for demonstrating personalization.
 * Each user has preference weights (0-20) for various product attributes.
 */
import type { User, PreferenceKey, PreferenceMetadata } from "@/lib/types/user";

// ============================================================================
// Demo User Profiles
// ============================================================================

/**
 * Demo users for showcasing personalization features.
 *
 * Each user's preferences map to Algolia facet attributes.
 * Higher scores (0-20) indicate stronger preference.
 */
export const users: User[] = [
  {
    id: "1",
    description: "Gym Enthusiast",
    slug: "gym_enthusiast",
    preferences: {
      "hierarchical_categories.lvl0": {
        "Women's": 20,
      },
      "hierarchical_categories.lvl1": {
        "Leggings": 20,
        "Training Tops": 18,
        "Sports Bras": 15,
      },
    },
  },
  {
    id: "2",
    description: "Runner",
    slug: "runner",
    preferences: {
      "hierarchical_categories.lvl0": {
        "Men's": 20,
      },
      "hierarchical_categories.lvl1": {
        "Running": 20,
        "Shorts": 18,
        "T-Shirts": 16,
      },
    },
  },
  {
    id: "3",
    description: "Weightlifter",
    slug: "weightlifter",
    preferences: {
      "hierarchical_categories.lvl0": {
        "Men's": 20,
      },
      "hierarchical_categories.lvl1": {
        "Training": 20,
        "Lifting Belts": 18,
        "Gym Wear": 16,
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

// ============================================================================
// Preference Metadata
// ============================================================================

/**
 * Maps preference keys to human-readable titles and icons.
 * Used in the "For You" filter section and personalization badges.
 */
export const PREFERENCE_METADATA: Record<PreferenceKey, PreferenceMetadata> = {
  "categories.lvl0": {
    title: "Main Categories",
    icon: "layers",
  },
  "categories.lvl1": {
    title: "Subcategories",
    icon: "tag",
  },
  "categories.lvl2": {
    title: "Specific Categories",
    icon: "tag",
  },
  "hierarchical_categories.lvl0": {
    title: "Main Categories (Lvl 0)",
    icon: "layers",
  },
  "hierarchical_categories.lvl1": {
    title: "Sub Categories (Lvl 1)",
    icon: "layers",
  },
  "hierarchical_categories.lvl2": {
    title: "Sub Categories (Lvl 2)",
    icon: "layers",
  },
  "hierarchical_categories.lvl3": {
    title: "Sub Categories (Lvl 3)",
    icon: "layers",
  },
  brand: {
    title: "Brands",
    icon: "tag",
  },
  characteristics: {
    title: "Characteristics",
    icon: "target",
  },
  format: {
    title: "Format",
    icon: "package",
  },
};
