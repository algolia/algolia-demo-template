import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const ALGOLIA_APP_ID = ALGOLIA_CONFIG.APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = ALGOLIA_CONFIG.INDEX_NAME;
const COMPOSITION_ID = ALGOLIA_CONFIG.COMPOSITION_ID || `${INDEX_NAME}_composition`;

function readJsonFile(path: string): unknown[] | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

function readJsonObject(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

async function restoreIndex(
  client: ReturnType<typeof algoliasearch>,
  indexName: string
) {
  const recordsPath = `data/${indexName}.json`;
  const records = readJsonFile(recordsPath);
  if (!records) {
    console.log(`  Skipping ${indexName} — no data file found`);
    return;
  }

  console.log(`\n--- Restoring ${indexName} (${records.length} records) ---`);

  // Index records in batches
  const BATCH_SIZE = 1000;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await client.saveObjects({
      indexName,
      objects: batch as Record<string, unknown>[],
    });
    console.log(
      `  Indexed ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`
    );
  }

  // Restore settings
  const settings = readJsonObject(`data/${indexName}.settings.json`);
  if (settings) {
    await client.setSettings({
      indexName,
      indexSettings: settings,
    });
    console.log(`  Settings restored`);
  }

  // Restore synonyms
  const synonyms = readJsonFile(`data/${indexName}.synonyms.json`);
  if (synonyms && synonyms.length > 0) {
    await client.saveSynonyms({
      indexName,
      synonymHit: synonyms as Parameters<
        typeof client.saveSynonyms
      >[0]["synonymHit"],
      forwardToReplicas: false,
      replaceExistingSynonyms: true,
    });
    console.log(`  Synonyms restored (${synonyms.length})`);
  }

  // Restore rules
  const rules = readJsonFile(`data/${indexName}.rules.json`);
  if (rules && rules.length > 0) {
    await client.saveRules({
      indexName,
      rules: rules as Parameters<typeof client.saveRules>[0]["rules"],
      forwardToReplicas: false,
      clearExistingRules: true,
    });
    console.log(`  Rules restored (${rules.length})`);
  }
}

async function main() {
  const feedPath = process.argv[2] || "data/products.json";
  console.log(`Reading JSON feed from ${feedPath}...`);
  const raw = readFileSync(feedPath, "utf-8");
  const records: Record<string, unknown>[] = JSON.parse(raw);
  console.log(`Loaded ${records.length} products`);

  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    console.error("Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY");
    process.exit(1);
  }

  console.log(`Connecting to Algolia (App: ${ALGOLIA_APP_ID}, Index: ${INDEX_NAME})...`);
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

  // Populate categoryPageId from hierarchicalCategories for category page filtering
  for (const record of records) {
    const hc = record.hierarchicalCategories as
      | Record<string, string[]>
      | undefined;
    if (hc && typeof hc === "object") {
      const paths: string[] = [];
      for (let lvl = 0; lvl <= 3; lvl++) {
        const val = hc[`lvl${lvl}`];
        if (Array.isArray(val)) {
          paths.push(...val.filter((v) => typeof v === "string" && v));
        }
      }
      record.categoryPageId = paths;
    }
  }

  console.log("Indexing products in batches...");
  const BATCH_SIZE = 1000;
  let indexed = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await client.saveObjects({
      indexName: INDEX_NAME,
      objects: batch,
    });
    indexed += batch.length;
    console.log(`Indexed ${indexed}/${records.length} products`);
  }

  // Restore settings from exported settings file (matches actual product schema)
  const productSettings = readJsonObject(`data/${INDEX_NAME}.settings.json`);
  if (productSettings) {
    console.log("Configuring index settings from exported file...");
    await client.setSettings({
      indexName: INDEX_NAME,
      indexSettings: productSettings,
    });
    console.log("  Settings restored");
  } else {
    console.warn("  No settings file found for", INDEX_NAME);
  }

  // Restore synonyms and rules for products index from exported files
  const productSynonyms = readJsonFile(`data/${INDEX_NAME}.synonyms.json`);
  if (productSynonyms && productSynonyms.length > 0) {
    try {
      await client.saveSynonyms({
        indexName: INDEX_NAME,
        synonymHit: productSynonyms as Parameters<
          typeof client.saveSynonyms
        >[0]["synonymHit"],
        forwardToReplicas: false,
        replaceExistingSynonyms: true,
      });
      console.log(`Restored ${productSynonyms.length} synonyms for ${INDEX_NAME}`);
    } catch (e) {
      console.warn(`  Warning: could not restore synonyms for ${INDEX_NAME}:`, (e as Error).message);
    }
  }
  const productRules = readJsonFile(`data/${INDEX_NAME}.rules.json`);
  if (productRules && productRules.length > 0) {
    await client.saveRules({
      indexName: INDEX_NAME,
      rules: productRules as Parameters<typeof client.saveRules>[0]["rules"],
      forwardToReplicas: false,
      clearExistingRules: true,
    });
    console.log(`Restored ${productRules.length} rules for ${INDEX_NAME}`);
  }

  console.log("Done! Indexed", records.length, "products to", INDEX_NAME);

  // Restore secondary indices from exported data
  const secondaryIndices = [
    ALGOLIA_CONFIG.RECIPES_INDEX,
    ALGOLIA_CONFIG.GUIDES_INDEX,
    ALGOLIA_CONFIG.SUGGESTIONS_INDEX,
  ];
  for (const idx of secondaryIndices) {
    await restoreIndex(client, idx);
  }

  // Create or update the composition
  console.log(`Creating/updating composition (${COMPOSITION_ID})...`);
  {
    const compositionResponse = await fetch(
      `https://${ALGOLIA_APP_ID}.algolia.net/1/compositions/${COMPOSITION_ID}`,
      {
        method: "PUT",
        headers: {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": ALGOLIA_ADMIN_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objectID: COMPOSITION_ID,
          name: "Products Composition",
          behavior: {
            injection: {
              main: {
                source: {
                  search: {
                    index: INDEX_NAME,
                    params: {
                      hitsPerPage: 20,
                      facets: ["*"],
                    },
                  },
                },
              },
            },
          },
        }),
      }
    );

    if (!compositionResponse.ok) {
      const error = await compositionResponse.text();
      console.error("Failed to create composition:", error);
    } else {
      const result = await compositionResponse.json();
      console.log("Composition created/updated, taskID:", result.taskID);
    }
  }
}

main().catch(console.error);
