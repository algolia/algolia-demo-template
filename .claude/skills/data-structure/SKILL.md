---
name: data-structure
description: 'Analyze product data structure against the Product interface and demo discovery brief, suggest field mappings and enrichments, and generate transform/enrich functions in scripts/index-data.ts. Use after /demo-discovery and before /demo-data-indexing when preparing raw product data.'
---

# Data Structure Analysis & Transformation

Analyze raw product data, suggest mappings and enrichments, and generate transform/enrich code in `scripts/index-data.ts`.

## Prerequisites

- `data/products.json` exists (or user-specified data file)
- Dependencies installed (`pnpm install`)
- `scripts/index-data.ts` has the `transformRecords()` and `enrichRecords()` placeholder functions
- Ideally, a demo discovery brief from `/demo-discovery` (but can run standalone)

## Phase 0: Load & Sample Data

1. Read `data/products.json` (or user-specified file) — sample the first 3-5 records to understand the structure
2. Read `lib/types/product.ts` for the target Product interface
3. Read `scripts/index-data.ts` to see current transform/enrich state
4. If a discovery brief was produced by `/demo-discovery`, use its **Data Requirements** section to prioritize the analysis

## Phase 1: Analyze

Produce a structured report with 4 sections.

### Section A — Critical Fields

These 6 fields are required for the UI to function. If any are missing, the demo will break.

| Expected Field | Source Field | Status | Action Needed |
|---|---|---|---|
| `objectID` | ? | Present / Mappable / Missing | — / Rename from `id` / Generate UUID |
| `name` | ? | Present / Mappable / Missing | — / Rename from `title` / ... |
| `primary_image` | ? | Present / Mappable / Missing | — / Rename from `image` / ... |
| `price.value` | ? | Present / Mappable / Missing | — / Wrap flat number in `{ value: N }` / ... |
| `brand` | ? | Present / Mappable / Missing | — / Rename from `manufacturer` / ... |
| `description` | ? | Present / Mappable / Missing | — / Rename from `body_html` / ... |

For each field, show the actual source field name and a sample value.

### Section B — Important Secondary Fields

Same format for fields that enhance specific features:

- `hierarchical_categories` (object: `{ lvl0, lvl1, lvl2 }`) — needed for category navigation, Recommend CBF, Query Suggestions
- `color.filter_group` + `color.original_name` — needed for color swatches
- `available_sizes` (string[]) — needed for size filtering
- `image_urls` (string[]) — needed for product page image gallery
- `gender` (string) — needed for faceting, Recommend CBF
- `discount_rate` (number) — needed for sale badges
- `reviews` (`{ bayesian_avg, count, rating }`) — needed for review display and ranking
- `variants` (array) — needed for color variant swatches
- `slug` (string) — URL-safe identifier
- `sku` (string) — product SKU display

If a discovery brief exists, **prioritize fields flagged in its data requirements**.

### Section C — Business/Ranking Fields

These drive custom ranking and merchandising. Often absent in raw data.

- `sales_last_24h` / `sales_last_7d` / `sales_last_30d` / `sales_last_90d` — popularity ranking
- `margin` — profit margin for business-aware ranking
- `product_aov` — average order value

Note: these can be **synthesized** with deterministic pseudo-random values seeded from `objectID` for demo purposes.

### Section D — Enrichment Opportunities

Based on what's present in the data + discovery brief needs, suggest AI-generated fields:

- `keywords` — extract search keywords from name + description + categories
- `semantic_attributes` — natural language product summary for NeuralSearch / semantic search
- `image_description` — describe the primary product image
- `gender` inference — from categories or product name if not explicitly present
- Custom enrichments specific to the vertical/use case

For each, explain the value it adds to the demo.

## Phase 2: Present Findings & Gather Input

Present ALL sections from Phase 1, then ask consolidated questions:

```
Here's my analysis of the data against the Product interface:

[Sections A-D]

Questions:

1. **Transform**: Should I generate field mappings for items marked "Mappable"? (Y/n)

2. **Missing critical fields**: How should I handle these?
   - [ ] Synthesize with realistic demo data
   - [ ] Leave empty / null (index as-is)
   - [ ] Enrich via AI

3. **Business metrics**: Synthesize sales/margin data for custom ranking? (Y/n)

4. **Enrichments** — which would you like? (select all that apply)
   - [ ] keywords extraction
   - [ ] semantic_attributes generation
   - [ ] image_description generation
   - [ ] Other: ___

5. **Enrichment source**:
   - [ ] OpenAI structured outputs (requires OPENAI_API_KEY in .env)
   - [ ] Other API / source: ___

6. **Anything else** to transform or enrich?
```

