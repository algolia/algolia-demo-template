export interface Product {
  // Identifiers
  objectID: string;
  id: string;
  clientId: string;
  ean: string;

  // Basic product information
  title: string;
  brand: string;
  description: string;
  url: string;
  imageUrl: string;

  // Stock and availability
  inStock: boolean;

  // Categories (flat structure)
  categories: {
    lvl0: string[];
    lvl1: string[];
    lvl2: string[];
    lvl3: string[];
  };

  // Hierarchical categories (for Algolia hierarchical faceting)
  hierarchicalCategories: {
    lvl0: string[];
    lvl1: string[];
    lvl2: string[];
    lvl3: string[];
  };

  // Category page filtering
  categoryPageId: string[];

  // Pricing
  price: number;
  normalPrice: number;
  discount: number;
  discountPercentage: number;
  priceUnit: number;
  priceOfferUnit: number;
  unit: string;

  // Offers and promotions
  offer: boolean;
  groups: string[];
  promotions: string[];
  highlighted: boolean;

  // AI-enriched data
  enriched?: {
    description: string;
    keywords: string[];
    dietaryTags: string[];
    useCases: string[];
  };

  // Algolia-specific fields (populated by search response)
  _highlightResult?: Record<string, unknown>;
  _snippetResult?: Record<string, unknown>;
}
