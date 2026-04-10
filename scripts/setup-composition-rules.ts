/**
 * Setup Composition Rules for Retail Media
 *
 * Creates composition rules (smart groups) that inject sponsored products into
 * search results. Each rule has conditions (query/filter triggers) and a
 * consequence that injects products at specific positions.
 *
 * The `key` on each injectedItem becomes the `injectedItemKey` in
 * `_rankingInfo.composed[compositionID]`, which the frontend parses to
 * determine the visualization (carousel, inline, or banner).
 *
 * API: POST /1/compositions/{compositionID}/rules/batch
 * Docs: https://www.algolia.com/doc/rest-api/composition/save-rules
 *
 * Usage:
 *   pnpm tsx scripts/setup-composition-rules.ts
 *
 * Prerequisites:
 *   - ALGOLIA_ADMIN_API_KEY set in .env
 *   - Index already populated with product data
 *   - Composition already created (by scripts/index-data.ts)
 *
 * PRODUCTION NOTE: In a real retail media platform, composition rules would be
 * managed dynamically via a campaign management API. Rules would have:
 * - Start/end dates (campaign flight via `validity` field)
 * - Budget caps and pacing
 * - Frequency capping per user
 * - Bid-based priority (higher CPM wins the placement)
 * - Real-time impression/click tracking for billing
 */
import "dotenv/config";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";
import {
  RETAIL_MEDIA_RULES,
  RetailMediaRule,
} from "../lib/demo-config/retail-media";

const APP_ID = ALGOLIA_CONFIG.APP_ID;
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = ALGOLIA_CONFIG.INDEX_NAME;
const COMPOSITION_ID =
  ALGOLIA_CONFIG.COMPOSITION_ID || `${INDEX_NAME}_composition`;

// Position mapping: carousel at top (0), inline early (2), banner after first row (4)
const POSITION_MAP: Record<string, number> = {
  carousel: 0,
  inline: 2,
  banner: 4,
};

/**
 * Build the consequence (injection config) shared by all rules from the same
 * retail media rule definition.
 */
function buildConsequence(rule: RetailMediaRule) {
  return {
    behavior: {
      injection: {
        main: {
          source: {
            search: {
              index: INDEX_NAME,
            },
          },
        },
        injectedItems: [
          {
            key: `${rule.placement}:${rule.label}`,
            source: {
              search: {
                index: INDEX_NAME,
                params: {
                  filters: rule.source.filters,
                },
              },
            },
            position: POSITION_MAP[rule.placement] ?? 0,
            length: rule.source.hitsPerPage,
            metadata: {
              hits: {
                addItemKey: true,
              },
            },
          },
        ],
        deduplication: {
          positioning: "highest",
        },
      },
    },
  };
}

/**
 * Build composition rules from a retail media rule definition.
 *
 * IMPORTANT: Multiple conditions in one rule are AND-joined. To support
 * OR-style triggers (fire when query matches ANY of the patterns), we create
 * one composition rule per query trigger. Each rule has a single condition
 * but the same consequence (injection config).
 *
 * The injectedItems[].key encodes "{placement}:{label}" which the frontend
 * parses in lib/retail-media.ts to choose the visualization component.
 */
