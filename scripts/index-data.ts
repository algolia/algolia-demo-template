import "dotenv/config";
import { readFileSync } from "fs";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const ALGOLIA_APP_ID = ALGOLIA_CONFIG.APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = ALGOLIA_CONFIG.INDEX_NAME;
const COMPOSITION_ID = ALGOLIA_CONFIG.COMPOSITION_ID || `${INDEX_NAME}_composition`;

/**
 * Transform: reshape raw source data to match the Product interface.
 * Field mappings, restructuring, and synthetic data generation go here.
 * Populated by /demo-data-indexing skill per demo.
 */
function transformRecords(
  records: Record<string, unknown>[]
): Record<string, unknown>[] {
  // Identity transform — replace with field mappings per demo
  // Example:
  //   return records.map((r) => ({
  //     ...r,
  //     name: r.title,
  //     primary_image: r.image,
  //     price: { value: Number(r.price) },
  //   }));
  return records;
}

/**
 * Enrich: add computed or AI-generated fields.
 * Enriched fields use the _enriched namespace, then get promoted
 * to top-level record fields for indexing.
 * Can use OpenAI structured outputs, other APIs, scraping, etc.
 * Populated by /demo-data-indexing skill per demo.
 *
 * @see https://developers.openai.com/api/docs/guides/structured-outputs
 */
async function enrichRecords(
  records: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  // No-op — replace with enrichment logic per demo
  // Example with OpenAI structured outputs:
  //   import OpenAI from "openai";
  //   import { zodResponseFormat } from "openai/helpers/zod";
  //   const EnrichedFields = z.object({
  //     keywords: z.array(z.string()),
  //     semantic_attributes: z.string(),
  //   });
  //   for (const record of records) {
  //     const result = await openai.beta.chat.completions.parse({ ... });
  //     record._enriched = result.choices[0].message.parsed;
  //     Object.assign(record, record._enriched);
  //   }
  return records;
}

async function main() {
  const feedPath = process.argv[2] || "data/products.json";
  console.log(`Reading JSON feed from ${feedPath}...`);
  const raw = readFileSync(feedPath, "utf-8");
  const records: Record<string, unknown>[] = JSON.parse(raw);
  console.log(`Loaded ${records.length} products`);

  // Transform raw records to match Product interface
  console.log("Transforming records...");
  const transformed = transformRecords(records);
  console.log(`Transformed ${transformed.length} records`);

  // Enrich records with computed/AI-generated fields
  console.log("Enriching records...");
  const enriched = await enrichRecords(transformed);
  console.log(`Enriched ${enriched.length} records`);

  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    console.error("Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY");
    process.exit(1);
  }

  console.log(`Connecting to Algolia (App: ${ALGOLIA_APP_ID}, Index: ${INDEX_NAME})...`);
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

  // Populate categoryPageId and searchable_categories from hierarchical_categories
  for (const record of enriched) {
    const hc = record.hierarchical_categories as
      | Record<string, string>
      | undefined;
    if (hc && typeof hc === "object") {
      const paths: string[] = [];
      const searchable: Record<string, string> = {};
      for (let lvl = 0; lvl <= 3; lvl++) {
        const val = hc[`lvl${lvl}`];
        if (typeof val === "string" && val) {
          paths.push(val);
          // Extract leaf segment: "Helmets > Jet Helmets" -> "Jet Helmets"
          const parts = val.split(" > ");
          searchable[`lvl${lvl}`] = parts[parts.length - 1];
        }
      }
      record.categoryPageId = paths;
      // Leaf-only category values for searchable attributes (short, precise for tie-breaking)
      record.searchable_categories = searchable;
    }
  }

  console.log("Indexing products in batches...");
  const BATCH_SIZE = 1000;
  let indexed = 0;

  for (let i = 0; i < enriched.length; i += BATCH_SIZE) {
    const batch = enriched.slice(i, i + BATCH_SIZE);
    await client.saveObjects({
      indexName: INDEX_NAME,
      objects: batch,
    });
    indexed += batch.length;
    console.log(`Indexed ${indexed}/${enriched.length} products`);
  }

  console.log("Configuring index settings...");
  await client.setSettings({
    indexName: INDEX_NAME,
    indexSettings: {
      // Searchable attributes — ORDER MATTERS for relevance (tie-breaking).
      // Higher = breaks ties first. Short, precise attributes go higher; long noisy text goes lower.
      // Attributes at the same level use comma separation (equal priority).
      // See: https://www.algolia.com/doc/guides/managing-results/must-do/searchable-attributes/how-to/configuring-searchable-attributes-the-right-way/
      searchableAttributes: [
        // P1: Short, precise text — brand/category matches are unambiguous
        "unordered(brand)",
        "unordered(searchable_categories.lvl0), unordered(searchable_categories.lvl1), unordered(searchable_categories.lvl2)",
        "unordered(colour)",
        // P2: Product name — ordered so matches at the start rank higher
        "name",
        // P3: Exact lookups
        "unordered(sku), unordered(objectID)",
        // P4: Enriched search terms
        "unordered(keywords)",
        // P5: Long text — catches long-tail but noisy, lowest priority
        "unordered(description)",
      ],
      attributesForFaceting: [
        "searchable(brand)",
        "searchable(colour)",
        "hierarchical_categories.lvl0",
        "hierarchical_categories.lvl1",
        "hierarchical_categories.lvl2",
        "searchable(list_categories)",
        "searchable(categoryPageId)",
        "filterOnly(price.value)",
      ],
      customRanking: ["desc(sales_last_24h)"],
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
        "searchable_categories",
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
        "_synthetic_fields",
      ],
      attributesToHighlight: ["name", "brand", "description"],
      attributesToSnippet: ["description:50"],
    },
  });

  console.log("Done! Indexed", enriched.length, "products to", INDEX_NAME);

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
