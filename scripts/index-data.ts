import "dotenv/config";
import { readFileSync } from "fs";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const ALGOLIA_APP_ID = ALGOLIA_CONFIG.APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = ALGOLIA_CONFIG.INDEX_NAME;
const COMPOSITION_ID = ALGOLIA_CONFIG.COMPOSITION_ID || `${INDEX_NAME}_composition`;

/**
 * Deterministic pseudo-random from objectID for reproducible demo data
 */
function seedRandom(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) / 2147483647;
}

/**
 * Strip HTML tags and decode common HTML entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&egrave;/g, "è")
    .replace(/&agrave;/g, "à")
    .replace(/&eacute;/g, "é")
    .replace(/&ograve;/g, "ò")
    .replace(/&ugrave;/g, "ù")
    .replace(/&igrave;/g, "ì")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate URL-safe slug from a product name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[àáâã]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõ]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Transform: reshape raw Arcaplanet VTEX data to match the Product interface.
 * Filters out non-Arcaplanet records, maps field names, extracts pricing from
 * VTEX items/sellers structure, converts hierarchicalCategories from arrays
 * to single strings, and synthesizes business metrics.
 */
function transformRecords(
  records: Record<string, unknown>[]
): Record<string, unknown>[] {
  // Filter to only Arcaplanet records (have items[] from VTEX)
  const arcaplanetRecords = records.filter(
    (r) => Array.isArray(r.items) && (r.items as unknown[]).length > 0
  );
  console.log(
    `  Filtered to ${arcaplanetRecords.length} Arcaplanet records (removed ${records.length - arcaplanetRecords.length} non-Arcaplanet records)`
  );

  return arcaplanetRecords.map((r) => {
    const syntheticFields: string[] = [];
    const items = r.items as Array<Record<string, unknown>>;
    const firstItem = items[0] || {};
    const sellers = firstItem.sellers as Record<string, unknown> | undefined;
    const offer = sellers?.commertialoffer as Record<string, unknown> | undefined;

    // --- Price ---
    const price = parseFloat(String(offer?.price || "0"));
    const listPrice = parseFloat(String(offer?.listprice || "0"));
    const discountRate =
      listPrice > 0 && listPrice > price
        ? Math.round(((listPrice - price) / listPrice) * 100)
        : 0;

    // --- Images ---
    const images = (r.images as string[]) || [];
    const primaryImage = images[0] || "";
    const imageUrls = images;

    // --- Name ---
    const name = (r.productname as string) || (r.producttitle as string) || "";

    // --- Description (strip HTML) ---
    const rawDesc = (r.description as string) || "";
    const description = stripHtml(rawDesc);

    // --- hierarchicalCategories: convert from arrays to single strings ---
    const hcSource = r.hierarchicalCategories as Record<string, unknown> | undefined;
    const hierarchical_categories: Record<string, string> = {};
    if (hcSource) {
      for (const lvl of ["lvl0", "lvl1", "lvl2", "lvl3"]) {
        const val = hcSource[lvl];
        if (Array.isArray(val) && val.length > 0) {
          hierarchical_categories[lvl] = val[0];
        } else if (typeof val === "string" && val) {
          hierarchical_categories[lvl] = val;
        }
      }
    }

    // --- Store availability: map shopId -> objectID ---
    const shopAvail = r.shopAvailability as Array<Record<string, unknown>> | undefined;
    const availableInStores = shopAvail
      ? shopAvail.map((s) => ({
          inStock: s.inStock as boolean,
          objectID: s.shopId as string,
        }))
      : [];

    // --- Synthesize business metrics ---
    const id = r.objectID as string;
    const rand = seedRandom(id);
    const sales24h = Math.floor(rand * 50);
    const sales7d = Math.floor(seedRandom(id + "7d") * 200);
    const sales30d = Math.floor(seedRandom(id + "30d") * 800);
    const sales90d = Math.floor(seedRandom(id + "90d") * 2000);
    const margin = Math.round(seedRandom(id + "margin") * 40 + 10);
    const productAov = Math.round((price * (1 + seedRandom(id + "aov") * 2)) * 100) / 100;
    syntheticFields.push(
      "sales_last_24h", "sales_last_7d", "sales_last_30d", "sales_last_90d",
      "margin", "product_aov", "reviews"
    );

    // --- Synthesize reviews ---
    const reviewRating = Math.round((seedRandom(id + "rating") * 2 + 3) * 10) / 10; // 3.0-5.0
    const reviewCount = Math.floor(seedRandom(id + "reviews") * 150);
    const bayesianAvg = Math.round(((reviewRating * reviewCount + 3.5 * 10) / (reviewCount + 10)) * 100) / 100;

    // --- Pet-specific fields (preserve as-is) ---
    const petFields: Record<string, unknown> = {};
    for (const f of [
      "età", "razza", "peso", "taglia", "gusto", "caratteristica",
      "tipo", "formato", "conservazione", "consistenza", "dosaggio", "funzione",
    ]) {
      if (r[f] !== undefined) {
        petFields[f] = r[f];
      }
    }

    return {
      objectID: id,
      name,
      slug: generateSlug(name),
      sku: (firstItem.ean as string) || (r.productreference as string) || id,
      parentID: (r.productid as string) || "",
      description,
      brand: (r.brand as string) || "",

      // Status
      isNew: false,
      url: (r.link as string) || "",
      stock: parseInt(String(offer?.availablequantity || "0"), 10),

      // Pricing
      price: { value: price },
      discount_rate: discountRate,

      // Images
      primary_image: primaryImage,
      image_urls: imageUrls,

      // Categories
      hierarchical_categories,

      // Pet-specific
      ...petFields,

      // Store availability
      availableInStores,

      // Business metrics (synthetic)
      sales_last_24h: sales24h,
      sales_last_7d: sales7d,
      sales_last_30d: sales30d,
      sales_last_90d: sales90d,
      margin,
      product_aov: productAov,

      // Reviews (synthetic)
      reviews: {
        bayesian_avg: bayesianAvg,
        count: reviewCount,
        rating: reviewRating,
      },

      // Synthetic marker
      _synthetic_fields: syntheticFields,
    };
  });
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
function extractTaglia(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.includes('giant')) return 'GRANDE';
  if (lower.includes('small & mini') || lower.includes('small&mini') || lower.includes('small mini')) return 'PICCOLA';
  if (lower.includes('maxi')) return 'GRANDE';
  if (lower.includes('medium')) return 'MEDIA';
  if (lower.includes('large')) return 'GRANDE';
  if (lower.includes('small')) return 'PICCOLA';
  if (lower.includes('mini')) return 'PICCOLA';
  if (lower.includes('toy')) return 'TOY';
  return null;
}

