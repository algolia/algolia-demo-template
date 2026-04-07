export const DEMO_CONFIG = {
  brand: {
    name: "HOMYCASA",
    tagline: "O Meu Lar Mora Aqui",
    logoUrl: "/logo.svg",
    logoWidth: 160,
    logoHeight: 40,
    agentName: "HOMYCASA AI",
  },
  locale: {
    language: "pt",
    currency: "EUR",
    currencySymbol: "€",
  },
  imageDomains: [
    { protocol: "https" as const, hostname: "homycasa.vtexassets.com" },
    { protocol: "https" as const, hostname: "assets.decocache.com" },
  ],
};
