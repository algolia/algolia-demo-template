/**
 * Core demo configuration
 *
 * Edit this file to customize the store for a new demo/customer.
 * See SETUP.md for the full setup checklist.
 */
export const DEMO_CONFIG = {
  brand: {
    name: "Demo Store",
    tagline: "Your one-stop shop",
    logoUrl: "/logo.svg",
    logoWidth: 140,
    logoHeight: 32,
    agentName: "Shopping Assistant",
  },
  locale: {
    language: "en",
    currency: "EUR",
    currencySymbol: "\u20ac",
  },
  imageDomains: [
    { protocol: "https" as const, hostname: "fxqklbpngldowtbkqezm.supabase.co" },
  ],
};
