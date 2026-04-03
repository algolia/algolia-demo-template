export interface Product {
  // Identifiers
  objectID: string;
  name: string;
  slug: string;
  sku: string;
  parentID: string;
  description: string;
  brand: string;

  // Status
  isNew: boolean;
  url: string;
  stock: number;

  // Pricing
  price: { value: number };

  // Images
  primary_image: string;
  image_urls: string[];
  image_blurred: string;
  image_description: string;

  // Categories
  hierarchical_categories: {
    lvl0: string;
    lvl1: string;
    lvl2: string;
  };
  // Leaf-only category values for search (e.g., "Snack" instead of "Cane > Snack")
  searchable_categories: {
    lvl0: string;
    lvl1: string;
    lvl2: string;
  };
  list_categories: string[];
  categoryPageId: string[];

  // Pet-specific attributes (Arcaplanet)
  età: { value: string };
  razza: { value: string };
  peso: { value: string };
  taglia: { value: string };
  gusto: { value: string };
  caratteristica: Array<{ value: string }> | { value: string };
  tipo: { value: string };
  formato: Array<{ value: string }> | { value: string };
  conservazione: { value: string };
  consistenza: { value: string };
  funzione: { value: string };

  // Search & Discovery
  keywords: string[];
  semantic_attributes: string;

  // Reviews
  reviews: {
    bayesian_avg: number;
    count: number;
    rating: number;
  };

  // Store availability
  availableInStores: Array<{
    inStock: boolean;
    objectID: string;
  }>;

  // Business metrics
  margin: number;
  discount_rate: number;
  product_aov: number;
  sales_last_24h: number;
  sales_last_7d: number;
  sales_last_30d: number;
  sales_last_90d: number;

  // Synthetic data marker — lists field names that were fabricated for demo purposes
  // (e.g., ["reviews", "sales_last_24h", "margin"])
  _synthetic_fields?: string[];

  // Algolia-specific fields (populated by search response)
  _highlightResult?: Record<string, unknown>;
  _snippetResult?: Record<string, unknown>;
}
