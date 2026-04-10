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
  APP_ID: "3FKQCCIUWO",
  SEARCH_API_KEY: "cf3b54fbfea633fb12808c8b2f59b990",

  // Indices
  INDEX_NAME: "fashion_ns",
  ARTICLES_INDEX: "articles",
  QUERY_SUGGESTIONS_INDEX: "fashion_ns_query_suggestions",
  LOCATIONS_INDEX: "locations",

  // Composition
  COMPOSITION_ID: "fashion_ns_composition",

  // Agent Studio configuration
  AGENT_ID: "3db1f581-4e8d-4570-a856-dd46204d360a",
};
