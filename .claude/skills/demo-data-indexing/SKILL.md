---
name: demo-data-indexing
description: 'Analyze product data structure, generate transform/enrich code, index into Algolia, train Recommend models, and set up Query Suggestions. Use when preparing and indexing products from a JSON/CSV file, downloading from an existing Algolia index, or after scraping with /demo-scrape.'
---

# Demo Data Indexing

Analyze raw product data, generate transform/enrich code, load into Algolia, and configure search features (Recommend models, Query Suggestions).

## Prerequisites

- `.env` file has `ALGOLIA_ADMIN_API_KEY`
- `lib/algolia-config.ts` has correct `APP_ID`, `SEARCH_API_KEY`, and `INDEX_NAME`
- Dependencies installed (`pnpm install`)

## Inputs Needed

Ask the user for their data source:
- **JSON/CSV file** — provide file path
- **Existing Algolia index** — provide app ID + index name
- **Web scraping** — invoke `/demo-scrape` first
- **No data yet** — skip indexing for now

## Step 1: Get Product Data

Follow the path matching the data source:

### JSON/CSV file
```bash
mkdir -p data && cp <path_to_file> data/products.json
```

### Existing Algolia index
```bash
pnpm tsx scripts/download-index.ts
```
This downloads all records from the source index configured in the script to `data/products.json`.

### Web scraping
Invoke the `/demo-scrape` skill, which handles the full scraping workflow and saves output to `data/products.json`.

### No data
Skip — inform the user they can add data later and re-run this skill.

## Step 2: Analyze Data Structure

