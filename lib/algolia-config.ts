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
  SEARCH_API_KEY:
    "cf3b54fbfea633fb12808c8b2f59b990",

  // Indices
  INDEX_NAME: "dainese_ns",

  // Composition
  COMPOSITION_ID: "dainese_ns_composition",

  // Agent Studio configuration
  AGENT_ID: "81dc2b1f-b5d2-425e-9ecb-ced4adba1c60",
};
