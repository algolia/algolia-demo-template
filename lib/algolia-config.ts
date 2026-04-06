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
  INDEX_NAME: "gymshark2_ecommerce",

  // Composition
  COMPOSITION_ID: "gymshark2_ecommerce_composition",

  // Agent Studio configuration
  AGENT_ID: "71a1ba6f-3907-4bb8-b515-72773e586ca2",
};
