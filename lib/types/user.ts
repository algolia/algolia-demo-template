export const users: User[] = [
  {
    id: "1",
    description: "New puppy owner",
    slug: "new-puppy-owner",
    preferences: {
      categoryPageId: {
        "Cane > Cibo Secco": 18,
        "Cane > Snack": 15,
        "Cane > Giochi": 16
      },
      "età.value": {
        "PUPPY": 20
      },
      brand: {
        "ROYAL CANIN": 17
      }
    }
  },
  {
    id: "2",
    description: "Senior dog owner",
    slug: "senior-dog-owner",
    preferences: {
      categoryPageId: {
        "Cane > Diete Cibo Secco": 20,
        "Cane > Antiparassitari e Curativi": 18
      },
      "età.value": {
        "ANZIANO": 20
      },
      "funzione.value": {
        "CONTROLLO DEL PESO": 18
      },
      brand: {
        "ROYAL CANIN": 17
      }
    }
  },
];



export interface User {
  id: string;
  description: string;
  slug: string;
  preferences: {
    categoryPageId?: {
      [key: string]: number;
    };
    categories?: {
      [key: string]: number;
    };
    "età.value"?: {
      [key: string]: number;
    };
    "funzione.value"?: {
      [key: string]: number;
    };
    brand?: {
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
    "formato.value"?: {
      [key: string]: number;
    };
  }
}

export type PreferenceKey = keyof User['preferences'];

export interface PreferenceMetadata {
  title: string;
  icon: 'layers' | 'tag' | 'calendar' | 'target' | 'package';
}

/**
 * Generic utility to extract a value from an object using a dot-notation path
 * @param obj The object to extract from
 * @param path The path (e.g., "età.value" or "brand")
 * @returns Array of values (handles both single values and arrays)
 */
export function extractProductFieldValues(obj: any, path: string): string[] {
  if (!obj) return [];

  const parts = path.split('.');
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
  categoryPageId: {
    title: 'Category Pages',
    icon: 'layers',
  },
  categories: {
    title: 'Categories',
    icon: 'tag',
  },
  'età.value': {
    title: 'Age (Età)',
    icon: 'calendar',
  },
  'funzione.value': {
    title: 'Function (Funzione)',
    icon: 'target',
  },
  brand: {
    title: 'Brands',
    icon: 'tag',
  },
  'formato.value': {
    title: 'Format (Formato)',
    icon: 'package',
  },
  'hierarchicalCategories.lvl0': {
    title: 'Main Categories (Lvl 0)',
    icon: 'layers',
  },
  'hierarchicalCategories.lvl1': {
    title: 'Sub Categories (Lvl 1)',
    icon: 'layers',
  },
  'hierarchicalCategories.lvl2': {
    title: 'Sub Categories (Lvl 2)',
    icon: 'layers',
  },
  'hierarchicalCategories.lvl3': {
    title: 'Sub Categories (Lvl 3)',
    icon: 'layers',
  },
};