export const users: User[] = [
  {
    id: "1",
    description: "Fitness enthusiast",
    slug: "fitness-enthusiast",
    preferences: {
      "categories.lvl0": {
        "Nutrición deportiva": 20,
      },
      "categories.lvl1": {
        "Proteínas": 18,
        "Pre-entrenamiento": 16,
        "Aminoácidos": 15,
      },
      brand: {
        "Sport Series": 17,
      },
    },
  },
  {
    id: "2",
    description: "Health & wellness seeker",
    slug: "health-wellness-seeker",
    preferences: {
      "categories.lvl0": {
        "Salud y bienestar": 20,
      },
      "categories.lvl1": {
        "Vitaminas": 18,
        "Minerales": 16,
        "Sistema inmune": 15,
      },
      brand: {
        "Now Foods": 17,
      },
    },
  },
  {
    id: "3",
    description: "Weight management focus",
    slug: "weight-management",
    preferences: {
      "categories.lvl0": {
        "Especialidades": 18,
        "Nutrición deportiva": 16,
      },
      "categories.lvl1": {
        "Control de peso": 20,
        "Quemadores": 17,
        "Proteínas": 15,
      },
      brand: {
        "Essential Series": 16,
      },
    },
  },
  {
    id: "4",
    description: "Vegan athlete",
    slug: "vegan-athlete",
    preferences: {
      "categories.lvl0": {
        "Nutrición deportiva": 20,
        "Alimentación saludable": 17,
      },
      "categories.lvl1": {
        "Proteínas": 18,
        "Aminoácidos": 16,
      },
      "categories.lvl2": {
        "Proteínas vegetales": 20,
      },
      brand: {
        "Raw Series": 18,
      },
    },
  },
  {
    id: "5",
    description: "Senior wellness",
    slug: "senior-wellness",
    preferences: {
      "categories.lvl0": {
        "Salud y bienestar": 20,
      },
      "categories.lvl1": {
        "Huesos y articulaciones": 20,
        "Colesterol": 17,
        "Circulación-corazón": 16,
        "Especial seniors": 18,
      },
      brand: {
        "Swanson": 16,
      },
    },
  },
  {
    id: "6",
    description: "Women's health",
    slug: "womens-health",
    preferences: {
      "categories.lvl0": {
        "Salud y bienestar": 20,
      },
      "categories.lvl1": {
        "Especial mujer": 20,
        "Piel, pelo y uñas": 18,
        "Vitaminas": 16,
      },
      brand: {
        "Now Foods": 15,
      },
    },
  },
  {
    id: "7",
    description: "Digestive health",
    slug: "digestive-health",
    preferences: {
      "categories.lvl0": {
        "Salud y bienestar": 20,
      },
      "categories.lvl1": {
        "Digestión": 20,
        "Extractos y plantas": 16,
      },
      "categories.lvl2": {
        "Probióticos": 18,
        "Flora Intestinal": 17,
      },
    },
  },
  {
    id: "8",
    description: "Bodybuilder",
    slug: "bodybuilder",
    preferences: {
      "categories.lvl0": {
        "Nutrición deportiva": 20,
      },
      "categories.lvl1": {
        "Proteínas": 20,
        "Creatina": 18,
        "Ganadores de peso": 17,
        "Anabólicos naturales": 16,
      },
      brand: {
        "Sport Series": 18,
      },
    },
  },
  {
    id: "9",
    description: "Healthy eating enthusiast",
    slug: "healthy-eating",
    preferences: {
      "categories.lvl0": {
        "Alimentación saludable": 20,
      },
      "categories.lvl1": {
        "Superalimentos": 18,
        "Cereales y semillas": 16,
        "Snacks": 15,
      },
      brand: {
        "Food Series": 17,
      },
    },
  },
  {
    id: "10",
    description: "Stress & sleep support",
    slug: "stress-sleep-support",
    preferences: {
      "categories.lvl0": {
        "Salud y bienestar": 20,
      },
      "categories.lvl1": {
        "Sueño/Descanso": 20,
        "Estrés y ansiedad": 18,
        "Extractos y plantas": 15,
      },
    },
  },
];

export interface User {
  id: string;
  description: string;
  slug: string;
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
    "hierarchicalCategories.lvl0"?: {
      [key: string]: number;
    };
    "hierarchicalCategories.lvl1"?: {
      [key: string]: number;
    };
    "hierarchicalCategories.lvl2"?: {
      [key: string]: number;
    };
    "hierarchicalCategories.lvl3"?: {
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
  "hierarchicalCategories.lvl0": {
    title: "Main Categories (Lvl 0)",
    icon: "layers",
  },
  "hierarchicalCategories.lvl1": {
    title: "Sub Categories (Lvl 1)",
    icon: "layers",
  },
  "hierarchicalCategories.lvl2": {
    title: "Sub Categories (Lvl 2)",
    icon: "layers",
  },
  "hierarchicalCategories.lvl3": {
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
