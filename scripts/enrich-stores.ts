/**
 * Enrich store data with services, opening hours, and phone numbers.
 * Reads raw stores from Algolia, deduplicates, adds realistic service data,
 * and writes to data/stores.json as the source of truth.
 *
 * Usage: pnpm tsx scripts/enrich-stores.ts
 */

import { algoliasearch } from "algoliasearch";
import { writeFileSync } from "fs";
import { join } from "path";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const SERVICES = ["toelettatura", "veterinario", "adozioni", "parking"] as const;
type Service = (typeof SERVICES)[number];

interface EnrichedStore {
  objectID: string;
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  _geoloc: { lat: number; lng: number };
  phone: string;
  openingHours: string;
  services: Service[];
}

// Deterministic "random" based on string hash — same input always gives same output
function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generatePhone(seed: string): string {
  const h = hashCode(seed);
  const prefix = "02"; // Milan-style area code for consistency
  const num = String(h % 10000000).padStart(7, "0");
  return `+39 ${prefix} ${num.slice(0, 3)} ${num.slice(3)}`;
}

function assignServices(store: { objectID: string; city: string; name: string }): Service[] {
  const h = hashCode(store.objectID);
  const services: Service[] = [];

  // ~60% of stores have grooming
  if (h % 10 < 6) services.push("toelettatura");
  // ~30% have vet
  if (h % 10 < 3) services.push("veterinario");
  // ~25% have adoption events
  if ((h >> 4) % 4 === 0) services.push("adozioni");
  // ~50% have parking
  if (h % 2 === 0) services.push("parking");

  // Ensure at least one service
  if (services.length === 0) services.push("toelettatura");

  return services;
}

function generateOpeningHours(seed: string): string {
  const h = hashCode(seed);
  // Most stores: 9:00-20:00, some 9:30-20:30, some 8:30-21:00
  const variants = [
    "Lun-Sab 9:00-20:00, Dom 10:00-19:00",
    "Lun-Sab 9:30-20:30, Dom 10:00-19:30",
    "Lun-Dom 9:00-21:00",
    "Lun-Sab 8:30-20:00, Dom 9:30-19:00",
    "Lun-Dom 9:00-20:00",
  ];
  return variants[h % variants.length];
}

async function main() {
  const client = algoliasearch(ALGOLIA_CONFIG.APP_ID, ALGOLIA_CONFIG.SEARCH_API_KEY);

  console.log("Fetching stores from Algolia...");
  const result = await client.searchSingleIndex({
    indexName: ALGOLIA_CONFIG.LOCATIONS_INDEX,
    searchParams: { query: "", hitsPerPage: 200 },
  });

  console.log(`Found ${result.hits.length} stores`);

  // Deduplicate: prefer records with clean IDs over dashboard_generated ones
  type StoreHit = Record<string, unknown> & { objectID: string };
  const seen = new Map<string, StoreHit>();
  for (const store of result.hits as StoreHit[]) {
    const key = `${store.name}_${store.city}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, store);
    } else {
      const existingIsDashboard = existing.objectID.includes("dashboard_generated");
      const currentIsDashboard = store.objectID.includes("dashboard_generated");
      if (existingIsDashboard && !currentIsDashboard) {
        seen.set(key, store);
      }
    }
  }

  console.log(`After dedup: ${seen.size} stores`);

  // Enrich
  const enriched: EnrichedStore[] = Array.from(seen.values()).map((raw) => {
    const store = raw as Record<string, unknown>;
    const objectID = store.objectID as string;
    const id = (store.id as string) || objectID;
    const name = store.name as string;
    const city = store.city as string;
    const region = (store.region as string) || "";
    const address = (store.address as string) || "";
    const _geoloc = store._geoloc as { lat: number; lng: number };

    return {
      objectID,
      id,
      name,
      city,
      region,
      address,
      _geoloc,
      phone: generatePhone(objectID),
      openingHours: generateOpeningHours(objectID),
      services: assignServices({ objectID, city, name }),
    };
  });

  // Sort by city then name
  enriched.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

  const outPath = join(__dirname, "..", "data", "stores.json");
  writeFileSync(outPath, JSON.stringify(enriched, null, 2));
  console.log(`Wrote ${enriched.length} enriched stores to data/stores.json`);

  // Stats
  const serviceStats = SERVICES.map((s) => `${s}: ${enriched.filter((e) => e.services.includes(s)).length}`);
  console.log("Service distribution:", serviceStats.join(", "));
}

main().catch(console.error);
