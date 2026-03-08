import "dotenv/config";
import { readFileSync } from "fs";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const ALGOLIA_APP_ID = ALGOLIA_CONFIG.APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = ALGOLIA_CONFIG.INDEX_NAME;
const COMPOSITION_ID = ALGOLIA_CONFIG.COMPOSITION_ID || `${INDEX_NAME}_composition`;

const IMAGE_BASE_URL =
  "https://fxqklbpngldowtbkqezm.supabase.co/storage/v1/object/public/product-images";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Transform a source record into the schema expected by the frontend.
 *
 * Source fields (furnishings_ns_prod) differ from the app's Product type:
 *   - hierarchicalCategories.level0/1/2 -> hierarchical_categories.lvl0/1/2
 *   - image (filename)                  -> primary_image (full URL)
 *   - price (number)                    -> price.value
 *   - rating / ratingsCount             -> reviews.rating / reviews.count
 *   - bayesianPopularity                -> reviews.bayesian_avg
 *   - category                          -> list_categories
 *   - sales                             -> sales_last_24h (+ derived)
 *   - bullets                           -> keywords
 */
function transformRecord(src: Record<string, unknown>): Record<string, unknown> {
  // Hierarchical categories: level0 -> lvl0
  const hcSrc = src.hierarchicalCategories as Record<string, string> | undefined;
  const hierarchical_categories: Record<string, string> = {};
  if (hcSrc) {
    if (hcSrc.level0) hierarchical_categories.lvl0 = hcSrc.level0;
    if (hcSrc.level1) hierarchical_categories.lvl1 = hcSrc.level1;
    if (hcSrc.level2) hierarchical_categories.lvl2 = hcSrc.level2;
    if (hcSrc.level3) hierarchical_categories.lvl2 = hierarchical_categories.lvl2 || hcSrc.level3;
  }

  // categoryPageId from hierarchical categories
  const categoryPageId: string[] = [];
  for (let lvl = 0; lvl <= 5; lvl++) {
    const key = `level${lvl}`;
    if (hcSrc && typeof hcSrc[key] === "string" && hcSrc[key]) {
      categoryPageId.push(hcSrc[key]);
    }
  }
  // Also keep source categoryPageId if already present
  if (Array.isArray(src.categoryPageId) && categoryPageId.length === 0) {
    categoryPageId.push(...(src.categoryPageId as string[]));
  }

  // Image URL
  const imageFilename = src.image as string | undefined;
  const primaryImage = imageFilename
    ? `${IMAGE_BASE_URL}/${imageFilename}`
    : "";

  // Price
  const rawPrice = typeof src.price === "number" ? src.price : 0;

  // Reviews
  const rating = typeof src.rating === "number" ? src.rating : (typeof src.stars === "number" ? src.stars : 0);
  const ratingsCount = typeof src.ratingsCount === "number" ? src.ratingsCount : 0;
  const bayesianAvg = typeof src.bayesianPopularity === "number" ? src.bayesianPopularity : rating;

  // Sales
  const sales = typeof src.sales === "number" ? src.sales : 0;

  // Keywords from bullets
  const bullets = Array.isArray(src.bullets) ? src.bullets as string[] : [];

  // Category as list_categories
  const category = typeof src.category === "string" ? src.category : "";
  const listCategories = category ? [category] : [];

  // Slug
  const name = typeof src.name === "string" ? src.name : "";
  const slug = slugify(name);

  // Color from attrs
  const attrs = src.attrs as Record<string, string> | undefined;
  const colorName = attrs?.Color || "";

  return {
    objectID: src.objectID,
    name,
    slug,
    sku: src.asin || src.objectID,
    parentID: src.objectID,
    description: src.description || "",
    brand: src.brand || "",
    gender: "",
    isNew: false,
    url: "",
    stock: 100,
    price: { value: rawPrice },
    color: { filter_group: colorName, original_name: colorName },
    primary_image: primaryImage,
    image_urls: primaryImage ? [primaryImage] : [],
    image_blurred: "",
    image_description: src.image_description || "",
    available_sizes: [],
    hierarchical_categories,
    list_categories: listCategories,
    categoryPageId,
    variants: [],
    keywords: bullets,
    semantic_attributes: src.semantic_attributes || "",
    reviews: {
      bayesian_avg: bayesianAvg,
      count: ratingsCount,
      rating,
    },
    availableInStores: [],
    margin: 0,
    discount_rate: 0,
    product_aov: rawPrice,
    sales_last_24h: Math.round(sales / 365),
    sales_last_7d: Math.round(sales / 52),
    sales_last_30d: Math.round(sales / 12),
    sales_last_90d: Math.round(sales / 4),
    template: src.template,
    category: src.category,
    attrs: src.attrs || {},
  };
}

async function main() {
  const feedPath = process.argv[2] || "data/products.json";
  console.log(`Reading JSON feed from ${feedPath}...`);
  const raw = readFileSync(feedPath, "utf-8");
  const sourceRecords: Record<string, unknown>[] = JSON.parse(raw);
  console.log(`Loaded ${sourceRecords.length} products`);

  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    console.error("Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY");
    process.exit(1);
  }

  console.log(`Connecting to Algolia (App: ${ALGOLIA_APP_ID}, Index: ${INDEX_NAME})...`);
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

  // Transform all records to match the frontend schema
  console.log("Transforming records...");
  const records = sourceRecords.map(transformRecord);

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
        "attrs.Material",
        "attrs.Style",
        "attrs.Pattern",
        "attrs.Shape",
        "attrs.Color",
        "attrs.Finish Type",
        "attrs.Frame Material",
        "attrs.Fill Material",
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
        "searchable(categoryPageId)",
        "filterOnly(price.value)",
        "filterOnly(reviews.rating)",
        "searchable(attrs.Material)",
        "searchable(attrs.Style)",
        "searchable(attrs.Color)",
        "searchable(attrs.Pattern)",
        "searchable(attrs.Shape)",
        "searchable(attrs.Finish Type)",
        "searchable(attrs.Frame Material)",
        "searchable(attrs.Indoor/Outdoor Usage)",
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
        "attrs",
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
