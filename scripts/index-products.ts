import "dotenv/config";
import { readFileSync } from "fs";
import { parseStringPromise } from "xml2js";
import { algoliasearch } from "algoliasearch";

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "hsn_products";
const COMPOSITION_ID = process.env.NEXT_PUBLIC_ALGOLIA_COMPOSITION_ID;

interface XmlProduct {
  "sqr:content_type"?: string[];
  "sqr:id"?: string[];
  "sqr:title"?: string[];
  "sqr:sku"?: string[];
  "sqr:description"?: string[];
  "sqr:short_description"?: string[];
  "sqr:brand"?: string[];
  "sqr:url"?: string[];
  "sqr:image_link"?: string[];
  "sqr:stock"?: string[];
  "sqr:product_object_type"?: string[];
  "sqr:visibility"?: string[];
  "sqr:status"?: string[];
  "sqr:characteristics"?: string[];
  "sqr:ingredients"?: string[];
  "sqr:product_name_en"?: string[];
  "sqr:producttypes"?: string[];
  "sqr:qty_reviews_sooqr"?: string[];
  "sqr:qty_sooqr"?: string[];
  "sqr:rating_sooqr"?: string[];
  "sqr:category0"?: { node?: string[] }[];
  "sqr:category1"?: { node?: string[] }[];
  "sqr:category2"?: { node?: string[] }[];
  "sqr:category3"?: { node?: string[] }[];
  "sqr:currency"?: string[];
  "sqr:normal_price"?: string[];
  "sqr:price"?: string[];
  "sqr:normal_price_chf"?: string[];
  "sqr:price_chf"?: string[];
  "sqr:normal_price_pln"?: string[];
  "sqr:price_pln"?: string[];
  "sqr:normal_price_ron"?: string[];
  "sqr:price_ron"?: string[];
  "sqr:normal_price_sek"?: string[];
  "sqr:price_sek"?: string[];
  "sqr:assoc_id"?: string[];
  "sqr:is_parent"?: string[];
  "sqr:manage_stock"?: string[];
  "sqr:backorders"?: string[];
}

interface AlgoliaProduct {
  objectID: string;
  id: string;
  title: string;
  sku: string;
  description: string;
  shortDescription: string;
  brand: string;
  url: string;
  imageUrl: string;
  stock: number;
  inStock: boolean;
  productType: string;
  visibility: string;
  status: string;
  characteristics: string[];
  ingredients: string[];
  titleEn: string;
  format: string;
  reviewCount: number;
  quantity: number;
  rating: number;
  categories: {
    lvl0: string[];
    lvl1: string[];
    lvl2: string[];
    lvl3: string[];
  };
  hierarchicalCategories: {
    lvl0: string[];
    lvl1: string[];
    lvl2: string[];
    lvl3: string[];
  };
  currency: string;
  price: number;
  normalPrice: number;
  discount: number;
  discountPercentage: number;
  prices: {
    EUR: { price: number; normalPrice: number };
    CHF: { price: number; normalPrice: number };
    PLN: { price: number; normalPrice: number };
    RON: { price: number; normalPrice: number };
    SEK: { price: number; normalPrice: number };
  };
  isParent: boolean;
  associatedId: string;
}

function extractText(field: string[] | undefined): string {
  if (!field || field.length === 0) return "";
  let text = field[0] || "";
  text = text.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1");
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&Aacute;/g, "Á")
    .replace(/&aacute;/g, "á")
    .replace(/&Eacute;/g, "É")
    .replace(/&eacute;/g, "é")
    .replace(/&Iacute;/g, "Í")
    .replace(/&iacute;/g, "í")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&oacute;/g, "ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&uacute;/g, "ú")
    .replace(/&Ntilde;/g, "Ñ")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&iquest;/g, "¿")
    .replace(/&iexcl;/g, "¡");
  return text.trim();
}

function extractNumber(field: string[] | undefined): number {
  const text = extractText(field);
  const num = parseFloat(text);
  return isNaN(num) ? 0 : num;
}

function extractCategories(
  categoryField: { node?: string[] }[] | undefined
): string[] {
  if (!categoryField || categoryField.length === 0) return [];
  const nodes = categoryField[0]?.node;
  if (!nodes) return [];
  return nodes.map((n) => n.trim()).filter(Boolean);
}