function extractAgeBucket(name: string, etaValue?: string): string | null {
  // Priority 1: explicit "N+" pattern in product name (e.g., "Ageing 8+", "Mature 7+")
  const match = name.match(/(\d{1,2})\s*\+/);
  if (match) return `${match[1]}+`;

  // Priority 2: defaults from categorical età
  const defaults: Record<string, string> = {
    PUPPY: "0+", KITTEN: "0+", ADULTO: "1+", ANZIANO: "7+", STERILIZZATO: "1+",
  };
  if (etaValue && etaValue in defaults) return defaults[etaValue];
  return null; // TUTTE LE ETÀ or missing
}

async function enrichRecords(
  records: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  let bucketCount = 0;
  for (const record of records) {
    const name = (record.name as string) || "";
    const eta = record.età as { value: string } | undefined;
    const bucket = extractAgeBucket(name, eta?.value);
    if (bucket) {
      record.age_bucket = bucket;
      bucketCount++;
      // Track as synthetic field
      const synth = (record._synthetic_fields as string[]) || [];
      if (!synth.includes("age_bucket")) {
        synth.push("age_bucket");
        record._synthetic_fields = synth;
      }
    }
  }
  console.log(`  → Assigned age_bucket to ${bucketCount}/${records.length} records`);

  // Tag accessories based on category hierarchy
  let accessoriCount = 0;
  for (const record of records) {
    const hc = record.hierarchical_categories as Record<string, string> | undefined;
    let isAccessori = false;
    if (hc) {
      for (const lvl of ["lvl0", "lvl1", "lvl2", "lvl3"]) {
        const val = hc[lvl];
        if (typeof val === "string" && val.includes("Accessori")) {
          isAccessori = true;
          break;
        }
      }
    }
    record.isAccessori = isAccessori;
    if (isAccessori) accessoriCount++;
  }
  console.log(`  → Tagged ${accessoriCount}/${records.length} records as accessories`);

  // Fill missing taglia from product name
  let tagliaCount = 0;
  for (const record of records) {
    const taglia = record.taglia as { value: string } | undefined;
    if (taglia?.value) continue; // already has taglia, skip
    const name = (record.name as string) || "";
    const extracted = extractTaglia(name);
    if (extracted) {
      record.taglia = { value: extracted };
      tagliaCount++;
      const synth = (record._synthetic_fields as string[]) || [];
      if (!synth.includes("taglia")) { synth.push("taglia"); record._synthetic_fields = synth; }
    }
  }
  console.log(`  → Auto-tagged taglia for ${tagliaCount} records missing size data`);

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

  console.log("Clearing index and re-indexing products...");
  const clearResult = await client.clearObjects({ indexName: INDEX_NAME });
  await client.waitForTask({
    indexName: INDEX_NAME,
    taskID: clearResult.taskID,
  });
  console.log("Index cleared.");

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
      //
      // Same-priority attributes: comma-separate in ONE string (e.g., "attr1, attr2").
      //   - They are unordered by default — do NOT wrap in unordered() inside comma strings.
      //   - Using unordered() inside a comma-separated string breaks Algolia's parsing.
      //
      // Single attributes: use unordered(attr) to disable word-position ranking within that attribute.
      //
      // See: https://www.algolia.com/doc/guides/managing-results/must-do/searchable-attributes/how-to/configuring-searchable-attributes-the-right-way/
      searchableAttributes: [
        // P1: Short, precise text — brand/category matches are unambiguous
        "unordered(brand)",
        "searchable_categories.lvl0, searchable_categories.lvl1, searchable_categories.lvl2",
        // P1.5: Pet-specific short attributes
        "gusto.value, razza.value, taglia.value",
        "età.value, funzione.value",
        // P2: Product name — ordered so matches at the start rank higher
        "name",
        // P3: Exact lookups
        "unordered(sku)",
        // P4: Enriched search terms
        "unordered(keywords)",
        // P5: Long text — catches long-tail but noisy, lowest priority
        "unordered(description)",
        "unordered(semantic_attributes)",
      ],
      attributesForFaceting: [
        "searchable(brand)",
        "hierarchical_categories.lvl0",
        "hierarchical_categories.lvl1",
        "hierarchical_categories.lvl2",
        "searchable(list_categories)",
        "searchable(categoryPageId)",
        "filterOnly(price.value)",
        "filterOnly(reviews.rating)",
        // Pet-specific facets
        "searchable(età.value)",
        "searchable(razza.value)",
        "searchable(peso.value)",
        "searchable(taglia.value)",
        "searchable(gusto.value)",
        "searchable(funzione.value)",
        "searchable(formato.value)",
        "searchable(conservazione.value)",
        "searchable(consistenza.value)",
        "searchable(tipo.value)",
        "searchable(age_bucket)",
        "filterOnly(discount_rate)",
      ],
      customRanking: ["asc(isAccessori)", "desc(reviews.bayesian_avg)", "desc(sales_last_24h)"],
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
      ignorePlurals: ["it"],
      indexLanguages: ["it"],
      queryLanguages: ["it"],
      removeStopWords: ["it"],
      removeWordsIfNoResults: "allOptional",
      attributesToRetrieve: [
        "objectID",
        "name",
        "slug",
        "sku",
        "parentID",
        "description",
        "brand",
        "isNew",
        "url",
        "stock",
        "price",
        "primary_image",
        "image_urls",
        "hierarchical_categories",
        "searchable_categories",
        "list_categories",
        "categoryPageId",
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
        // Pet-specific
        "età",
        "razza",
        "peso",
        "taglia",
        "gusto",
        "caratteristica",
        "tipo",
        "formato",
        "conservazione",
        "consistenza",
        "funzione",
        "age_bucket",
        "isAccessori",
      ],
      attributesToHighlight: ["name", "brand", "description"],
      attributesToSnippet: ["description:50"],
      renderingContent: {
        facetOrdering: {
          facets: {
            order: [
              "brand",
              "gusto.value",
              "taglia.value",
              "età.value",
              "peso.value",
              "formato.value",
              "funzione.value",
              "razza.value",
              "conservazione.value",
              "consistenza.value",
              "tipo.value",
            ],
          },
          values: {
            "brand": { sortRemainingBy: "count" },
            "gusto.value": { sortRemainingBy: "count" },
            "taglia.value": { sortRemainingBy: "count" },
            "età.value": { sortRemainingBy: "count" },
            "peso.value": { sortRemainingBy: "count" },
            "formato.value": { sortRemainingBy: "count" },
            "funzione.value": { sortRemainingBy: "count" },
            "razza.value": { sortRemainingBy: "count" },
            "conservazione.value": { sortRemainingBy: "count" },
            "consistenza.value": { sortRemainingBy: "count" },
            "tipo.value": { sortRemainingBy: "count" },
          },
        },
      },
    },
  });

  // Configure NeuralSearch (semantic search) settings
  console.log("Configuring NeuralSearch settings...");
  {
    const nsResponse = await fetch(
      `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${INDEX_NAME}/semanticSearch/settings`,
      {
        method: "PUT",
        headers: {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": ALGOLIA_ADMIN_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          neuralSearchMode: "active",
          eventSources: [],
          neuralExpression: {
            description: 0.797983,
            name: 1,
          },
          vectorModelId: "external://algolia-large-multilang-generic-v2410",
          neuralSearchPreset: "custom",
          semanticBlendWeight: 0.6,
          enableNeuralSearchSortBy: true,
          minHitsForSemantic: null,
          dynamicThreshold: {
            enabled: true,
            lowerLimit: 0.663,
          },
        }),
      }
    );

    if (!nsResponse.ok) {
      const error = await nsResponse.text();
      console.error("Failed to configure NeuralSearch:", error);
    } else {
      console.log("NeuralSearch configured successfully.");
    }
  }

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
