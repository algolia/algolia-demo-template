import "dotenv/config";
import { writeFileSync } from "fs";
import * as XLSX from "xlsx";
import { algoliasearch } from "algoliasearch";

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = "eu_health_claims";
const XLS_PATH = "data/EU_Register_on_nutrition_and_health_claims.xls";
const CSV_OUTPUT_PATH = "data/EU_Register_on_nutrition_and_health_claims.csv";

interface HealthClaimRecord {
  objectID: string;
  claimType: string;
  nutrientOrFood: string;
  claim: string;
  conditionsOfUse: string;
  healthRelationship: string;
  efsaOpinionReference: string;
  commissionRegulation: string;
  status: string;
  entryId: string;
  isAuthorized: boolean;
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  // Normalize whitespace and line breaks
  return text.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

function transformRow(row: unknown[], index: number): HealthClaimRecord | null {
  const claimType = cleanText(row[0]);
  const claim = cleanText(row[2]);

  // Skip empty rows or header row
  if (!claimType && !claim) return null;
  if (claimType === "Claim type") return null;

  const status = cleanText(row[7]);

  return {
    objectID: `health-claim-${index}`,
    claimType,
    nutrientOrFood: cleanText(row[1]),
    claim,
    conditionsOfUse: cleanText(row[3]),
    healthRelationship: cleanText(row[4]),
    efsaOpinionReference: cleanText(row[5]),
    commissionRegulation: cleanText(row[6]),
    status,
    entryId: cleanText(row[8]),
    isAuthorized: status.toLowerCase() === "authorised",
  };
}

function convertToCsv(data: unknown[][]): string {
  const headers = [
    "Claim Type",
    "Nutrient/Food",
    "Claim",
    "Conditions of Use",
    "Health Relationship",
    "EFSA Opinion Reference",
    "Commission Regulation",
    "Status",
    "Entry ID",
  ];

  const escapeField = (field: unknown): string => {
    const str = cleanText(field);
    // If field contains comma, newline, or quote, wrap in quotes and escape quotes
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [headers.map(escapeField).join(",")];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const claimType = cleanText(row[0]);
    const claim = cleanText(row[2]);
    if (!claimType && !claim) continue;

    const csvRow = [
      escapeField(row[0]),
      escapeField(row[1]),
      escapeField(row[2]),
      escapeField(row[3]),
      escapeField(row[4]),
      escapeField(row[5]),
      escapeField(row[6]),
      escapeField(row[7]),
      escapeField(row[8]),
    ].join(",");

    rows.push(csvRow);
  }

  return rows.join("\n");
}

async function main() {
  console.log(`Reading XLS file: ${XLS_PATH}...`);
  const workbook = XLSX.readFile(XLS_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  console.log(`Found ${data.length} rows in spreadsheet`);

  // Convert to CSV and save
  console.log(`Converting to CSV: ${CSV_OUTPUT_PATH}...`);
  const csv = convertToCsv(data);
  writeFileSync(CSV_OUTPUT_PATH, csv, "utf-8");
  console.log("CSV file saved");

  // Transform to Algolia records
  console.log("Transforming records for Algolia...");
  const records: HealthClaimRecord[] = [];
  let skipped = 0;

  for (let i = 0; i < data.length; i++) {
    const record = transformRow(data[i], i);
    if (record) {
      records.push(record);
    } else {
      skipped++;
    }
  }

  console.log(`Transformed ${records.length} records (skipped ${skipped} empty/header rows)`);

  // Count by status
  const statusCounts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log("Records by status:", statusCounts);

  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    console.error("Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY");
    console.log("Skipping Algolia indexing. CSV file was still created.");
    return;
  }

  console.log(`Connecting to Algolia (App: ${ALGOLIA_APP_ID}, Index: ${INDEX_NAME})...`);
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

  console.log("Indexing records in batches...");
  const BATCH_SIZE = 1000;
  let indexed = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await client.saveObjects({
      indexName: INDEX_NAME,
      objects: batch,
    });
    indexed += batch.length;
    console.log(`Indexed ${indexed}/${records.length} records`);
  }

  console.log("Configuring index settings...");
  await client.setSettings({
    indexName: INDEX_NAME,
    indexSettings: {
      searchableAttributes: [
        "unordered(nutrientOrFood)",
        "unordered(claim)",
        "unordered(healthRelationship)",
        "unordered(conditionsOfUse)",
      ],
      attributesForFaceting: [
        "searchable(claimType)",
        "searchable(healthRelationship)",
        "isAuthorized",
        "searchable(nutrientOrFood)",
        "searchable(status)",
      ],
      customRanking: ["desc(isAuthorized)"],
      ignorePlurals: ["en"],
      indexLanguages: ["en"],
      queryLanguages: ["en"],
      removeStopWords: ["en"],
      removeWordsIfNoResults: "allOptional",
      attributesToRetrieve: [
        "objectID",
        "claimType",
        "nutrientOrFood",
        "claim",
        "conditionsOfUse",
        "healthRelationship",
        "efsaOpinionReference",
        "commissionRegulation",
        "status",
        "entryId",
        "isAuthorized",
      ],
      attributesToHighlight: ["claim", "nutrientOrFood", "healthRelationship"],
      attributesToSnippet: ["conditionsOfUse:100"],
    },
  });

  console.log(`Done! Indexed ${records.length} health claims to ${INDEX_NAME}`);
}

main().catch(console.error);
