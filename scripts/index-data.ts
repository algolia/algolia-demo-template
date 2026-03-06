import "dotenv/config";
import { readFileSync } from "fs";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const ALGOLIA_APP_ID = ALGOLIA_CONFIG.APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = ALGOLIA_CONFIG.INDEX_NAME;
const COMPOSITION_ID = ALGOLIA_CONFIG.COMPOSITION_ID || `${INDEX_NAME}_composition`;

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

  console.log("Configuring index settings...");
  await client.setSettings({
    indexName: INDEX_NAME,
    indexSettings: {
      searchableAttributes: [
        "name",
        "brand",
        "description",
        "keywords",
        "list_categories",
        "sku",
        "color.original_name",
        "semantic_attributes",
      ],
      attributesForFaceting: [
        "searchable(brand)",
        "searchable(gender)",
        "searchable(color.filter_group)",
        "searchable(available_sizes)",
        "hierarchical_categories.lvl0",
        "hierarchical_categories.lvl1",
        "hierarchical_categories.lvl2",
        "searchable(list_categories)",
        "filterOnly(price.value)",
        "filterOnly(reviews.rating)",
      ],
      customRanking: ["desc(reviews.bayesian_avg)", "desc(sales_last_24h)"],
      ranking: [
        "typo",
        "geo",
        "words",
        "filters",
        "attribute",
        "proximity",
        "exact",
        "custom",
      ],
      ignorePlurals: ["en"],
      indexLanguages: ["en"],
      queryLanguages: ["en"],
      removeStopWords: ["en"],
      removeWordsIfNoResults: "allOptional",
      attributesToRetrieve: [
        "objectID",
        "name",
        "slug",
        "sku",
        "parentID",
        "description",
        "brand",
        "gender",
        "isNew",
        "url",
        "stock",
        "price",
        "color",
        "primary_image",
        "image_urls",
        "image_blurred",
        "image_description",
        "available_sizes",
        "hierarchical_categories",
        "list_categories",
        "categoryPageId",
        "variants",
        "keywords",
        "semantic_attributes",
        "reviews",
        "availableInStores",
        "margin",
        "discount_rate",
        "product_aov",
        "sales_last_24h",
        "sales_last_7d",
        "sales_last_30d",
        "sales_last_90d",
      ],
      attributesToHighlight: ["name", "brand", "description"],
      attributesToSnippet: ["description:50"],
    },
  });

  console.log("Done! Indexed", records.length, "products to", INDEX_NAME);

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
