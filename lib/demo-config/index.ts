export const DEMO_CONFIG = {
  brand: {
    name: "Ideal Bathrooms",
    tagline: "Transform your bathroom into a sanctuary",
    logoUrl: "/logo.png",
    logoWidth: 200,
    logoHeight: 50,
    agentName: "Ideal Bathrooms AI",
  },
  locale: {
    language: "en",
    currency: "GBP",
    currencySymbol: "£",
  },
  imageDomains: [
    { protocol: "https" as const, hostname: "www.idealbathrooms.com" },
    { protocol: "https" as const, hostname: "media.idealbathrooms.com" },
    { protocol: "https" as const, hostname: "images.ctfassets.net" },
    { protocol: "https" as const, hostname: "cdn.idealbathrooms.com" },
  ],
};
