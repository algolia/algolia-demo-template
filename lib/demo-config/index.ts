export const DEMO_CONFIG = {
  brand: {
    name: "Consum",
    tagline: "Tu cooperativa de confianza",
    logoUrl: "https://www.consum.es/themes/custom/consum_es/assets/img/logo_en.png",
    logoWidth: 120,
    logoHeight: 40,
    agentName: "Consum AI",
  },
  locale: {
    language: "es",
    currency: "EUR",
    currencySymbol: "\u20ac",
  },
  imageDomains: [
    { protocol: "https" as const, hostname: "cdn-consum.aktiosdigitalservices.com" },
    { protocol: "https" as const, hostname: "www.consum.es" },
    { protocol: "https" as const, hostname: "images.template.net" },
  ],
};
