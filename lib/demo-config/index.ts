/**
 * Core demo configuration
 *
 * Edit this file to customize the store for a new demo/customer.
 * See SETUP.md for the full setup checklist.
 */
export const DEMO_CONFIG = {
  brand: {
    name: "Dainese",
    tagline: "Protection through innovation since 1972",
    logoUrl: "/logo.svg",
    logoWidth: 80,
    logoHeight: 22,
    agentName: "Dainese Gear Advisor",
  },
  locale: {
    language: "en",
    currency: "USD",
    currencySymbol: "$",
  },
  imageDomains: [
    { protocol: "https" as const, hostname: "dainese-cdn.thron.com" },
  ],
};
