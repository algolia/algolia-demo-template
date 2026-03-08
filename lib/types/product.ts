export interface Product {
  // Identifiers
  objectID: string;
  name: string;
  slug: string;
  sku: string;
  parentID: string;
  description: string;
  brand: string;
  gender: string;

  // Status
  isNew: boolean;
  url: string;
  stock: number;

  // Pricing
  price: { value: number };
  color: { filter_group: string; original_name: string };

  // Images
  primary_image: string;
  image_urls: string[];
  image_blurred: string;
  image_description: string;

  // Sizes
  available_sizes: string[];

  // Categories
  hierarchical_categories: {
    lvl0: string;
    lvl1: string;
    lvl2: string;
  };
  list_categories: string[];
  categoryPageId: string[];

  // Variants
  variants: Array<{
    color: { filter_group: string; original_name: string };
    image_urls: string[];
    objectID: string;
    price: { value: number };
  }>;

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

  // Product attributes (category-specific key/value pairs)
  attrs?: Record<string, string>;

  // Algolia-specific fields (populated by search response)
  _highlightResult?: Record<string, unknown>;
  _snippetResult?: Record<string, unknown>;
}
