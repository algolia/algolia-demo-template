import "dotenv/config";
import { writeFileSync } from "fs";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const ALGOLIA_APP_ID = ALGOLIA_CONFIG.APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;

const INDICES = [
  ALGOLIA_CONFIG.INDEX_NAME,
  ALGOLIA_CONFIG.RECIPES_INDEX,
  ALGOLIA_CONFIG.GUIDES_INDEX,
  ALGOLIA_CONFIG.SUGGESTIONS_INDEX,
];

async function exportIndex(
  client: ReturnType<typeof algoliasearch>,
  indexName: string
) {
  console.log(`\n--- Exporting ${indexName} ---`);

  // Export records
  const records: Record<string, unknown>[] = [];
  await client.browseObjects({
    indexName,
    browseParams: { attributesToHighlight: [], attributesToSnippet: [] },
    aggregator: (res) => {
      for (const hit of res.hits) {
        const { _highlightResult, _snippetResult, _rankingInfo, ...rest } =
          hit as Record<string, unknown>;
        records.push(rest);
      }
    },
  });
  writeFileSync(
    `data/${indexName}.json`,
    JSON.stringify(records, null, 2) + "\n"
  );
  console.log(`  Records: ${records.length} → data/${indexName}.json`);

  // Export settings
  const settings = await client.getSettings({ indexName });
  writeFileSync(
    `data/${indexName}.settings.json`,
    JSON.stringify(settings, null, 2) + "\n"
  );
  console.log(`  Settings → data/${indexName}.settings.json`);

  // Export synonyms
  const synonyms: Record<string, unknown>[] = [];
  await client.browseSynonyms({
    indexName,
    aggregator: (res) => {
      synonyms.push(...(res.hits as Record<string, unknown>[]));
    },
  });
  if (synonyms.length > 0) {
    writeFileSync(
      `data/${indexName}.synonyms.json`,
      JSON.stringify(synonyms, null, 2) + "\n"
    );
    console.log(`  Synonyms: ${synonyms.length} → data/${indexName}.synonyms.json`);
  } else {
    console.log(`  Synonyms: none`);
  }

  // Export rules
  const rules: Record<string, unknown>[] = [];
  await client.browseRules({
    indexName,
    aggregator: (res) => {
      rules.push(...(res.hits as Record<string, unknown>[]));
    },
  });
  if (rules.length > 0) {
    writeFileSync(
      `data/${indexName}.rules.json`,
      JSON.stringify(rules, null, 2) + "\n"
    );
    console.log(`  Rules: ${rules.length} → data/${indexName}.rules.json`);
  } else {
    console.log(`  Rules: none`);
  }
}

async function main() {
  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    console.error("Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY");
    process.exit(1);
  }

  console.log(`Connecting to Algolia (App: ${ALGOLIA_APP_ID})...`);
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

  for (const indexName of INDICES) {
    await exportIndex(client, indexName);
  }

  console.log("\nDone! All indices exported to data/");
}

main().catch(console.error);
