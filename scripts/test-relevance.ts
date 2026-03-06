import "dotenv/config";
import { compositionClient } from "@algolia/composition";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const client = compositionClient(
  ALGOLIA_CONFIG.APP_ID,
  ALGOLIA_CONFIG.SEARCH_API_KEY
);
const COMPOSITION_ID = ALGOLIA_CONFIG.COMPOSITION_ID;

// ---------------------------------------------------------------------------
// Test cases
//
// Each test case is a query with an ordered list of expected objectIDs.
// The test checks that those IDs appear in the results in the specified order
// (they don't need to be contiguous — other results can appear between them).
// ---------------------------------------------------------------------------

interface TestCase {
  /** Human-readable label for the test */
  name: string;
  /** The search query to send */
  query: string;
  /** objectIDs that must appear in order within the results */
  expectedIds: string[];
  /** Optional: max position (0-indexed) the *last* expected ID can appear at.
   *  Defaults to 19 (top 20 results). */
  maxPosition?: number;
}

const TEST_CASES: TestCase[] = [
  // ── Add your test cases below ──────────────────────────────────────────
  // Example:
  // {
  //   name: "Red dress query",
  //   query: "red dress",
  //   expectedIds: ["12345", "67890"],
  //   maxPosition: 9, // must appear within the top 10
  // },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

interface TestResult {
  name: string;
  query: string;
  passed: boolean;
  details: string;
}

async function runTest(tc: TestCase): Promise<TestResult> {
  const maxPos = tc.maxPosition ?? 19;
  const hitsPerPage = maxPos + 1;

  const response = await client.search({
    compositionID: COMPOSITION_ID,
    requestBody: {
      params: {
        query: tc.query,
        hitsPerPage,
      },
    },
  });

  const hits = (response.hits ?? []) as Array<{ objectID: string }>;
  const returnedIds = hits.map((h) => h.objectID);

  // Check that every expected ID appears, and in order
  let lastFoundIndex = -1;
  const missing: string[] = [];
  const outOfOrder: string[] = [];

  for (const expectedId of tc.expectedIds) {
    const idx = returnedIds.indexOf(expectedId);
    if (idx === -1) {
      missing.push(expectedId);
    } else if (idx <= lastFoundIndex) {
      outOfOrder.push(expectedId);
    } else {
      lastFoundIndex = idx;
    }
  }

  const passed = missing.length === 0 && outOfOrder.length === 0;

  let details = "";
  if (missing.length > 0) {
    details += `Missing from top ${hitsPerPage}: ${missing.join(", ")}. `;
  }
  if (outOfOrder.length > 0) {
    details += `Out of order: ${outOfOrder.join(", ")}. `;
  }
  if (passed) {
    details = `All ${tc.expectedIds.length} IDs found in order within top ${hitsPerPage}.`;
  }

  // Always show what came back for debugging
  details += ` Returned: [${returnedIds.join(", ")}]`;

  return { name: tc.name, query: tc.query, passed, details };
}

async function main() {
  if (TEST_CASES.length === 0) {
    console.log(
      "No test cases defined. Edit TEST_CASES in scripts/test-relevance.ts to add tests."
    );
    process.exit(0);
  }

  console.log(
    `Running ${TEST_CASES.length} relevance test(s) against composition "${COMPOSITION_ID}"...\n`
  );

  const results: TestResult[] = [];
  for (const tc of TEST_CASES) {
    const result = await runTest(tc);
    results.push(result);
  }

  // Print results
  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    const icon = r.passed ? "PASS" : "FAIL";
    console.log(`[${icon}] ${r.name}`);
    console.log(`       Query: "${r.query}"`);
    console.log(`       ${r.details}\n`);
    if (r.passed) passCount++;
    else failCount++;
  }

  console.log("─".repeat(60));
  console.log(
    `Results: ${passCount} passed, ${failCount} failed, ${results.length} total`
  );

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Relevance test error:", err);
  process.exit(1);
});