function buildHierarchicalCategories(
  lvl0: string[],
  lvl1: string[],
  lvl2: string[],
  lvl3: string[]
): { lvl0: string[]; lvl1: string[]; lvl2: string[]; lvl3: string[] } {
  const result = {
    lvl0: lvl0,
    lvl1: [] as string[],
    lvl2: [] as string[],
    lvl3: [] as string[],
  };

  for (const cat0 of lvl0) {
    for (const cat1 of lvl1) {
      result.lvl1.push(`${cat0} > ${cat1}`);
      for (const cat2 of lvl2) {
        result.lvl2.push(`${cat0} > ${cat1} > ${cat2}`);
        for (const cat3 of lvl3) {
          result.lvl3.push(`${cat0} > ${cat1} > ${cat2} > ${cat3}`);
        }
      }
    }
  }

  return result;
}

function transformProduct(xmlProduct: XmlProduct): AlgoliaProduct | null {
  const id = extractText(xmlProduct["sqr:id"]);
  if (!id) return null;

  const status = extractText(xmlProduct["sqr:status"]);
  if (status !== "Habilitado") return null;

  const price = extractNumber(xmlProduct["sqr:price"]);
  const normalPrice = extractNumber(xmlProduct["sqr:normal_price"]);
  const discount = normalPrice - price;
  const discountPercentage =
    normalPrice > 0 ? Math.round((discount / normalPrice) * 100) : 0;

  const stock = extractNumber(xmlProduct["sqr:stock"]);

  const cat0 = extractCategories(xmlProduct["sqr:category0"]);
  const cat1 = extractCategories(xmlProduct["sqr:category1"]);
  const cat2 = extractCategories(xmlProduct["sqr:category2"]);
  const cat3 = extractCategories(xmlProduct["sqr:category3"]);

  const hierarchical = buildHierarchicalCategories(cat0, cat1, cat2, cat3);

  const characteristics = extractText(xmlProduct["sqr:characteristics"])
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const ingredients = extractText(xmlProduct["sqr:ingredients"])
    .split(",")
    .map((i) => i.trim())
    .filter(Boolean);

  return {
    objectID: id,
    id,
    title: extractText(xmlProduct["sqr:title"]),
    sku: extractText(xmlProduct["sqr:sku"]),
    description: extractText(xmlProduct["sqr:description"]),
    shortDescription: extractText(xmlProduct["sqr:short_description"]),
    brand: extractText(xmlProduct["sqr:brand"]),
    url: extractText(xmlProduct["sqr:url"]),
    imageUrl: extractText(xmlProduct["sqr:image_link"]),
    stock,
    inStock: stock > 0,
    productType: extractText(xmlProduct["sqr:product_object_type"]),
    visibility: extractText(xmlProduct["sqr:visibility"]),
    status,
    characteristics,
    ingredients,
    titleEn: extractText(xmlProduct["sqr:product_name_en"]),
    format: extractText(xmlProduct["sqr:producttypes"]),
    reviewCount: extractNumber(xmlProduct["sqr:qty_reviews_sooqr"]),
    quantity: extractNumber(xmlProduct["sqr:qty_sooqr"]),
    rating: extractNumber(xmlProduct["sqr:rating_sooqr"]),
    categories: {
      lvl0: cat0,
      lvl1: cat1,
      lvl2: cat2,
      lvl3: cat3,
    },
    hierarchicalCategories: hierarchical,
    currency: extractText(xmlProduct["sqr:currency"]) || "EUR",
    price,
    normalPrice,
    discount,
    discountPercentage,
    prices: {
      EUR: { price, normalPrice },
      CHF: {
        price: extractNumber(xmlProduct["sqr:price_chf"]),
        normalPrice: extractNumber(xmlProduct["sqr:normal_price_chf"]),
      },
      PLN: {
        price: extractNumber(xmlProduct["sqr:price_pln"]),
        normalPrice: extractNumber(xmlProduct["sqr:normal_price_pln"]),
      },
      RON: {
        price: extractNumber(xmlProduct["sqr:price_ron"]),
        normalPrice: extractNumber(xmlProduct["sqr:normal_price_ron"]),
      },
      SEK: {
        price: extractNumber(xmlProduct["sqr:price_sek"]),
        normalPrice: extractNumber(xmlProduct["sqr:normal_price_sek"]),
      },
    },
    isParent: extractText(xmlProduct["sqr:is_parent"]) === "1",
    associatedId: extractText(xmlProduct["sqr:assoc_id"]),
  };
}

