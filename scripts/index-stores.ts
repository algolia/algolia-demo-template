/**
 * Index enriched stores from data/stores.json into Algolia.
 * Clears the existing index and replaces with enriched data.
 *
 * Requires ALGOLIA_ADMIN_API_KEY in .env
 *
 * Usage: pnpm tsx scripts/index-stores.ts
 */

import { algoliasearch } from "algoliasearch";
import { readFileSync } from "fs";
import { join } from "path";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";
import "dotenv/config";

async function main() {
  const adminKey = process.env.ALGOLIA_ADMIN_API_KEY;
  if (!adminKey) {
    console.error("ALGOLIA_ADMIN_API_KEY not found in .env");
    process.exit(1);
  }

  const client = algoliasearch(ALGOLIA_CONFIG.APP_ID, adminKey);
  const indexName = ALGOLIA_CONFIG.LOCATIONS_INDEX;

  // Read enriched stores
  const storesPath = join(__dirname, "..", "data", "stores.json");
  const stores = JSON.parse(readFileSync(storesPath, "utf-8"));
  console.log(`Read ${stores.length} stores from data/stores.json`);

  // Clear and replace
  console.log(`Clearing index ${indexName}...`);
  await client.clearObjects({ indexName });

  console.log("Indexing stores...");
  await client.saveObjects({ indexName, objects: stores });

  // Configure index settings
  console.log("Configuring index settings...");
  await client.setSettings({
    indexName,
    indexSettings: {
      searchableAttributes: ["name", "city", "region", "address"],
      attributesForFaceting: ["filterOnly(services)", "searchable(city)", "searchable(region)"],
      attributeForDistinct: "id",
      distinct: 1,
    },
  });

  console.log(`Done! Indexed ${stores.length} stores with services faceting.`);
}

main().catch(console.error);
