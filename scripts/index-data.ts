import "dotenv/config";
import { readFileSync } from "fs";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const ALGOLIA_APP_ID = ALGOLIA_CONFIG.APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = ALGOLIA_CONFIG.INDEX_NAME;
const COMPOSITION_ID = ALGOLIA_CONFIG.COMPOSITION_ID || `${INDEX_NAME}_composition`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deterministic pseudo-random from objectID for reproducible demo data */
function seedRandom(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) / 2147483647;
}

/** Return a deterministic random number in [min, max] */
function randBetween(seed: string, min: number, max: number): number {
  return Math.round(min + seedRandom(seed) * (max - min));
}

/** Strip HTML tags from text */
function stripHtml(text: string | undefined | null): string {
  if (!text) return "";
  return String(text)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse a tf_* JSON field: comma-separated JSON objects → array of specValues */
function parseTfField(raw: unknown): string[] {
  if (!raw || typeof raw !== "string" || !raw.trim()) return [];
  try {
    const cleaned = raw.replace(/,\s*$/, "");
    const arr: Array<{ specValue?: string }> = JSON.parse(`[${cleaned}]`);
    return arr
      .map((e) => e.specValue?.trim())
      .filter((v): v is string => !!v);
  } catch {
    return [];
  }
}

/** Parse size_codes JSON array string → string[] */
function parseSizeCodes(raw: unknown): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    // size_codes can be "[N]", "[44,46,48]", "[XS, S, M, L]" etc.
    // Wrap bare identifiers in quotes to make valid JSON
    const fixed = raw.replace(/\[([^\]]*)\]/, (_, inner) => {
      const items = inner.split(",").map((s: string) => {
        const trimmed = s.trim();
        // If it's already a number, keep as-is; otherwise quote it
        if (/^\d+(\.\d+)?$/.test(trimmed)) return trimmed;
        return `"${trimmed}"`;
      });
      return `[${items.join(",")}]`;
    });
    const arr = JSON.parse(fixed);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Extract a clean product name from var_display_name.
 * Pattern: "MARKETING NAME - COLOR" → "MARKETING NAME"
 * Handles broken records where var_display_name starts with " - "
 */
function extractNameFromVarDisplayName(varDisplayName: unknown): string {
  if (!varDisplayName || typeof varDisplayName !== "string") return "";
  const trimmed = varDisplayName.trim();
  // Broken record: starts with " - COLOR" (empty name)
  if (trimmed.startsWith("- ") || trimmed === "-") return "";
  // Strip color suffix: last " - " followed by mostly uppercase text
  const lastDash = trimmed.lastIndexOf(" - ");
  if (lastDash > 0) {
    const afterDash = trimmed.slice(lastDash + 3);
    // If what's after the dash is mostly uppercase/slashes (a color), strip it
    if (/^[A-Z0-9/\s.\-]+$/.test(afterDash)) {
      return trimmed.slice(0, lastDash).trim();
    }
  }
  return trimmed;
}

/**
 * Resolve best product name from available fields.
 * Priority: var_display_name (stripped) → Display Name → default_name
 */
function resolveName(r: Record<string, unknown>): string {
  const fromVar = extractNameFromVarDisplayName(r["var_display_name"]);
  if (fromVar) return fromVar;
  const displayName = r["Display Name"];
  if (displayName && typeof displayName === "string" && displayName.trim()) return displayName.trim();
  return String(r["default_name"] || "");
}

/**
 * Infer gender from ALL available name fields for best coverage.
 * var_display_name is 100% populated and contains "MEN'S"/"WOMEN'S" markers.
 */