async function main() {
  console.log("Reading XML feed...");
  const xmlContent = readFileSync("data/hsn-feed.xml", "utf-8");

  console.log("Parsing XML...");
  const result = await parseStringPromise(xmlContent);

  const products: XmlProduct[] = result.rss.products[0].product || [];
  console.log(`Found ${products.length} products in feed`);

  console.log("Transforming products...");
  const algoliaRecords: AlgoliaProduct[] = [];
  let skipped = 0;

  for (const xmlProduct of products) {
    const record = transformProduct(xmlProduct);
    if (record) {
      algoliaRecords.push(record);
    } else {
      skipped++;
    }
  }

  console.log(`Transformed ${algoliaRecords.length} products (skipped ${skipped})`);

  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    console.error("Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY");
    process.exit(1);
  }

  console.log(`Connecting to Algolia (App: ${ALGOLIA_APP_ID}, Index: ${INDEX_NAME})...`);
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

  console.log("Indexing products in batches...");
  const BATCH_SIZE = 1000;
  let indexed = 0;

  for (let i = 0; i < algoliaRecords.length; i += BATCH_SIZE) {
    const batch = algoliaRecords.slice(i, i + BATCH_SIZE);
    await client.saveObjects({
      indexName: INDEX_NAME,
      objects: batch,
    });
    indexed += batch.length;
    console.log(`Indexed ${indexed}/${algoliaRecords.length} products`);
  }

  console.log("Configuring index settings...");
  await client.setSettings({
    indexName: INDEX_NAME,
    indexSettings: {
      // Searchable attributes configuration:
      // - Order defines priority: attributes higher in the list are more relevant
      // - "ordered" (default): matches at the beginning of the attribute rank higher
      // - "unordered()": match position doesn't affect ranking
      // - Comma-separated attributes on the same line have equal priority (always unordered)
      //
      // Strategy:
      // - title is ordered: "Protein Bar" should rank higher than "Bar Protein Mix" for query "protein"
      // - All other attributes are unordered: match position doesn't matter for brand, description, etc.
      searchableAttributes: [
        "unordered(brand)",             // Brand is important but position doesn't matter
        "unordered(titleEn)",           // English title fallback
        "title",                        // Highest priority, ordered (beginning matches rank higher)
        "unordered(categories.lvl0), unordered(categories.lvl1), unordered(categories.lvl2)", // Same priority
        "unordered(characteristics), unordered(ingredients)", // Same priority - detailed attributes
        "unordered(shortDescription)",  // Product summary
        "unordered(description)",       // Lowest priority - long text, prone to noise
        "unordered(sku)",               // SKU for exact product lookups
      ],
      attributesForFaceting: [
        "searchable(brand)",
        "searchable(categories.lvl0)",
        "searchable(categories.lvl1)",
        "searchable(categories.lvl2)",
        "searchable(hierarchicalCategories.lvl0)",
        "searchable(hierarchicalCategories.lvl1)",
        "searchable(hierarchicalCategories.lvl2)",
        "searchable(hierarchicalCategories.lvl3)",
        "characteristics",
        "ingredients",
        "format",
        "inStock",
        "filterOnly(price)",
        "filterOnly(rating)",
      ],
      customRanking: ["desc(inStock)", "desc(rating)", "desc(reviewCount)"],
      attributesToRetrieve: [
        "objectID",
        "id",
        "title",
        "titleEn",
        "sku",
        "shortDescription",
        "brand",
        "url",
        "imageUrl",
        "stock",
        "inStock",
        "format",
        "reviewCount",
        "rating",
        "categories",
        "hierarchicalCategories",
        "characteristics",
        "ingredients",
        "price",
        "normalPrice",
        "discount",
        "discountPercentage",
        "prices",
      ],
      attributesToHighlight: ["title", "brand", "shortDescription"],
      attributesToSnippet: ["description:50"],
    },
  });

  console.log("Done! Indexed", algoliaRecords.length, "products to", INDEX_NAME);

  // Create or update the composition
  if (COMPOSITION_ID) {
    console.log(`Creating/updating composition (${COMPOSITION_ID})...`);
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
          name: "HSN Store Products Composition",
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
  } else {
    console.log("Skipping composition creation (NEXT_PUBLIC_ALGOLIA_COMPOSITION_ID not set)");
  }
}

main().catch(console.error);