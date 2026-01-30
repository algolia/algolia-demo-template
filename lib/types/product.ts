export interface Product {
  // Identifiers
  objectID: string;
  id: string;
  sku: string;

  // Basic product information
  title: string;
  titleEn: string;
  brand: string;
  description: string;
  shortDescription: string;
  url: string;
  imageUrl: string;

  // Stock and availability
  stock: number;
  inStock: boolean;

  // Product classification
  productType: string;
  visibility: string;
  status: string;
  format: string;

  // Product attributes
  characteristics: string[];
  ingredients: string[];

  // Reviews and ratings
  reviewCount: number;
  quantity: number;
  rating: number;

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

  // Pricing
  currency: string;
  price: number;
  normalPrice: number;
  discount: number;
  discountPercentage: number;

  // Multi-currency pricing
  prices: {
    EUR: { price: number; normalPrice: number };
    CHF: { price: number; normalPrice: number };
    PLN: { price: number; normalPrice: number };
    RON: { price: number; normalPrice: number };
    SEK: { price: number; normalPrice: number };
  };

  // Product relationships
  isParent: boolean;
  associatedId: string;

  // Algolia-specific fields (populated by search response)
  _highlightResult?: Record<string, unknown>;
  _snippetResult?: Record<string, unknown>;
}
