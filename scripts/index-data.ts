import "dotenv/config";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

// Target app (where the demo runs)
const TARGET_APP_ID = ALGOLIA_CONFIG.APP_ID;
const TARGET_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = ALGOLIA_CONFIG.INDEX_NAME;
const COMPOSITION_ID = ALGOLIA_CONFIG.COMPOSITION_ID || `${INDEX_NAME}_composition`;

// Source app (where the data lives)
const SOURCE_APP_ID = "QPQAVM8S9W";
const SOURCE_API_KEY = "4dd8c689ae3105fa9c7d0ffcd526a61d";

// ============================================================================
// Ambito label mapping
// ============================================================================

const AMBITO_LABELS: Record<string, string> = {
  empresa: "Empresa",
  exteriors: "Afers Exteriors",
  salut: "Salut",
  economia: "Economia",
  canalsalut: "Canal Salut",
  presidencia: "Presidència",
  DTES: "Drets Socials",
  benestar: "Benestar Social",
  treballiaferssocials: "Treball i Afers Socials",
  ensenyament: "Ensenyament",
  cultura: "Cultura",
  mediambient: "Medi Ambient",
  agricultura: "Agricultura",
  interior: "Interior",
  treball: "Treball",
  dixit: "Ocupació (DIXIT)",
  justicia: "Justícia",
  llenguacatalana: "Llengua Catalana",
  administraciojusticia: "Administració de Justícia",
  eapc: "Administració Pública (EAPC)",
  icaen: "Energia (ICAEN)",
  ur: "Urbanisme",
  educacio: "Educació",
  finempresa: "Finançament Empresarial",
  accio: "Acció Exterior",
  webtreball: "Treball (Web)",
  joventut: "Joventut",
  governobert: "Govern Obert",
  governacio: "Governació",
  memoria: "Memòria Democràtica",
  guia_web: "Guia Web",
  rodalies: "Rodalies",
  cads: "Desenvolupament Sostenible",
  igualtat: "Igualtat",
  cesicat: "Ciberseguretat",
  ctti: "Tecnologia (CTTI)",
  dadesculturals: "Dades Culturals",
  comissiojuridicaassessora: "Comissió Jurídica Assessora",
  administraciopublica: "Administració Pública",
  habitatge: "Habitatge",
};

