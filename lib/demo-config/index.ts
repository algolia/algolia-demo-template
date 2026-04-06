/**
 * Core demo configuration
 *
 * Edit this file to customize the store for a new demo/customer.
 * See SETUP.md for the full setup checklist.
 */
export const DEMO_CONFIG = {
  brand: {
    name: "Gymshark",
    tagline: "Lifting Your Limits",
    logoUrl: "/logo.png",
    logoWidth: 120,
    logoHeight: 40,
    agentName: "Gymshark AI",
  },
  locale: {
    language: "en",
    currency: "USD",
    currencySymbol: "$",
  },
  imageDomains: [
    { protocol: "https" as const, hostname: "cdn.shopify.com" },
  ],
};
