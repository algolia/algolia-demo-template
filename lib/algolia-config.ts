/**
 * Centralized Algolia configuration
 *
 * Non-sensitive values (APP_ID, SEARCH_API_KEY, index names, agent IDs) live
 * here so that Claude Code and other tooling can read them directly.
 * Only truly secret keys (ADMIN_API_KEY) stay in `.env`.
 *
 * Environment variables, when set, override the defaults below.
 */
export const ALGOLIA_CONFIG = {
  // Core — safe to expose (search-only key, no write access)
  APP_ID: "CCZC5HO11D",
  SEARCH_API_KEY: "2e8125c61e9831b9f59819d64d728542",

  // Indices
  INDEX_NAME: "arcaplanet_products",
  QUERY_SUGGESTIONS_INDEX: "arcaplanet_products_query_suggestions",
  LOCATIONS_INDEX: "arcaplanet_locations",

  // Composition
  COMPOSITION_ID: "arcaplanet_products_composition",

  // Agent Studio configuration
  AGENT_ID: "7214dfd6-b09c-4a1f-a6a5-4213e03c06cc",
};
