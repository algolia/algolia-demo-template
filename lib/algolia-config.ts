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
  INDEX_NAME: "fashion_ns",
  SUGGESTIONS_INDEX: "",
  CATEGORIES_INDEX: "",

  // Composition
  COMPOSITION_ID: "fashion_ns_composition",

  // Agent Studio configuration
  AGENT_API_KEY:  "",
  AGENT_ID:  "",
  SUGGESTION_AGENT_ID:
    "",
  CHECKOUT_AGENT_ID:
    "",
};