**WAIT for user response before proceeding.**

## Phase 3: Generate `transformRecords()`

Populate the `transformRecords()` function in `scripts/index-data.ts` based on the analysis:

- Map source field names → expected field names (e.g., `record.title` → `name`)
- Restructure nested fields (e.g., flat `price: 29.99` → `price: { value: 29.99 }`)
- Build `hierarchical_categories` from flat category data if needed (e.g., split breadcrumb strings on ` > `)
- Build `color` object from flat color string if needed (`{ filter_group, original_name }`)
- Generate `slug` from `name` if missing (lowercase, replace spaces with hyphens, strip special chars)
- Generate `sku` from `objectID` if missing
- Synthesize business metrics if requested — use deterministic pseudo-random seeded from `objectID`:

```typescript
// Deterministic pseudo-random from objectID for reproducible demo data
function seedRandom(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) / 2147483647;
}
```

The function must be **pure** (no async, no external calls) and operate via `.map()`.

## Phase 4: Generate `enrichRecords()`

If enrichment was requested:

### 4.1: Install dependencies

```bash
pnpm add openai zod    # if using OpenAI structured outputs
```

### 4.2: Verify API key

Check that `OPENAI_API_KEY` is set in `.env`. If not, prompt the user to add it.

### 4.3: Populate the function

Populate `enrichRecords()` in `scripts/index-data.ts`:

1. **Define Zod schema** for the enriched fields:
```typescript
import { z } from "zod";
const EnrichedFields = z.object({
  keywords: z.array(z.string()).describe("Search keywords extracted from product attributes"),
  semantic_attributes: z.string().describe("Natural language product summary for semantic search"),
  // ... other fields based on user selections
});
```

2. **Process in batches** (50 records at a time for API rate limits)

3. **Use OpenAI structured outputs**:
```typescript
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI(); // reads OPENAI_API_KEY from env

for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(async (record) => {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Extract structured product data:\n${JSON.stringify(record, null, 2)}`
      }],
      response_format: zodResponseFormat(EnrichedFields, "enriched_product"),
    });
    record._enriched = completion.choices[0].message.parsed;
    // Promote enriched fields to top level
    Object.assign(record, record._enriched);
  }));
  console.log(`Enriched ${Math.min(i + BATCH_SIZE, records.length)}/${records.length} records...`);
}
```

4. **Handle errors gracefully** — skip failed records with a warning, don't abort the whole batch

5. **Log progress** — `Enriched 50/1794 records...`

**Alternative enrichment sources:** If OpenAI is not the chosen source, adapt the pattern for the user's preferred API. The `_enriched` namespace and batch processing pattern remain the same.

## Phase 5: Update Index Settings (if needed)

If new attributes were added via transform or enrich, update the settings object in `scripts/index-data.ts`:

- **`searchableAttributes`** — add enriched text fields (e.g., `keywords`, `semantic_attributes`)
- **`attributesForFaceting`** — add new filterable attributes
- **`attributesToRetrieve`** — add any new fields that the frontend needs
- **`customRanking`** — add synthesized business metrics if applicable

Only modify settings that changed — don't rewrite the entire settings block.

## Phase 6: Validate

1. **Sample run** — run the transform + enrich on the data (or a sample if large) to verify output looks correct
2. **Show samples** — present 2-3 transformed + enriched records to the user for review
3. **Report**:

```
Data structure analysis complete!

  Records:       1,794
  Transforms:    12 field mappings applied
  Enrichments:   3 AI-generated fields (keywords, semantic_attributes, image_description)
  Business data: Synthesized (sales_last_24h/7d/30d/90d, margin, product_aov)

  Next step: Run /demo-data-indexing to index the prepared data
```

## Does NOT Run

This skill does NOT index data into Algolia. It only generates the transform/enrich functions. Use `/demo-data-indexing` after this skill to actually index.

## Error Handling

- If `data/products.json` doesn't exist, tell the user to get data first (`/demo-scrape` or provide a file)
- If `transformRecords()` / `enrichRecords()` don't exist in `scripts/index-data.ts`, add them (they should be there as placeholders)
- If OpenAI enrichment fails partway through, report how many records succeeded and offer to retry the failures
- If the data has no obvious mapping for a critical field, flag it clearly and ask the user how to handle it
