/**
 * Centralized Algolia configuration
 * All Algolia-related settings should be accessed through this config
 */
export const ALGOLIA_CONFIG = {
  APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  SEARCH_API_KEY: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || "",
  INDEX_NAME: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "hsn_products",
  SUGGESTIONS_INDEX: process.env.NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX || "",
  CATEGORIES_INDEX: process.env.NEXT_PUBLIC_ALGOLIA_CATEGORIES_INDEX || "",
  // Default to arcaplanet composition if using that index, otherwise empty
  COMPOSITION_ID: process.env.NEXT_PUBLIC_ALGOLIA_COMPOSITION_ID || "",
  // Agent Studio configuration
  AGENT_API_KEY: process.env.NEXT_PUBLIC_AGENT_API_KEY || "",
  AGENT_ID: process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID || "",
  SUGGESTION_AGENT_ID: process.env.NEXT_PUBLIC_ALGOLIA_SUGGESTION_AGENT_ID || "",
  CHECKOUT_AGENT_ID: process.env.NEXT_PUBLIC_ALGOLIA_CHECKOUT_AGENT_ID || "",
};
