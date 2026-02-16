/**
 * Core demo configuration
 *
 * Edit this file to customize the store for a new demo/customer.
 * See SETUP.md for the full setup checklist.
 */
export const DEMO_CONFIG = {
  brand: {
    name: "Acme Store",
    tagline: "Your trusted online store",
    logoUrl: "/logo.svg",
    logoWidth: 120,
    logoHeight: 40,
    agentName: "Acme AI",
  },
  locale: {
    language: "en",
    currency: "USD",
    currencySymbol: "$",
  },
  imageDomains: [
    // Add your product image CDN domains here:
    // { protocol: "https" as const, hostname: "cdn.example.com" },
  ],
};
