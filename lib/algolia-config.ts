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
  INDEX_NAME: "gencat_pages",

  // Composition
  COMPOSITION_ID: "gencat_pages_composition",

  // Agent Studio configuration
  AGENT_ID:  "3db1f581-4e8d-4570-a856-dd46204d360a",
  SUMMARY_AGENT_ID: "00c699a7-59d3-4f13-ba07-73fd6c7f79b2",
};
