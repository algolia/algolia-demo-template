import { Product } from "@/lib/types/product";

export function getPriceInfo(product: Product) {
  const price = product.price || 0;
  const originalPrice = product.normalPrice || 0;
  const hasDiscount = originalPrice > price && price > 0;
  const discountPercentage = hasDiscount
    ? product.discountPercentage ||
      Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  return { price, originalPrice, hasDiscount, discountPercentage };
}

export function getPreferredCategory(product: Product): string | undefined {
  return (
    product.hierarchicalCategories?.lvl1?.[0] ||
    product.hierarchicalCategories?.lvl0?.[0] ||
    product.categories?.lvl0?.[0]
  );
}
