import { Product } from "@/lib/types/product";

/**
 * Extract pricing information from a product record.
 */
export function getPriceInfo(product: Product) {
  const price = product.price?.value ?? 0;
  const discountRate = product.discount_rate ?? 0;
  const hasDiscount = discountRate > 0;
  const originalPrice = hasDiscount ? price / (1 - discountRate / 100) : price;
  const discountPercentage = hasDiscount ? Math.round(discountRate) : 0;

  return { price, originalPrice, hasDiscount, discountPercentage };
}

/**
 * Get the preferred display category for a product.
 * Uses the deepest available hierarchical category level.
 */
export function getPreferredCategory(product: Product): string {
  const cats = product.hierarchical_categories;
  if (!cats) return "";
  return cats.lvl2 || cats.lvl1 || cats.lvl0 || "";
}
