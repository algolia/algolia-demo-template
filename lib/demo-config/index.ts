/**
 * Core demo configuration
 *
 * Edit this file to customize the store for a new demo/customer.
 * See SETUP.md for the full setup checklist.
 */
export const DEMO_CONFIG = {
  brand: {
    name: "Arcaplanet",
    tagline: "Il tuo negozio di fiducia per animali",
    logoUrl: "/logo.svg",
    logoWidth: 160,
    logoHeight: 40,
    agentName: "Arcaplanet AI",
  },
  locale: {
    language: "it",
    currency: "EUR",
    currencySymbol: "€",
  },
  imageDomains: [
    { protocol: "https" as const, hostname: "arcaplanet.vteximg.com.br" },
    { protocol: "http" as const, hostname: "arcaplanet.vteximg.com.br" },
    { protocol: "https" as const, hostname: "arcaplanet.vtexassets.com" },
  ],
};