// Site domain → readable label
function getSiteLabel(domain: string): string {
  if (!domain) return "";
  const parts = domain.replace(".gencat.cat", "").split(".");
  const key = parts[0];
  const labels: Record<string, string> = {
    web: "GenCat",
    tramits: "Tràmits",
    habitatge: "Habitatge",
    educacio: "Educació",
    salut: "Salut",
    canalempresa: "Canal Empresa",
    exteriors: "Afers Exteriors",
    xtec: "Educació (XTEC)",
    cultura: "Cultura",
    mediambient: "Medi Ambient",
    treball: "Treball",
    justicia: "Justícia",
    agricultura: "Agricultura",
    interior: "Interior",
    parcsnaturals: "Parcs Naturals",
    presidencia: "Presidència",
    dogc: "DOGC",
    portaljuridic: "Portal Jurídic",
    preinscripcio: "Preinscripció",
    administraciopublica: "Administració Pública",
    igualtat: "Igualtat",
    xarxaempren: "Xarxa Emprenedoria",
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

// ============================================================================
// Transform
// ============================================================================

function transformRecord(record: Record<string, any>): Record<string, any> {
  const ambito: string[] = Array.isArray(record.ambito) ? record.ambito : [];
  const primaryAmbito = ambito[0] || "";
  const ambitoLabel = AMBITO_LABELS[primaryAmbito] || primaryAmbito;

  // Extract site domain from site array
  const siteArray: string[] = Array.isArray(record.site) ? record.site : [];
  const siteDomain = siteArray[0] || "";
  const siteLabel = getSiteLabel(siteDomain);

  // Generate snippet from body (first ~200 clean chars)
  const body: string = record.body || "";
  const snippet = body
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 250)
    .replace(/\s\S*$/, ""); // trim to last complete word

  // Build hierarchical categories from ambito
  const hierarchical_categories: Record<string, string> = {};
  if (ambitoLabel) {
    hierarchical_categories.lvl0 = ambitoLabel;
    if (ambito.length > 1) {
      const secondLabel = AMBITO_LABELS[ambito[1]] || ambito[1];
      if (secondLabel && secondLabel !== ambitoLabel) {
        hierarchical_categories.lvl1 = `${ambitoLabel} > ${secondLabel}`;
      }
    }
  }

  return {
    objectID: record.objectID,
    title: record.title || "",
    url: record.url || "",
    body,
    snippet,
    ambito,
    ambitoLabel,
    lang: record.lang || "ca",
    siteDomain,
    siteLabel,
    h1: record.h1 || "",
    h2: record.h2 || "",
    mimeType: record.mimeType || "text/html",
    lastIndexed: record.lastIndexed || 0,
    hierarchical_categories,
  };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  if (!TARGET_APP_ID || !TARGET_ADMIN_KEY) {
    console.error("Missing ALGOLIA_ADMIN_API_KEY in .env");
    process.exit(1);
  }

  console.log(`Source: ${SOURCE_APP_ID} / pro_GENCAT`);
  console.log(`Target: ${TARGET_APP_ID} / ${INDEX_NAME}`);

  // Connect to source app
  const sourceClient = algoliasearch(SOURCE_APP_ID, SOURCE_API_KEY);
  const targetClient = algoliasearch(TARGET_APP_ID, TARGET_ADMIN_KEY);

  // Browse all records from source index
  console.log("Browsing source index...");
  const allRecords: Record<string, any>[] = [];

  await sourceClient.browseObjects({
    indexName: "pro_GENCAT",
    browseParams: {
      attributesToRetrieve: [
        "title", "url", "body", "ambito", "lang", "site",
        "h1", "h2", "h3", "mimeType", "lastIndexed", "chunks", "order",
      ],
    },
    aggregator: (response) => {
      allRecords.push(...response.hits);
      if (allRecords.length % 10000 < 1000) {
        console.log(`  Browsed ${allRecords.length} records...`);
      }
    },
  });

  console.log(`Browsed ${allRecords.length} total records from source`);

  // Filter to Catalan + Spanish content
  const bilingualRecords = allRecords.filter((r) => r.lang === "ca" || r.lang === "es");
  console.log(`Filtered to ${bilingualRecords.length} Catalan + Spanish records`);

  // Transform records
  console.log("Transforming records...");
  const transformed = bilingualRecords.map(transformRecord);
  console.log(`Transformed ${transformed.length} records`);

  // Clear target index first
  console.log("Clearing target index...");
  await targetClient.clearObjects({ indexName: INDEX_NAME });

  // Index in batches
  console.log("Indexing records in batches...");
  const BATCH_SIZE = 1000;
  let indexed = 0;

  for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
    const batch = transformed.slice(i, i + BATCH_SIZE);
    await targetClient.saveObjects({
      indexName: INDEX_NAME,
      objects: batch,
    });
    indexed += batch.length;
    console.log(`  Indexed ${indexed}/${transformed.length}`);
  }

  // Configure index settings
  console.log("Configuring index settings...");
  await targetClient.setSettings({
    indexName: INDEX_NAME,
    indexSettings: {
      searchableAttributes: [
        "title",
        "h1",
        "h2",
        "snippet",
        "body",
        "ambito",
      ],
      attributesForFaceting: [
        "searchable(ambitoLabel)",
        "searchable(lang)",
        "searchable(siteDomain)",
        "searchable(siteLabel)",
        "mimeType",
        "hierarchical_categories.lvl0",
        "hierarchical_categories.lvl1",
      ],
      customRanking: ["desc(lastIndexed)"],
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
      indexLanguages: ["ca", "es"],
      queryLanguages: ["ca", "es"],
      removeStopWords: ["ca", "es"],
      ignorePlurals: ["ca", "es"],
      removeWordsIfNoResults: "allOptional" as const,
      attributesToRetrieve: [
        "objectID",
        "title",
        "url",
        "snippet",
        "ambito",
        "ambitoLabel",
        "lang",
        "siteDomain",
        "siteLabel",
        "h1",
        "h2",
        "mimeType",
        "lastIndexed",
        "hierarchical_categories",
      ],
      attributesToHighlight: ["title", "h1", "snippet"],
      attributesToSnippet: ["body:50", "snippet:80"],
    },
  });

  console.log(`Done! Indexed ${transformed.length} records to ${INDEX_NAME}`);

  // Create or update the composition
  console.log(`Creating/updating composition (${COMPOSITION_ID})...`);
  const compositionResponse = await fetch(
    `https://${TARGET_APP_ID}.algolia.net/1/compositions/${COMPOSITION_ID}`,
    {
      method: "PUT",
      headers: {
        "x-algolia-application-id": TARGET_APP_ID,
        "x-algolia-api-key": TARGET_ADMIN_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        objectID: COMPOSITION_ID,
        name: "GenCat Content Composition",
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

main().catch(console.error);
