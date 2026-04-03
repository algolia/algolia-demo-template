/**
 * Setup Algolia Recommend models
 *
 * Triggers training for Recommend models (Related Products, Looking Similar)
 * using the internal Recommend config API.
 *
 * Note: This uses an undocumented API endpoint that the Algolia Dashboard calls
 * internally. It may change without notice.
 *
 * Usage:
 *   pnpm tsx scripts/setup-recommend.ts
 *
 * Prerequisites:
 *   - ALGOLIA_ADMIN_API_KEY set in .env
 *   - Source index already populated with product data
 */
import "dotenv/config";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const APP_ID = ALGOLIA_CONFIG.APP_ID;
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = ALGOLIA_CONFIG.INDEX_NAME;

// EU region — change to "us" for US-region apps
const REGION = "de";
const BASE_URL = `https://recommend.${REGION}.algolia.com/1`;

// Content-based filtering attributes used for fallback recommendations
// when not enough events are available
const CBF_ATTRIBUTES = ["hierarchical_categories.lvl0", "hierarchical_categories.lvl1", "brand"];

interface ModelConfig {
  name: string;
  path: string;
  body: Record<string, unknown>;
}

const MODELS: ModelConfig[] = [
  {
    name: "Related Products",
    path: "related-products",
    body: {
      cbfAttributes: CBF_ATTRIBUTES,
      deduplication: false,
      personalization: false,
    },
  },
  {
    name: "Looking Similar",
    path: "looking-similar",
    body: {
      imageAttributes: [{ attribute: "primary_image" }],
      deduplication: false,
      personalization: false,
    },
  },
  {
    name: "Trending Items",
    path: "trending-items",
    body: {},
  },
];

async function getExistingConfig(modelPath: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${BASE_URL}/${modelPath}/configs/${INDEX_NAME}`, {
    method: "GET",
    headers: {
      "x-algolia-application-id": APP_ID,
      "x-algolia-api-key": ADMIN_KEY,
      "Content-Type": "application/json",
    },
  });

  if (res.ok) {
    return res.json();
  }
  return null;
}

async function trainModel(model: ModelConfig): Promise<boolean> {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Setting up: ${model.name}`);

  const existing = await getExistingConfig(model.path);
  if (existing) {
    console.log(`  Config already exists — updating and retraining...`);
  } else {
    console.log(`  No existing config — creating new...`);
  }

  const res = await fetch(`${BASE_URL}/${model.path}/configs/${INDEX_NAME}`, {
    method: "POST",
    headers: {
      "x-algolia-application-id": APP_ID,
      "x-algolia-api-key": ADMIN_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(model.body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`  Failed (${res.status}): ${text}`);
    return false;
  }

  console.log(`  Training triggered successfully!`);
  return true;
}

async function main() {
  if (!ADMIN_KEY) {
    console.error("Missing ALGOLIA_ADMIN_API_KEY in .env");
    process.exit(1);
  }

  console.log(`App ID:  ${APP_ID}`);
  console.log(`Index:   ${INDEX_NAME}`);
  console.log(`Region:  ${REGION}`);
  console.log(`Models:  ${MODELS.map((m) => m.name).join(", ")}`);

  let success = 0;
  let failed = 0;

  for (const model of MODELS) {
    const ok = await trainModel(model);
    if (ok) success++;
    else failed++;
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Done! ${success} model(s) triggered, ${failed} failed.`);

  if (success > 0) {
    console.log("\nModels will take a few hours to finish training.");
    console.log(`Check status at: https://dashboard.algolia.com/apps/${APP_ID}/recommend/models`);
  }
}

main().catch((error) => {
  console.error("Error setting up Recommend:", error);
  process.exit(1);
});
