import "dotenv/config";
import { querySuggestionsClient } from "@algolia/client-query-suggestions";

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const SOURCE_INDEX = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "";
const SUGGESTIONS_INDEX = `${SOURCE_INDEX}_query_suggestions`;

async function main() {
  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    console.error("Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY");
    process.exit(1);
  }

  console.log(`Setting up Query Suggestions for ${SOURCE_INDEX}...`);
  console.log(`Suggestions index will be: ${SUGGESTIONS_INDEX}`);

  const client = querySuggestionsClient(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY, "eu");

  try {
    // Check if config already exists
    const existingConfigs = await client.getAllConfigs();
    const existingConfig = existingConfigs.find(
      (config) => config.indexName === SUGGESTIONS_INDEX
    );

    if (existingConfig) {
      console.log("Configuration already exists. Updating...");
      await client.updateConfig({
        indexName: SUGGESTIONS_INDEX,
        configuration: {
          sourceIndices: [
            {
              indexName: SOURCE_INDEX,
              minHits: 5,
              minLetters: 4,
              generate: [["brand"], ["categories.lvl0"]],
            },
          ],
          languages: ["en"],
        },
      });
      console.log("Configuration updated successfully!");
    } else {
      console.log("Creating new configuration...");
      await client.createConfig({
        indexName: SUGGESTIONS_INDEX,
        sourceIndices: [
          {
            indexName: SOURCE_INDEX,
            minHits: 5,
            minLetters: 4,
            generate: [["brand"], ["categories.lvl0"]],
          },
        ],
        languages: ["en"],
      });
      console.log("Configuration created successfully!");
    }

    console.log("\nQuery Suggestions configuration:");
    console.log(`  - Index name: ${SUGGESTIONS_INDEX}`);
    console.log(`  - Source index: ${SOURCE_INDEX}`);
    console.log("  - Min hits: 5");
    console.log("  - Min letters: 4");
    console.log("  - Facets: brand, categories.lvl0");
    console.log("\nThe suggestions index will be built automatically.");
    console.log("Check the Algolia dashboard to monitor progress.");
  } catch (error) {
    console.error("Error setting up Query Suggestions:", error);
    process.exit(1);
  }
}

main();
