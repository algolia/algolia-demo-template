export interface User {
  id: string;
  description: string;
  slug: string;
  /** Pet profile — displayed on the user page and injected into agent context */
  pet?: {
    name: string;
    species: "cane" | "gatto" | "altro";
    breed: string;
    ageMonths: number;
    ageLabel: string;
    size?: string;
    sensitivities?: string[];
  };
  /** Additional pets for multi-pet households */
  pets?: Array<{
    name: string;
    species: "cane" | "gatto" | "altro";
    breed: string;
    ageMonths: number;
    ageLabel: string;
    size?: string;
  }>;
  /** DY segments this user belongs to — passed as ruleContexts to Compositions */
  segments?: string[];
  preferences: {
    "categories.lvl0"?: {
      [key: string]: number;
    };
    "categories.lvl1"?: {
      [key: string]: number;
    };
    "categories.lvl2"?: {
      [key: string]: number;
    };
    "hierarchical_categories.lvl0"?: {
      [key: string]: number;
    };
    "hierarchical_categories.lvl1"?: {
      [key: string]: number;
    };
    "hierarchical_categories.lvl2"?: {
      [key: string]: number;
    };
    "hierarchical_categories.lvl3"?: {
      [key: string]: number;
    };
    categoryPageId?: {
      [key: string]: number;
    };
    brand?: {
      [key: string]: number;
    };
    characteristics?: {
      [key: string]: number;
    };
    format?: {
      [key: string]: number;
    };
    "età.value"?: {
      [key: string]: number;
    };
    "funzione.value"?: {
      [key: string]: number;
    };
    "formato.value"?: {
      [key: string]: number;
    };
    age_bucket?: {
      [key: string]: number;
    };
  };
}

export type PreferenceKey = keyof User["preferences"];

export interface PreferenceMetadata {
  title: string;
  icon: "layers" | "tag" | "calendar" | "target" | "package";
}

/**
 * Generic utility to extract a value from an object using a dot-notation path
 * @param obj The object to extract from
 * @param path The path (e.g., "categories.lvl0" or "brand")
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

  // Handle arrays
  if (Array.isArray(current)) {
    return current.filter(Boolean).map(String);
  }

  // Handle single values
  return [String(current)];
}
