/**
 * Core demo configuration
 *
 * Edit this file to customize the store for a new demo/customer.
 * See SETUP.md for the full setup checklist.
 */
export const DEMO_CONFIG = {
  brand: {
    name: "Generalitat de Catalunya",
    tagline: "Cercador de continguts i serveis",
    logoUrl: "/logo.svg",
    logoWidth: 186,
    logoHeight: 50,
    agentName: "Assistent GenCat",
  },
  locale: {
    language: "ca",
    currency: "EUR",
    currencySymbol: "€",
  },
  imageDomains: [] as { protocol: "https"; hostname: string }[],
};
