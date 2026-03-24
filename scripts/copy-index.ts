import "dotenv/config";
import { algoliasearch } from "algoliasearch";

const SOURCE_APP_ID = "CCZC5HO11D";
const SOURCE_API_KEY = "151a6582bffc4aa11bc898b2f61e6d4d";

const TARGET_APP_ID = "3FKQCCIUWO";
const TARGET_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;

if (!TARGET_ADMIN_KEY) {
  console.error("Missing ALGOLIA_ADMIN_API_KEY in .env");
  process.exit(1);
}

const INDEX_PAIRS: [string, string][] = [
  ["consum_products", "new_consum_products"],
  ["consum_recipes", "new_consum_recipes"],
  ["consum_guides", "new_consum_guides"],
  ["consum_products_query_suggestions", "new_consum_products_query_suggestions"],
];

const sourceClient = algoliasearch(SOURCE_APP_ID, SOURCE_API_KEY);
const targetClient = algoliasearch(TARGET_APP_ID, TARGET_ADMIN_KEY);

async function copyIndex(sourceIndex: string, targetIndex: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Copying ${sourceIndex} -> ${targetIndex}`);

  // 1. Browse and copy all objects first (creates the index)
  console.log("  Browsing objects...");
  const allObjects: Record<string, unknown>[] = [];

  await sourceClient.browseObjects({
    indexName: sourceIndex,
    browseParams: { hitsPerPage: 1000 },
    aggregator: (response) => {
      for (const hit of response.hits) {
        const obj = { ...hit } as Record<string, unknown>;
        delete obj._highlightResult;
        delete obj._snippetResult;
        delete obj._rankingInfo;
        allObjects.push(obj);
      }
    },
  });

  console.log(`  Found ${allObjects.length} objects`);

  // Populate categoryPageId for product records
  if (sourceIndex === "consum_products") {
    console.log("  Populating categoryPageId...");
    for (const record of allObjects) {
      const hc = record.hierarchicalCategories as Record<string, string> | undefined;
      if (hc && typeof hc === "object") {
        const paths: string[] = [];
        for (let lvl = 0; lvl <= 3; lvl++) {
          const val = hc[`lvl${lvl}`];
          if (typeof val === "string" && val) paths.push(val);
        }
        record.categoryPageId = paths;
      }
    }
  }

  // Save in batches of 1000
  const BATCH_SIZE = 1000;
  for (let i = 0; i < allObjects.length; i += BATCH_SIZE) {
    const batch = allObjects.slice(i, i + BATCH_SIZE);
    await targetClient.saveObjects({
      indexName: targetIndex,
      objects: batch,
    });
    console.log(`  Indexed ${Math.min(i + BATCH_SIZE, allObjects.length)}/${allObjects.length}`);
  }

  // Wait for indexing to complete before applying settings
  await targetClient.waitForTask({ indexName: targetIndex, taskID: 0 }).catch(() => {});

  // 2. Copy settings (after index exists) - strip Neural/semantic settings
  console.log("  Copying settings...");
  const settings = await sourceClient.getSettings({ indexName: sourceIndex });
  const settingsObj = settings as Record<string, unknown>;
  // Remove settings that require Neural Search or may not transfer
  delete settingsObj.semanticSearch;
  delete settingsObj.mode;
  await targetClient.setSettings({
    indexName: targetIndex,
    indexSettings: settings,
  });

  // 3. Copy synonyms
  console.log("  Copying synonyms...");
  const allSynonyms: Record<string, unknown>[] = [];
  await sourceClient.browseSynonyms({
    indexName: sourceIndex,
    aggregator: (response) => {
      for (const synonym of response.hits) {
        const s = { ...synonym } as Record<string, unknown>;
        delete s._highlightResult;
        allSynonyms.push(s);
      }
    },
  });

  if (allSynonyms.length > 0) {
    await targetClient.saveSynonyms({
      indexName: targetIndex,
      synonymHit: allSynonyms as any,
      forwardToReplicas: false,
      replaceExistingSynonyms: true,
    });
    console.log(`  Copied ${allSynonyms.length} synonyms`);
  } else {
    console.log("  No synonyms found");
  }

  // 4. Copy rules
  console.log("  Copying rules...");
  const allRules: Record<string, unknown>[] = [];
  await sourceClient.browseRules({
    indexName: sourceIndex,
    aggregator: (response) => {
      for (const rule of response.hits) {
        const r = { ...rule } as Record<string, unknown>;
        delete r._highlightResult;
        allRules.push(r);
      }
    },
  });

  if (allRules.length > 0) {
    await targetClient.saveRules({
      indexName: targetIndex,
      rules: allRules as any,
      forwardToReplicas: false,
      clearExistingRules: true,
    });
    console.log(`  Copied ${allRules.length} rules`);
  } else {
    console.log("  No rules found");
  }

  console.log(`  Done! ${allObjects.length} records copied to ${targetIndex}`);
  return allObjects.length;
}

async function main() {
  console.log(`Source: ${SOURCE_APP_ID}`);
  console.log(`Target: ${TARGET_APP_ID}`);

  const results: Record<string, number> = {};

  for (const [source, target] of INDEX_PAIRS) {
    results[target] = await copyIndex(source, target);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("All indices copied!");
  for (const [index, count] of Object.entries(results)) {
    console.log(`  ${index}: ${count} records`);
  }
}

main().catch((error) => {
  console.error("Error copying indices:", error);
  process.exit(1);
});
