import { DEMO_CONFIG } from "@/lib/demo-config";

/**
 * Format a number as a price string using the demo's currency symbol.
 */
export function formatPrice(value: number): string {
  return `${DEMO_CONFIG.locale.currencySymbol}${value.toFixed(2)}`;
}
