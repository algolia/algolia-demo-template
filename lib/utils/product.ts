import { Product } from "@/lib/types/product";

export function getPriceInfo(product: Product) {
  const price = product.price || 0;
  const normalPrice = product.normalPrice || 0;
  const hasDiscount = product.offer && normalPrice > price && price > 0;
  const originalPrice = hasDiscount ? normalPrice : 0;
  const discountPercentage = hasDiscount ? Math.round(product.discountPercentage || ((normalPrice - price) / normalPrice) * 100) : 0;
  return { price, originalPrice, hasDiscount, discountPercentage };
}

export function getPreferredCategory(product: Product): string | undefined {
  return (
    product.hierarchicalCategories?.lvl1?.[0] ||
    product.hierarchicalCategories?.lvl0?.[0] ||
    product.categories?.lvl0?.[0]
  );
}
