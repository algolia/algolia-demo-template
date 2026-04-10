import { DEMO_CONFIG } from "@/lib/demo-config";

/**
 * Format a number as a price string using the demo's currency symbol.
 */
export function formatPrice(value: number): string {
  return `${DEMO_CONFIG.locale.currencySymbol}${value.toFixed(2)}`;
}

/**
 * Format a Unix timestamp to a human-readable date string.
 */
export function formatDate(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
