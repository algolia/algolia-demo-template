import { DEMO_CONFIG } from "@/lib/demo-config";

/**
 * Format a price value using the configured locale currency.
 *
 * @param price - Numeric price value
 * @returns Formatted price string (e.g., "$29.99", "EUR29.99")
 */
export function formatPrice(price: number): string {
  return `${DEMO_CONFIG.locale.currencySymbol}${price.toFixed(2)}`;
}