function inferGender(r: Record<string, unknown>): string {
  // Concatenate all name fields for maximum signal
  const text = [
    r["var_display_name"],
    r["Display Name"],
    r["default_name"],
    r["var_short_description"],
    r["short_description"],
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
  if (text.includes("WOMEN") || text.includes("WOMAN") || text.includes("LADY") || text.includes(" WMN")) return "Women";
  if (text.includes("KID") || text.includes("JUNIOR") || text.includes("YOUTH")) return "Kids";
  if (text.includes(" MEN") || text.includes("MAN ") || text.includes("MEN'S") || text.includes("MEN ")) return "Men";
  return "Unisex";
}

/** Parse color_map JSON for structured color data, matching by colorCode. Fallback to color_desc */
function parseColorMap(colorMap: unknown, colorCode: string, colorDesc: string): string {
  if (colorMap && typeof colorMap === "string") {
    try {
      const parsed = JSON.parse(colorMap);
      if (Array.isArray(parsed)) {
        const match = parsed.find((e: { code?: string }) => e.code === colorCode);
        if (match?.description) return String(match.description);
        if (parsed[0]?.description) return String(parsed[0].description);
      }
    } catch { /* fall through */ }
  }
  return colorDesc;
}

/** Split slash-separated color_desc into primary, secondary, and full list */
function parseColorParts(colorDesc: string): { primary: string; secondary: string | null; list: string[] } {
  const parts = colorDesc.split("/").map((p) => p.trim()).filter(Boolean);
  return {
    primary: parts[0] || colorDesc,
    secondary: parts[1] || null,
    list: parts,
  };
}

/** Build image URLs from pdp_image UUIDs and image_product_id */
function buildImageUrls(pdpImage: unknown, imageProductId: unknown): string[] {
  if (!pdpImage || typeof pdpImage !== "string") return [];
  const uuids = pdpImage.split(",").map((u) => u.trim()).filter(Boolean);
  const prodId = typeof imageProductId === "string" ? imageProductId : "";
  return uuids.map(
    (uuid, i) =>
      `https://dainese-cdn.thron.com/delivery/public/image/dainese/${uuid}/px6qct/std/450x450/${prodId}_${i + 1}.png`
  );
}

/** Generate synthetic price based on Collection (lvl0) */
function generatePrice(objectID: string, collection: string): number {
  const col = (collection || "").toLowerCase();
  const ranges: Record<string, [number, number]> = {
    "leather suits": [800, 1800],
    "leather suits d-air": [800, 1800],
    "leather jackets": [400, 900],
    "gore-tex jackets": [350, 700],
    "d-dry jackets": [200, 450],
    "leather pants": [300, 600],
    "gore-tex pants": [250, 500],
    boots: [200, 500],
    shoes: [200, 500],
    gloves: [80, 250],
    "helmets full face": [300, 700],
    "helmets jet": [200, 450],
    "helmets accessories": [20, 150],
    "base layer": [30, 80],
    "mid layers": [80, 200],
    "t-shirt / tee / jerseys / swea": [30, 120],
    accessories: [20, 150],
    "accessories d-air": [50, 200],
    safety: [50, 200],
    "smart jacket": [400, 800],
    "d-air racing ski": [600, 1200],
    "bags and backpack": [80, 300],
    "textile jackets": [200, 500],
    "textile pants": [150, 400],
    "textile suits": [400, 900],
    "multisport jackets": [200, 500],
    "multisport pants": [150, 400],
    "d-dry pants": [200, 450],
    "waterproof items": [100, 350],
    goggles: [80, 250],
    "promotional items": [20, 80],
    services: [20, 100],
  };
  const [min, max] = ranges[col] || [100, 400];
  // Round to nearest .99
  const base = randBetween(objectID, min, max);
  return Number((base - 0.01).toFixed(2));
}

/** Create a URL-safe slug from product name */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

/** Map raw product_line to clean display names. Returns null for items to exclude from nav. */
function cleanProductLine(raw: string): string | null {
  const map: Record<string, string> = {
    "Motorcycles": "Motorcycles",
    "Multisport - Snow": "Snow",
    "Multisport - Wheels": "Bike",
    "Multisport - Sailing": "Sailing",
    "D-Air": "D-Air",
    "Smart Jacket": "Smart Jacket",
    "Off-Road": "Off-Road",
    "Demon Basics": "Snow",
  };
  return map[raw] ?? null;
}

/**
 * Transform: reshape Dainese PIM export to match the Product interface.
 * Maps fields, builds images, generates synthetic prices, parses tech features.
 */
function transformRecords(
  records: Record<string, unknown>[]
): Record<string, unknown>[] {
  // First pass: build variant groups keyed by master
  const masterGroups = new Map<string, Record<string, unknown>[]>();
  for (const r of records) {
    const master = String(r["master"] || "");
    if (!master) continue;
    if (!masterGroups.has(master)) masterGroups.set(master, []);
    masterGroups.get(master)!.push(r);
  }

  return records.map((r) => {
    const objectID = String(r["product_id"] || "");
    const name = resolveName(r);
    const master = String(r["master"] || "");
    const collection = String(r["Collection"] || "");
    const productCategory = String(r["product_category"] || "");
    const productFamily = String(r["product_family"] || "");
    const colorCode = String(r["color_code"] || "");
    const colorDesc = parseColorMap(r["color_map"], colorCode, String(r["color_desc"] || ""));
    const colorParts = parseColorParts(colorDesc);
    const imageProductId = r["image_product_id"];
    const pdpImage = r["pdp_image"];
    const shortDesc = stripHtml(r["short_description"] as string);
    const longDesc = stripHtml(r["long_description"] as string);
    const brand = String(r["manufacturer_name"] || "DAINESE");

    const imageUrls = buildImageUrls(pdpImage, imageProductId);
    const primaryImage = imageUrls[0] || "";
    const price = generatePrice(objectID, collection);

    // Build hierarchical categories: product_line > Collection > product_category
    const productLine = String(r["product_line"] || "");
    const cleanedLine = cleanProductLine(productLine);
    const lvl0 = cleanedLine || "";
    const lvl1 = lvl0 && collection ? `${lvl0} > ${collection}` : "";
    const lvl2 = lvl1 && productCategory ? `${lvl1} > ${productCategory}` : "";
    // Leaf category: deepest non-empty level value only
    const categoryLeaf = productCategory || collection || cleanedLine || "";

    // Parse all tf_* fields into attrs object
    const attrs: Record<string, string[]> = {};
    const tfPrefix = "tf_";
    for (const key of Object.keys(r)) {
      if (key.startsWith(tfPrefix) && !key.startsWith("var_")) {
        const values = parseTfField(r[key]);
        if (values.length > 0) {
          attrs[key.slice(tfPrefix.length)] = values;
        }
      }
    }

    // Build list_categories from unique category values
    const listCats = [
      ...new Set(
        [cleanedLine, collection, productCategory, productFamily].filter(Boolean)
      ),
    ];

    // Build variants from sibling records (same master, different objectID)
    const siblings = masterGroups.get(master) || [];
    const variants = siblings
      .filter((s) => String(s["product_id"]) !== objectID)
      .map((s) => {
        const sibId = String(s["product_id"] || "");
        const sibImageUrls = buildImageUrls(s["pdp_image"], s["image_product_id"]);
        const sibPrice = generatePrice(sibId, String(s["Collection"] || ""));
        const sibColorCode = String(s["color_code"] || "");
        const sibColorDesc = parseColorMap(s["color_map"], sibColorCode, String(s["color_desc"] || ""));
        return {
          objectID: sibId,
          color: {
            filter_group: sibColorDesc,
            original_name: sibColorCode,
          },
          image_urls: sibImageUrls,
          price: { value: sibPrice },
        };
      });

    // Synthesize business metrics
    const seed = objectID;
    const salesBase = randBetween(seed + "_sales", 0, 100);
    const reviewRating = 3 + seedRandom(seed + "_rating") * 2; // 3.0-5.0

    return {
      objectID,
      name,
      slug: slugify(name),
      sku: objectID,
      parentID: master,
      description: shortDesc,
      brand,
      gender: inferGender(r),

      isNew: String(r["season"] || "").includes("2026"),
      url: `https://www.dainese.com/search?q=${encodeURIComponent(name)}`,
      stock: randBetween(seed + "_stock", 5, 200),

      price: { value: price },
      color: {
        filter_group: colorDesc,
        original_name: colorCode,
      },
      primary_colour: colorParts.primary,
      secondary_colour: colorParts.secondary,
      colour_list: colorParts.list,

      primary_image: primaryImage,
      image_urls: imageUrls,
      image_blurred: "",
      image_description: "",

      available_sizes: parseSizeCodes(r["size_codes"]),

      hierarchical_categories: {
        lvl0,
        ...(lvl1 ? { lvl1 } : {}),
        ...(lvl2 ? { lvl2 } : {}),
      },
      category_leaf: categoryLeaf,
      list_categories: listCats,

      variants,

      // Extra facets
      product_segment: String(r["product_segment"] || ""),
      product_line: String(r["product_line"] || ""),
      season: String(r["season"] || ""),

      // Accessory flag for custom ranking (demote accessories)
      isAccessory: [
        "Accessories", "Helmets accessories", "Accessories D-Air",
        "Bags and backpack", "Promotional items", "Services", "Goggles",
      ].includes(collection),

      // Additional grounded data from feed
      weight: typeof r["net_weight"] === "number" ? r["net_weight"] : 0,
      size_range: String(r["size_range"] || ""),
      homologation: String(r["homologation"] || ""),

      // Technical attributes
      attrs,

      // Search & Discovery (enriched later if AI enrichment is enabled)
      keywords: [
        ...listCats,
        colorDesc,
        brand,
        inferGender(r),
        String(r["product_segment"] || ""),
      ].filter(Boolean),
      semantic_attributes: [shortDesc, longDesc].filter(Boolean).join(" "),

      // Reviews
      reviews: {
        bayesian_avg: Number(reviewRating.toFixed(1)),
        count: randBetween(seed + "_rcount", 2, 200),
        rating: Number(reviewRating.toFixed(1)),
      },

      // Business metrics
      margin: randBetween(seed + "_margin", 15, 65),
      discount_rate: seedRandom(seed + "_disc") < 0.15
        ? randBetween(seed + "_discval", 10, 40)
        : 0,
      product_aov: price,
      sales_last_24h: Math.round(salesBase * 0.1),
      sales_last_7d: Math.round(salesBase * 0.5),
      sales_last_30d: Math.round(salesBase * 2),
      sales_last_90d: Math.round(salesBase * 6),
    };
  });
}

/**
 * Enrich: add computed or AI-generated fields.
 * For Dainese, the transform already builds keywords and semantic_attributes
 * from the rich product data. AI enrichment can be enabled later.
 */
async function enrichRecords(
  records: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  // No AI enrichment needed — transform already populates keywords and semantic_attributes
  // from short_description, long_description, categories, and color data.
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

  // Populate categoryPageId from hierarchical_categories for category page filtering
  for (const record of enriched) {
    const hc = record.hierarchical_categories as
      | Record<string, string>
      | undefined;
    if (hc && typeof hc === "object") {
      const paths: string[] = [];
      for (let lvl = 0; lvl <= 3; lvl++) {
        const val = hc[`lvl${lvl}`];
        if (typeof val === "string" && val) paths.push(val);
      }
      record.categoryPageId = paths;
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
      // DISTINCT: group color variants by parentID (master product)
      attributeForDistinct: "parentID",
      distinct: true,

      searchableAttributes: [
        "unordered(brand)",
        "unordered(primary_colour)",
        "unordered(secondary_colour)",
        "name",
        "unordered(sku)",
        "unordered(description)",
        "unordered(keywords)",
      ],
      attributesForFaceting: [
        "searchable(brand)",
        "searchable(gender)",
        "searchable(color.filter_group)",
        "searchable(colour_list)",
        "searchable(available_sizes)",
        "hierarchical_categories.lvl0",
        "hierarchical_categories.lvl1",
        "hierarchical_categories.lvl2",
        "searchable(category_leaf)",
        "searchable(list_categories)",
        "searchable(categoryPageId)",
        "searchable(product_segment)",
        "searchable(product_line)",
        "searchable(season)",
        "filterOnly(price.value)",
        "filterOnly(reviews.rating)",
        "filterOnly(parentID)",
        "filterOnly(isAccessory)",
      ],
      customRanking: ["asc(isAccessory)", "desc(reviews.bayesian_avg)", "desc(sales_last_24h)"],
      optionalWords: ["Winter"],
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
        "primary_colour",
        "secondary_colour",
        "colour_list",
        "primary_image",
        "image_urls",
        "image_blurred",
        "image_description",
        "available_sizes",
        "hierarchical_categories",
        "category_leaf",
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
        "product_segment",
        "product_line",
        "season",
        "attrs",
        "weight",
        "size_range",
        "homologation",
        "isAccessory",
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