**Skip this step if:**
- Data is already in the expected Product format (e.g., downloaded from this template's own index)
- The user explicitly says the data is ready as-is
- `transformRecords()` and `enrichRecords()` in `scripts/index-data.ts` are already populated

### 2.0: Load & Sample Data

1. Read `data/products.json` (or user-specified file) — sample the first 3-5 records to understand the structure
2. Read `lib/types/product.ts` for the target Product interface
3. Read `scripts/index-data.ts` to see current transform/enrich state
4. If a discovery brief was produced by `/demo-discovery`, use its **Data Requirements** section to prioritize the analysis

### 2.1: Analyze

Produce a structured report with 4 sections.

#### Section A — Critical Fields

These 6 fields are required for the UI to function. If any are missing, the demo will break.

| Expected Field | Source Field | Status | Action Needed |
|---|---|---|---|
| `objectID` | ? | Present / Mappable / Missing | — / Rename from `id` / Generate UUID |
| `name` | ? | Present / Mappable / Missing | — / Rename from `title` / ... (see name guidance below) |
| `primary_image` | ? | Present / Mappable / Missing | — / Rename from `image` / ... |
| `price.value` | ? | Present / Mappable / Missing | — / Wrap flat number in `{ value: N }` / ... |
| `brand` | ? | Present / Mappable / Missing | — / Rename from `manufacturer` / ... |
| `description` | ? | Present / Mappable / Missing | — / Rename from `body_html` / ... |

For each field, show the actual source field name and a sample value.

**Name field guidance:** Check ALL candidate fields for `name`, not just the obvious one. Feeds often have multiple name fields (e.g., `name`, `display_name`, `var_display_name`, `title`, `default_name`). For each candidate, report:
- Population rate (e.g., "1139/1934 = 59%")
- Sample value
- Quality assessment (marketing-friendly vs internal/raw)

Prefer marketing-friendly display names over internal names. If a variant-level name exists (e.g., `var_display_name` with pattern "NAME - COLOR"), note that the color suffix can be stripped. Fall back through candidates in quality order, not just pick the first match.

**Price field guidance:** If price data is completely absent from the feed, flag this as a **critical gap** and present options:
- Synthesize realistic demo prices per category (marked in `_synthetic_fields`)
- Attempt to scrape real prices from the customer website
- Leave empty (breaks price display and discount badges)

#### Section B — Important Secondary Fields

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

**Field verification rule:** Before mapping any field, verify its actual content — field names are often misleading. Sample 3-5 unique values and confirm they match the expected type. Common traps:
- A "material" field that actually contains style/discipline values (e.g., "Sport Touring", "Racing")
- A "gender" field that contains compliance/regulatory data, not M/F/Unisex
- A "color" field with raw hex codes instead of names
- A "category" field with internal IDs instead of human-readable paths

Report any mismatches in the analysis.

#### Section C — Business/Ranking Fields

These drive custom ranking and merchandising. Often absent in raw data.

- `sales_last_24h` / `sales_last_7d` / `sales_last_30d` / `sales_last_90d` — popularity ranking
- `margin` — profit margin for business-aware ranking
- `product_aov` — average order value

Note: these can be **synthesized** with deterministic pseudo-random values seeded from `objectID` for demo purposes. When synthesizing any field, its name **must** be added to the record's `_synthetic_fields` string array (see Step 2.3).

#### Section D — Enrichment Opportunities

Based on what's present in the data + discovery brief needs, suggest AI-generated fields:

- `keywords` — extract search keywords from name + description + categories
- `semantic_attributes` — natural language product summary for NeuralSearch / semantic search
- `image_description` — describe the primary product image
- Custom enrichments specific to the vertical/use case

**Gender warning:** Do NOT infer gender from product names — it's unreliable and typically produces 60-70% "Unisex" defaults, making the facet nearly useless. Only map `gender` if the source data has an explicit, verified gender/audience field. If gender is needed but absent, flag it as a gap and ask the user — don't silently infer.

For each enrichment, explain the value it adds to the demo.

### 2.2: Present Findings & Gather Input

Present ALL sections from 2.1, then ask consolidated questions:

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

### 2.3: Generate `transformRecords()`

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

**`_synthetic_fields` marker (required):** Every synthesized or fabricated field must be tracked. At the end of `transformRecords()`, populate `_synthetic_fields` with the names of all fields that were generated rather than mapped from the source data:

```typescript
// Track which fields are synthetic so they're visible in the Algolia dashboard
const syntheticFields: string[] = [];
if (!sourceHasPrice) syntheticFields.push("price");
if (!sourceHasReviews) syntheticFields.push("reviews");
if (synthesizeBusinessMetrics) syntheticFields.push("sales_last_24h", "sales_last_7d", "sales_last_30d", "sales_last_90d", "margin", "product_aov");
record._synthetic_fields = syntheticFields;
```

This lets anyone browsing the index immediately understand what's real vs fabricated.

The function must be **pure** (no async, no external calls) and operate via `.map()`.

### 2.4: Generate `enrichRecords()`

If enrichment was requested:

#### Install dependencies

```bash
pnpm add openai zod    # if using OpenAI structured outputs
```

#### Verify API key

Check that `OPENAI_API_KEY` is set in `.env`. If not, prompt the user to add it.

#### Populate the function

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

### 2.5: Update Index Settings (if needed)

If new attributes were added via transform or enrich, update the settings object in `scripts/index-data.ts`.

#### Searchable Attributes (critical for relevance)

The base script has sensible defaults, but **review and adapt the order for each demo**. The order directly affects ranking — attributes higher in the list are more relevant.

**Rules** (from [Algolia docs](https://www.algolia.com/doc/guides/managing-results/must-do/searchable-attributes/how-to/configuring-searchable-attributes-the-right-way/)):
- **Tie-breaking order.** Algolia uses searchable attribute order as a tie-breaker. Short, precise attributes (brand, category, color) should rank higher because matches on them are unambiguous. Long, noisy attributes (description) should be lowest because they produce false-positive matches.
- **Compare in pairs** (insertion sort style) to decide order. Don't just list them intuitively.
- **Use `unordered()` by default.** Word position within a value rarely matters. The exception is `name` — keep it **ordered** so a match at the start of a product name ("Nike Air Max 90") ranks higher than a match in the middle.
- **Same-priority attributes go on one line**, comma-separated. This makes them equal in the attribute ranking criterion.
- **Keep it minimal.** More searchable attributes = more noise. Ask: "Would a user type this into a search box?" Don't add image URLs, IDs, or numeric fields.
- **Don't add fields that are only for filtering** (price, rating, size) — those belong in `attributesForFaceting` only.

**Default priority template for e-commerce (tie-breaking):**
```typescript
searchableAttributes: [
  // P1: Short, precise text — brand/category/color matches are unambiguous
  "unordered(brand)",
  "unordered(searchable_categories.lvl0), unordered(searchable_categories.lvl1), unordered(searchable_categories.lvl2)",
  "unordered(color.original_name), unordered(gender)",
  // P2: Product name — ordered so matches at the start rank higher
  "name",
  // P3: Exact lookups
  "unordered(sku)",
  // P4: Enriched search terms
  "unordered(keywords)",
  // P5: Long text — catches long-tail but noisy, lowest priority
  "unordered(description)",
  "unordered(semantic_attributes)",
],
```

Adapt this per demo. For example, if the vertical has a strong "material" or "collection" attribute, add it at P1 alongside brand/category. If `description` is thin or empty, drop it or remove it.

#### Other Settings

- **`attributesForFaceting`** — add new filterable attributes
- **`attributesToRetrieve`** — add any new fields that the frontend needs
- **`customRanking`** — add synthesized business metrics if applicable

Only modify settings that changed — don't rewrite the entire settings block.

### 2.6: Validate Transform/Enrich

1. **Sample run** — run the transform + enrich on the data (or a sample if large) to verify output looks correct
2. **Show samples** — present 2-3 transformed + enriched records to the user for review
3. Confirm the data looks good before proceeding to indexing

## Step 3: Index Data

```bash
pnpm tsx scripts/index-data.ts [path/to/products.json]
```

Default path is `data/products.json`. The script:
- Reads the JSON file and indexes products in batches of 1000
- Automatically populates `categoryPageId` (flat array of all ancestor category paths) from `hierarchical_categories`
- Configures index settings: searchable attributes, faceting, custom ranking, etc.
- Creates or updates the Composition API configuration (`<INDEX_NAME>_composition`)

## Step 3.5: Validate Indexed Data

After indexing completes, sample 5-10 records from the Algolia index and verify data quality:

1. **Critical field check** — for each sampled record, verify:
   - `name` is a clean, marketing-friendly product name (not an internal ID or raw code)
   - `primary_image` resolves to a valid URL
   - `price.value` is a reasonable number (not 0, not absurdly high)
   - `brand` is populated and human-readable
   - `description` is populated and not HTML/markdown

2. **Synthetic field check** — verify `_synthetic_fields` is populated on records that have fabricated data. Every synthetic field should be listed.

3. **Coverage report** — for each critical + secondary field, report the population rate:
   ```
   name:           1934/1934 (100%)
   primary_image:  1920/1934 (99%)
   price.value:    1934/1934 (100%) [SYNTHETIC]
   brand:          1934/1934 (100%)
   gender:         614/1934 (32%)  ⚠️ LOW
   reviews:        1934/1934 (100%) [SYNTHETIC]
   ```

4. **Flag issues** — any field with >30% empty/default values gets a warning. Any field where >50% of values are a single default (e.g., "Unisex") gets flagged as potentially unreliable for faceting.

If critical issues are found, ask the user before proceeding to Recommend/QS setup.

## Step 4: Setup Recommend Models

```bash
pnpm tsx scripts/setup-recommend.ts
```

Trains two Algolia Recommend models (takes minutes to hours depending on data size):
- **Related Products** — content-based filtering using `hierarchical_categories.lvl0`, `brand`, `gender`
- **Looking Similar** — image-based similarity using `primary_image`

## Step 5: Setup Query Suggestions

```bash
pnpm tsx scripts/setup-query-suggestions.ts
```

Configures Query Suggestions from index facet data (no event tracking required). Mines facet values from: brand, categories (lvl0/lvl1), gender, color, and combinations thereof.

Creates index: `<INDEX_NAME>_query_suggestions`.

## Does NOT Run

This skill does NOT run `scripts/setup-agent.ts`. Agent setup is a separate concern — use `/demo-agent-setup` for that.

## Output Report

When done, report ALL of the following to the user:

```
Data indexing complete!

  Records:       1,794
  Transforms:    12 field mappings applied
  Enrichments:   3 AI-generated fields (keywords, semantic_attributes, image_description)
  Synthetic:     price, reviews, sales_last_24h/7d/30d/90d, margin, product_aov
                 (marked in _synthetic_fields on each record)

  Image domains: cdn.example.com, images.example.com
  Categories:    12 top-level, 47 total
  Facets:        brand, color, gender, size, price

  Validation:    ✓ name clean (100%), ✓ images resolve, ⚠️ gender 32% populated
  Recommend:     Related Products + Looking Similar trained
  QS:            <INDEX_NAME>_query_suggestions created
```

Include specifically:
1. **Number of products indexed**
2. **Image domains found** — extract unique hostnames from all image URLs in the data. These need to be added to `DEMO_CONFIG.imageDomains` in `lib/demo-config/index.ts` (via `/demo-branding`).
3. **Full `hierarchical_categories` facet values** — list every unique category string at all levels:
   ```
   Women
   Women > Bottoms
   Women > Bottoms > Shorts
   Men
   Men > Tops
   Men > Tops > T-Shirts
   ```
   These are needed by `/demo-categories` to build the category navigation.
4. **Available facet attributes** — list all facet names for use by `/demo-user-profiles`

## Error Handling

- If `data/products.json` doesn't exist, tell the user to get data first (`/demo-scrape` or provide a file)
- If `transformRecords()` / `enrichRecords()` don't exist in `scripts/index-data.ts`, add them (they should be there as placeholders)
- If OpenAI enrichment fails partway through, report how many records succeeded and offer to retry the failures
- If the data has no obvious mapping for a critical field, flag it clearly and ask the user how to handle it
- If indexing fails, verify `ALGOLIA_ADMIN_API_KEY` is set in `.env`
- If Composition creation fails, verify `APP_ID` and `INDEX_NAME` in `lib/algolia-config.ts`
