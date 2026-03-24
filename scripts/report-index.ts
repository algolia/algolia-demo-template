import "dotenv/config";
import { algoliasearch } from "algoliasearch";

const client = algoliasearch("3FKQCCIUWO", process.env.ALGOLIA_ADMIN_API_KEY!);

async function main() {
  // First, check settings to understand faceting config
  const settings = await client.getSettings({ indexName: "new_consum_products" });
  console.log("=== INDEX SETTINGS (faceting) ===");
  console.log("attributesForFaceting:", JSON.stringify(settings.attributesForFaceting, null, 2));

  // Get a sample record to see structure
  const sampleRes = await client.searchSingleIndex({
    indexName: "new_consum_products",
    searchParams: { query: "", hitsPerPage: 1, attributesToRetrieve: ["*"] },
  });
  if (sampleRes.hits[0]) {
    const keys = Object.keys(sampleRes.hits[0]);
    console.log("\n=== SAMPLE RECORD KEYS ===");
    console.log(keys.join(", "));
    const h = sampleRes.hits[0] as Record<string, unknown>;
    // Print any field with "categor" in the name
    for (const k of keys) {
      if (k.toLowerCase().includes("categor")) {
        console.log(`\n${k}:`, JSON.stringify(h[k], null, 2));
      }
    }
  }

  // Try facets with wildcard
  console.log("\n=== HIERARCHICAL CATEGORIES (facets: *) ===");
  const wildRes = await client.searchSingleIndex({
    indexName: "new_consum_products",
    searchParams: {
      query: "",
      hitsPerPage: 0,
      facets: ["*"],
      maxValuesPerFacet: 1000,
    },
  });

  for (const [facet, values] of Object.entries(wildRes.facets || {})) {
    if (facet.toLowerCase().includes("categor") || facet.toLowerCase().includes("hierarch")) {
      console.log(`\n${facet}:`);
      for (const [val, count] of Object.entries(values as Record<string, number>)) {
        console.log(`  ${val} (${count})`);
      }
    }
  }

  // Print all facet names
  console.log("\n=== ALL FACET NAMES ===");
  for (const facet of Object.keys(wildRes.facets || {})) {
    const count = Object.keys((wildRes.facets || {})[facet] as Record<string, number>).length;
    console.log(`  ${facet} (${count} values)`);
  }

  // Get image domains from all string fields
  console.log("\n=== IMAGE DOMAINS ===");
  const domains = new Set<string>();
  const imgRes = await client.searchSingleIndex({
    indexName: "new_consum_products",
    searchParams: { query: "", hitsPerPage: 200, attributesToRetrieve: ["*"] },
  });

  function extractDomains(val: unknown) {
    if (typeof val === "string" && val.startsWith("http")) {
      try { domains.add(new URL(val).hostname); } catch { /* ignore */ }
    }
    if (Array.isArray(val)) val.forEach(extractDomains);
    if (val && typeof val === "object" && !Array.isArray(val)) {
      Object.values(val).forEach(extractDomains);
    }
  }

  for (const hit of imgRes.hits) {
    extractDomains(hit);
  }

  for (const d of domains) console.log(`  ${d}`);
}

main().catch(console.error);
