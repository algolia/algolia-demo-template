/**
 * Core demo configuration
 *
 * Edit this file to customize the store for a new demo/customer.
 * See SETUP.md for the full setup checklist.
 */
export const DEMO_CONFIG = {
  brand: {
    name: "Gymshark",
    tagline: "Fit for greatness",
    logoUrl: "/logo.png",
    logoWidth: 184,
    logoHeight: 40,
    agentName: "Gymshark AI",
  },
  locale: {
    language: "en",
    currency: "GBP",
    currencySymbol: "£",
  },
  imageDomains: [
    { protocol: "https" as const, hostname: "cdn.gymshark.com" },
  ],
};
