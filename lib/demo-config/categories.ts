/**
 * Category tree and icon mapping
 *
 * Edit this file to define the store's category hierarchy.
 * Categories are displayed in the navigation sidebar (CategoriesSheet)
 * and used for icon mapping in the filters sidebar.
 */
import {
  Dog,
  Cat,
  Rabbit,
  Home,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type CategoryNode = {
  name: string;
  slug: string;
  count?: number;
  children?: Record<string, CategoryNode>;
};

export type RootCategory = CategoryNode & {
  icon: React.ComponentType<{ className?: string }>;
};

// ============================================================================
// Category Tree
// ============================================================================

/**
 * Hierarchical category tree for the navigation sidebar.
 * Category names MUST match Algolia facet values exactly (case-sensitive).
 */
export const HIERARCHICAL_CATEGORIES: Record<string, RootCategory> = {
  cane: {
    name: "Cane",
    slug: "cane",
    count: 4951,
    icon: Dog,
    children: {
      "cibo-secco": {
        name: "Cibo Secco",
        slug: "cibo-secco",
        count: 880,
      },
      snack: {
        name: "Snack",
        slug: "snack",
        count: 726,
        children: {
          masticativi: { name: "Masticativi", slug: "masticativi", count: 171 },
          biscotti: { name: "Biscotti", slug: "biscotti", count: 73 },
        },
      },
      "antiparassitari-e-curativi": {
        name: "Antiparassitari e Curativi",
        slug: "antiparassitari-e-curativi",
        count: 539,
        children: {
          integratori: { name: "Integratori", slug: "integratori", count: 350 },
          parafarmacia: { name: "Parafarmacia", slug: "parafarmacia", count: 121 },
          antiparassitari: { name: "Antiparassitari", slug: "antiparassitari", count: 68 },
        },
      },
      "cibo-umido": {
        name: "Cibo Umido",
        slug: "cibo-umido",
        count: 540,
      },
      giochi: {
        name: "Giochi",
        slug: "giochi",
        count: 463,
        children: {
          extrastrong: { name: "Extrastrong", slug: "extrastrong", count: 100 },
          peluche: { name: "Peluche", slug: "peluche", count: 89 },
          "tira-e-molla": { name: "Tira e Molla", slug: "tira-e-molla", count: 66 },
          palle: { name: "Palle", slug: "palle", count: 51 },
          interattivi: { name: "Interattivi", slug: "interattivi", count: 33 },
        },
      },
      accessori: {
        name: "Accessori",
        slug: "accessori",
        count: 407,
        children: {
          "ciotole-e-dispenser": { name: "Ciotole e Dispenser", slug: "ciotole-e-dispenser", count: 176 },
          abbigliamento: { name: "Abbigliamento", slug: "abbigliamento", count: 89 },
          toelettatura: { name: "Toelettatura", slug: "toelettatura", count: 89 },
          addestramento: { name: "Addestramento", slug: "addestramento", count: 38 },
        },
      },
      guinzaglieria: {
        name: "Guinzaglieria",
        slug: "guinzaglieria",
        count: 358,
        children: {
          guinzagli: { name: "Guinzagli", slug: "guinzagli", count: 146 },
          pettorine: { name: "Pettorine", slug: "pettorine", count: 102 },
          collari: { name: "Collari", slug: "collari", count: 92 },
        },
      },
      igiene: {
        name: "Igiene",
        slug: "igiene",
        count: 283,
        children: {
          "manto-e-cute": { name: "Manto e Cute", slug: "manto-e-cute", count: 118 },
          orale: { name: "Orale", slug: "orale", count: 45 },
          "sacchetti-igienici": { name: "Sacchetti Igienici", slug: "sacchetti-igienici", count: 27 },
          salviette: { name: "Salviette", slug: "salviette", count: 20 },
        },
      },
      "diete-cibo-secco": {
        name: "Diete Cibo Secco",
        slug: "diete-cibo-secco",
        count: 215,
      },
      "cucce-e-lettini": {
        name: "Cucce e Lettini",
        slug: "cucce-e-lettini",
        count: 196,
        children: {
          "cucce-morbide": { name: "Cucce Morbide", slug: "cucce-morbide", count: 51 },
          cuscini: { name: "Cuscini", slug: "cuscini", count: 48 },
        },
      },
      "diete-cibo-umido": {
        name: "Diete Cibo Umido",
        slug: "diete-cibo-umido",
        count: 189,
      },
      "trasportini-e-viaggio": {
        name: "Trasportini e viaggio",
        slug: "trasportini-e-viaggio",
        count: 134,
        children: {
          "trasporto-auto": { name: "Trasporto Auto", slug: "trasporto-auto", count: 34 },
          borse: { name: "Borse", slug: "borse", count: 28 },
          trasportini: { name: "Trasportini", slug: "trasportini", count: 24 },
        },
      },
      "alimentazione-casalinga": {
        name: "Alimentazione Casalinga",
        slug: "alimentazione-casalinga",
        count: 27,
      },
    },
  },
  gatto: {
    name: "Gatto",
    slug: "gatto",
    count: 3189,
    icon: Cat,
    children: {
      "cibo-umido": {
        name: "Cibo Umido",
        slug: "cibo-umido",
        count: 789,
      },
      accessori: {
        name: "Accessori",
        slug: "accessori",
        count: 579,
        children: {
          giochi: { name: "Giochi", slug: "giochi", count: 276 },
          "ciotole-e-dispenser": { name: "Ciotole e Dispenser", slug: "ciotole-e-dispenser", count: 110 },
          "cucce-e-lettini": { name: "Cucce e Lettini", slug: "cucce-e-lettini", count: 106 },
          toelettatura: { name: "Toelettatura", slug: "toelettatura", count: 37 },
          guinzaglieria: { name: "Guinzaglieria", slug: "guinzaglieria", count: 30 },
        },
      },
      "cibo-secco": {
        name: "Cibo Secco",
        slug: "cibo-secco",
        count: 471,
      },
      "antiparassitari-e-curativi": {
        name: "Antiparassitari e Curativi",
        slug: "antiparassitari-e-curativi",
        count: 323,
        children: {
          integratori: { name: "Integratori", slug: "integratori", count: 221 },
          parafarmacia: { name: "Parafarmacia", slug: "parafarmacia", count: 82 },
        },
      },
      snack: {
        name: "Snack",
        slug: "snack",
        count: 270,
      },
      sabbie: {
        name: "Sabbie",
        slug: "sabbie",
        count: 160,
        children: {
          agglomerante: { name: "Agglomerante", slug: "agglomerante", count: 85 },
          vegetale: { name: "Vegetale", slug: "vegetale", count: 44 },
          assorbente: { name: "Assorbente", slug: "assorbente", count: 21 },
        },
      },
      "diete-cibo-umido": {
        name: "Diete Cibo Umido",
        slug: "diete-cibo-umido",
        count: 160,
      },
      tiragraffi: {
        name: "Tiragraffi",
        slug: "tiragraffi",
        count: 145,
        children: {
          arredo: { name: "Arredo", slug: "arredo", count: 83 },
          tavoletta: { name: "Tavoletta", slug: "tavoletta", count: 40 },
        },
      },
      "diete-cibo-secco": {
        name: "Diete Cibo Secco",
        slug: "diete-cibo-secco",
        count: 102,
      },
      "toilette-e-accessori": {
        name: "Toilette e accessori",
        slug: "toilette-e-accessori",
        count: 88,
        children: {
          toilette: { name: "Toilette", slug: "toilette", count: 51 },
        },
      },
      igiene: {
        name: "Igiene",
        slug: "igiene",
        count: 46,
        children: {
          orale: { name: "Orale", slug: "orale", count: 26 },
        },
      },
      trasportini: {
        name: "Trasportini",
        slug: "trasportini",
        count: 31,
      },
    },
  },
  "piccoli-animali": {
    name: "Piccoli Animali",
    slug: "piccoli-animali",
    count: 985,
    icon: Rabbit,
    children: {
      roditori: {
        name: "Roditori",
        slug: "roditori",
        count: 394,
        children: {
          accessori: { name: "Accessori", slug: "accessori", count: 156 },
          mangime: { name: "Mangime", slug: "mangime", count: 83 },
          snack: { name: "Snack", slug: "snack", count: 76 },
          fieno: { name: "Fieno", slug: "fieno", count: 41 },
          lettiere: { name: "Lettiere", slug: "lettiere", count: 29 },
        },
      },
      uccelli: {
        name: "Uccelli",
        slug: "uccelli",
        count: 295,
        children: {
          accessori: { name: "Accessori", slug: "accessori", count: 126 },
          mangime: { name: "Mangime", slug: "mangime", count: 124 },
          snack: { name: "Snack", slug: "snack", count: 39 },
        },
      },
      pesci: {
        name: "Pesci",
        slug: "pesci",
        count: 241,
        children: {
          accessori: { name: "Accessori", slug: "accessori", count: 148 },
          mangime: { name: "Mangime", slug: "mangime", count: 93 },
        },
      },
      tartarughe: {
        name: "Tartarughe",
        slug: "tartarughe",
        count: 40,
        children: {
          mangime: { name: "Mangime", slug: "mangime", count: 28 },
        },
      },
      rettili: {
        name: "Rettili",
        slug: "rettili",
        count: 26,
      },
    },
  },
  "persona-e-casa": {
    name: "Persona e Casa",
    slug: "persona-e-casa",
    count: 89,
    icon: Home,
    children: {
      "accessori-casa": {
        name: "Accessori Casa",
        slug: "accessori-casa",
        count: 50,
        children: {
          "sicurezza-e-arredo": { name: "Sicurezza e Arredo", slug: "sicurezza-e-arredo", count: 40 },
        },
      },
      igiene: {
        name: "Igiene",
        slug: "igiene",
        count: 28,
        children: {
          detergenti: { name: "Detergenti", slug: "detergenti", count: 21 },
        },
      },
    },
  },
};

// ============================================================================
// Category Icons (for filters sidebar)
// ============================================================================

/**
 * Maps category names (as they appear in Algolia's hierarchical_categories.lvl0)
 * to Lucide icon components. Used in the HierarchicalCategoryFilter.
 *
 * Keys must match EXACTLY the category names in your Algolia index.
 */
export const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Cane": Dog,
  "Gatto": Cat,
  "Piccoli Animali": Rabbit,
  "Persona e Casa": Home,
};
