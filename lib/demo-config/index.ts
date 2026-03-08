/**
 * Core demo configuration
 *
 * Edit this file to customize the store for a new demo/customer.
 * See SETUP.md for the full setup checklist.
 */
export const DEMO_CONFIG = {
  brand: {
    name: "Sofa So Good",
    tagline: "Furnishings you'll love to live with",
    logoUrl: "/logo.svg",
    logoWidth: 120,
    logoHeight: 40,
    agentName: "Sofa So Good AI",
  },
  locale: {
    language: "en",
    currency: "USD",
    currencySymbol: "$",
  },
  imageDomains: [
    { protocol: "https" as const, hostname: "fxqklbpngldowtbkqezm.supabase.co" },
  ],
};
