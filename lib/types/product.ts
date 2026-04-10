export interface Product {
  objectID: string;
  name: string;
  slug: string;
  sku: string;
  parentID?: string;
  description: string;
  brand: string;

  // Status
  isNew?: boolean;
  url?: string;
  stock?: number;

  // Pricing
  price: { value: number };
  discount_rate?: number;

  // Images
  primary_image: string;
  image_urls?: string[];

  // Categories
  hierarchical_categories: {
    lvl0?: string;
    lvl1?: string;
    lvl2?: string;
    lvl3?: string;
  };
  list_categories?: string[];
  searchable_categories?: Record<string, string>;
  categoryPageId?: string[];

  // Search enrichment
  keywords?: string;
  semantic_attributes?: string;

  // Reviews
  reviews?: {
    bayesian_avg: number;
    count: number;
    rating: number;
  };

  // Business metrics
  sales_last_24h?: number;
  sales_last_7d?: number;
  sales_last_30d?: number;
  sales_last_90d?: number;
  margin?: number;
  product_aov?: number;

  // Store availability (for click & collect)
  availableInStores?: Array<{
    objectID: string;
    inStock: boolean;
  }>;

  // Synthetic marker
  _synthetic_fields?: string[];

  // Algolia search response fields
  _highlightResult?: Record<string, unknown>;
  _snippetResult?: Record<string, unknown>;
  _rankingInfo?: Record<string, unknown>;

  // Allow demo-specific extra fields
  [key: string]: unknown;
}
