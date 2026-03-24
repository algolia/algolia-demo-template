/**
 * Setup Algolia Query Suggestions (no analytics events required)
 *
 * This script configures Query Suggestions to generate suggestions purely from
 * index data — no user click or conversion events are needed. Suggestions are
 * derived by mining popular facet values and combinations from the source index,
 * then matching them against record attributes.
 *
 * How it works without events:
 *   1. Algolia scans the source index for attribute values defined in `generate`.
 *   2. Each unique facet value (or combination) becomes a suggestion candidate.
 *      - Single facets: brand, category (lvl0 & lvl1), gender, color
 *      - Combinations: brand+category, brand+gender, gender+category
 *      Combinations produce compound suggestions like "Nike Shoes" or "Women's Clothing".
 *   3. Candidates are filtered by `minHits` (minimum matching records) and
 *      `minLetters` (minimum query length) to keep suggestions relevant.
 *   4. The resulting suggestions are written to a dedicated `_query_suggestions`
 *      index that can be queried by autocomplete / search-as-you-type UIs.
 *
 * Because this approach relies solely on index content, it works immediately
 * for new demos or apps that have no search traffic yet.
 *
 * Usage:
 *   pnpm tsx scripts/setup-query-suggestions.ts
 *
 * Prerequisites:
 *   - ALGOLIA_ADMIN_API_KEY set in .env
 *   - Source index already populated with product data
 */
import "dotenv/config";
import { querySuggestionsClient } from "@algolia/client-query-suggestions";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const SUGGESTIONS_INDEX = `${ALGOLIA_CONFIG.INDEX_NAME}_query_suggestions`;

const FACETS: string[][] = [
  ["brand"],
  ["hierarchicalCategories.lvl0"],
  ["hierarchicalCategories.lvl1"],
  ["categories.lvl0"],
  ["categories.lvl1"],
  ["brand", "categories.lvl0"],
];

const CONFIGURATION = {
  sourceIndices: [
    {
      indexName: ALGOLIA_CONFIG.INDEX_NAME,
      minHits: 5,
      minLetters: 4,
      generate: FACETS,
    },
  ],
  languages: ["es"],
};

async function main() {
  const adminKey = process.env.ALGOLIA_ADMIN_API_KEY;
  if (!adminKey) {
    console.error("Missing ALGOLIA_ADMIN_API_KEY in .env");
    process.exit(1);
  }

  const client = querySuggestionsClient(ALGOLIA_CONFIG.APP_ID, adminKey, "eu");

  const configExists = (await client.getAllConfigs()).some(
    (config) => config.indexName === SUGGESTIONS_INDEX
  );

  if (configExists) {
    console.log(`Updating Query Suggestions config for ${SUGGESTIONS_INDEX}...`);
    await client.updateConfig({
      indexName: SUGGESTIONS_INDEX,
      configuration: CONFIGURATION,
    });
  } else {
    console.log(`Creating Query Suggestions config for ${SUGGESTIONS_INDEX}...`);
    await client.createConfig({
      indexName: SUGGESTIONS_INDEX,
      ...CONFIGURATION,
    });
  }

  const source = CONFIGURATION.sourceIndices[0];
  const singles = FACETS.filter((f) => f.length === 1).map((f) => f[0]);
  const combos = FACETS.filter((f) => f.length > 1).map((f) => f.join(" + "));

  console.log(`Done! Configuration ${configExists ? "updated" : "created"}.`);
  console.log(`  Source index: ${source.indexName}`);
  console.log(`  Min hits: ${source.minHits} | Min letters: ${source.minLetters}`);
  console.log(`  Single facets: ${singles.join(", ")}`);
  console.log(`  Combinations: ${combos.join(", ")}`);
  console.log("\nThe suggestions index will rebuild automatically.");
}

main().catch((error) => {
  console.error("Error setting up Query Suggestions:", error);
  process.exit(1);
});
