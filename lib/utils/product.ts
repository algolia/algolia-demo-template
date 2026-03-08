import { Product } from "@/lib/types/product";

export function getPriceInfo(product: Product) {
  const price = product.price?.value || 0;
  const discountRate = product.discount_rate || 0;
  const hasDiscount = discountRate >= 5 && price > 0;
  const originalPrice = hasDiscount ? price / (1 - discountRate / 100) : 0;
  const discountPercentage = hasDiscount ? Math.round(discountRate) : 0;
  return { price, originalPrice, hasDiscount, discountPercentage };
}

export function getPreferredCategory(product: Product): string | undefined {
  return (
    product.hierarchical_categories?.lvl1 ||
    product.hierarchical_categories?.lvl0 ||
    product.list_categories?.[0]
  );
}
