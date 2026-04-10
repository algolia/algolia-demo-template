export interface PetProfile {
  name: string;
  species: string;
  breed?: string;
  ageMonths?: number;
  ageLabel?: string;
  size?: string;
}

export interface User {
  id: string;
  description: string;
  slug: string;
  pet?: PetProfile;
  pets?: PetProfile[];
  segments?: string[];
  preferences: Record<string, Record<string, number>>;
}

/**
 * PreferenceKey is a string — demos define their own facet keys.
 * PREFERENCE_METADATA in users.ts maps keys to display labels.
 */
export type PreferenceKey = string;

export interface PreferenceMetadata {
  title: string;
  icon: "layers" | "tag" | "calendar" | "target" | "package" | "globe" | "building";
}

/**
 * Generic utility to extract a value from an object using a dot-notation path
 * @param obj The object to extract from
 * @param path The path (e.g., "hierarchical_categories.lvl0" or "brand")
 * @returns Array of values (handles both single values and arrays)
 */
export function extractProductFieldValues(obj: any, path: string): string[] {
  if (!obj) return [];

  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current == null) return [];
    current = current[part];
  }

  if (current == null) return [];

  if (Array.isArray(current)) {
    return current.filter(Boolean).map(String);
  }

  return [String(current)];
}