function buildCompositionRules(rule: RetailMediaRule) {
  const consequence = buildConsequence(rule);
  const rules: Array<{ action: "upsert"; body: Record<string, unknown> }> = [];

  // Create one rule per query trigger (OR semantics)
  if (rule.trigger.queryContains && rule.trigger.queryContains.length > 0) {
    for (let i = 0; i < rule.trigger.queryContains.length; i++) {
      const query = rule.trigger.queryContains[i];
      rules.push({
        action: "upsert",
        body: {
          objectID: `retail_media_${rule.name}_q${i}`,
          description: `${rule.description} (trigger: "${query}")`,
          enabled: true,
          conditions: [{ pattern: query, anchoring: "contains" }],
          consequence,
          tags: ["retail-media", rule.placement],
        },
      });
    }
  }

  // Filter-based trigger gets its own rule
  if (rule.trigger.filterMatch) {
    rules.push({
      action: "upsert",
      body: {
        objectID: `retail_media_${rule.name}_f0`,
        description: `${rule.description} (trigger: filter)`,
        enabled: true,
        conditions: [{ filters: rule.trigger.filterMatch }],
        consequence,
        tags: ["retail-media", rule.placement],
      },
    });
  }

  // Context-based trigger (segment matching via ruleContexts)
  if (rule.trigger.context) {
    rules.push({
      action: "upsert",
      body: {
        objectID: `retail_media_${rule.name}_ctx`,
        description: `${rule.description} (trigger: context=${rule.trigger.context})`,
        enabled: true,
        conditions: [{ context: rule.trigger.context }],
        consequence,
        tags: ["retail-media", rule.placement, "segment"],
      },
    });
  }

  // Fallback: no triggers = fires on all queries
  if (rules.length === 0) {
    rules.push({
      action: "upsert",
      body: {
        objectID: `retail_media_${rule.name}`,
        description: rule.description,
        enabled: true,
        conditions: [{}],
        consequence,
        tags: ["retail-media", rule.placement],
      },
    });
  }

  return rules;
}

async function main() {
  if (!ADMIN_KEY) {
    console.error("Missing ALGOLIA_ADMIN_API_KEY in .env");
    process.exit(1);
  }

  console.log(`App ID:       ${APP_ID}`);
  console.log(`Index:        ${INDEX_NAME}`);
  console.log(`Composition:  ${COMPOSITION_ID}`);
  console.log(`Rules:        ${RETAIL_MEDIA_RULES.length}`);
  console.log();

  // First, delete old single-condition rules (from previous runs)
  const deleteRequests = RETAIL_MEDIA_RULES.map((rule) => ({
    action: "delete" as const,
    body: { objectID: `retail_media_${rule.name}` },
  }));

  const requests: Array<{ action: string; body: Record<string, unknown> }> = [
    ...deleteRequests,
  ];

  for (const rule of RETAIL_MEDIA_RULES) {
    const compositionRules = buildCompositionRules(rule);
    requests.push(...compositionRules);

    console.log(`  [${rule.placement}] ${rule.name} → "${rule.placement}:${rule.label}"`);
    console.log(`    Position: ${POSITION_MAP[rule.placement] ?? 0}, Length: ${rule.source.hitsPerPage}`);
    console.log(`    Filters: ${rule.source.filters}`);
    console.log(`    Rules created: ${compositionRules.length} (one per trigger)`);
    if (rule.trigger.queryContains) {
      console.log(`    Trigger queries: ${rule.trigger.queryContains.join(", ")}`);
    }
    if (rule.trigger.filterMatch) {
      console.log(`    Trigger filter: ${rule.trigger.filterMatch}`);
    }
    console.log();
  }

  console.log("Saving composition rules...");
  const res = await fetch(
    `https://${APP_ID}.algolia.net/1/compositions/${COMPOSITION_ID}/rules/batch`,
    {
      method: "POST",
      headers: {
        "x-algolia-application-id": APP_ID,
        "x-algolia-api-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed (${res.status}): ${text}`);
    process.exit(1);
  }

  const result = await res.json();
  console.log("Composition rules saved successfully!");
  console.log(`  taskID: ${result.taskID}`);
  console.log();
  console.log("Rules configured:");
  for (const rule of RETAIL_MEDIA_RULES) {
    console.log(
      `  ✓ retail_media_${rule.name} [${rule.placement}:${rule.label}]`
    );
  }
  console.log();
  console.log(
    `View in Merchandising Studio: https://dashboard.algolia.com/apps/${APP_ID}/compositions`
  );
}

main().catch((error) => {
  console.error("Error setting up composition rules:", error);
  process.exit(1);
});
