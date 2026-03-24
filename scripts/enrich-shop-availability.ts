/**
 * Enrich product data with shop availability for click-and-collect.
 * Deterministic: uses a hash of objectID to seed random availability.
 *
 * Usage: pnpm tsx scripts/enrich-shop-availability.ts
 */

import { readFileSync, writeFileSync } from "fs";

const PRODUCTS_PATH = "data/new_consum_products.json";
const LOCATIONS_PATH = "data/new_consum_locations.json";
const SETTINGS_PATH = "data/new_consum_products.settings.json";

// Simple string hash for deterministic seeding
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

// Seeded pseudo-random number generator (mulberry32)
function seededRandom(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function main() {
  console.log("Reading locations...");
  const locations: Array<{ objectID: string }> = JSON.parse(
    readFileSync(LOCATIONS_PATH, "utf-8")
  );
  const shopIds = locations.map((l) => l.objectID);
  console.log(`Found ${shopIds.length} stores`);

  console.log("Reading products...");
  const products: Array<Record<string, unknown>> = JSON.parse(
    readFileSync(PRODUCTS_PATH, "utf-8")
  );
  console.log(`Found ${products.length} products`);

  console.log("Enriching with shop availability...");
  for (const product of products) {
    const id = (product.objectID as string) || "";
    const hash = hashCode(id);
    const rng = seededRandom(hash);

    // Each product available in 80-95% of stores
    const availabilityRate = 0.8 + rng() * 0.15;

    const shopAvailability: Array<{
      shopId: string;
      inStock: boolean;
      qty: number;
    }> = [];

    for (const shopId of shopIds) {
      const isAvailable = rng() < availabilityRate;
      if (isAvailable) {
        const qty = Math.floor(rng() * 150) + 1; // 1-150
        shopAvailability.push({ shopId, inStock: true, qty });
      } else {
        shopAvailability.push({ shopId, inStock: false, qty: 0 });
      }
    }

    product.shopAvailability = shopAvailability;
  }

  console.log("Writing enriched products...");
  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2));
  console.log(`Enriched ${products.length} products with shop availability`);

  // Update settings to add shopAvailability.shopId to attributesForFaceting
  console.log("Updating product settings...");
  const settings: Record<string, unknown> = JSON.parse(
    readFileSync(SETTINGS_PATH, "utf-8")
  );
  const faceting = settings.attributesForFaceting as string[];
  const shopFacet = "filterOnly(shopAvailability.shopId)";
  if (!faceting.includes(shopFacet)) {
    faceting.push(shopFacet);
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    console.log(`Added ${shopFacet} to attributesForFaceting`);
  } else {
    console.log("shopAvailability.shopId already in attributesForFaceting");
  }

  console.log("Done!");
}

main();
