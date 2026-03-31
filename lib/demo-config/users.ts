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
    description: "Track day racer",
    slug: "marco-racer",
    preferences: {
      product_segment: { Racing: 20, Performance: 15 },
      Collection: { "Leather Jackets": 18, "Leather Suits": 20 },
      product_line: { Motorcycles: 15 },
    },
  },
  {
    id: "2",
    description: "Adventure touring rider",
    slug: "sarah-touring",
    preferences: {
      product_segment: { "Sport Touring": 20, "Adventure Touring": 18 },
      Collection: {
        "Gore-Tex Jackets": 20,
        "D-dry Jackets": 17,
        "Textile Jackets": 15,
      },
      product_line: { Motorcycles: 12 },
    },
  },
  {
    id: "3",
    description: "Urban commuter",
    slug: "alex-urban",
    preferences: {
      product_segment: { Urban: 20, Merchandising: 12 },
      Collection: { Shoes: 18, "Textile Jackets": 15, "Mid layers": 14 },
      product_line: { Motorcycles: 8, "Demon Basics": 12 },
    },
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
  "hierarchical_categories.lvl0": {
    title: "Main Categories",
    icon: "layers",
  },
  "hierarchical_categories.lvl1": {
    title: "Sub Categories",
    icon: "layers",
  },
  "hierarchical_categories.lvl2": {
    title: "Specific Categories",
    icon: "layers",
  },
  brand: {
    title: "Brands",
    icon: "tag",
  },
  gender: {
    title: "Gender",
    icon: "tag",
  },
  "color.filter_group": {
    title: "Color",
    icon: "tag",
  },
  product_segment: {
    title: "Riding Style",
    icon: "target",
  },
  Collection: {
    title: "Gear Type",
    icon: "layers",
  },
  product_line: {
    title: "Sport",
    icon: "tag",
  },
};
