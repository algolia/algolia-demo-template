# New Demo Setup Guide

Follow these steps to configure this template for a new demo or customer.

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Configure Brand & Locale

Edit `lib/demo-config/index.ts`:

- **brand.name** — Store name shown in title bar and metadata
- **brand.tagline** — Subtitle / meta description
- **brand.logoUrl** — Path to logo (place in `public/` or use external URL)
- **brand.logoWidth / logoHeight** — Logo dimensions
- **brand.agentName** — Name shown in AI assistant header
- **locale.language** — HTML lang attribute (e.g. `"en"`, `"es"`, `"it"`)
- **locale.currency / currencySymbol** — Currency code and symbol for price formatting
- **imageDomains** — Remote image domains for Next.js `<Image>` (see step 6)

## 3. Configure Categories

Edit `lib/demo-config/categories.ts`:

- Define your category tree in `HIERARCHICAL_CATEGORIES`
- Each root category needs: `name`, `slug`, `icon` (Lucide icon component), and optional `children`
- Map category icons in `CATEGORY_ICONS` for the filters sidebar

## 4. Configure Demo Users

Edit `lib/demo-config/users.ts`:

- Define user profiles in `users` array with preference scores
- Update `PREFERENCE_METADATA` to map your facet names to display labels

## 5. Configure Agent Instructions

Edit `lib/demo-config/agents.ts`:

- Customize agent instructions for the main shopping assistant
- Update `indexDescription` with your actual category values and filterable fields

## 6. Configure Image Domains

Product images are loaded via Next.js `<Image>`, which requires explicit allowlisting of remote hostnames.

Edit the `imageDomains` array in `lib/demo-config/index.ts`:

```ts
imageDomains: [
  { protocol: "https" as const, hostname: "cdn.example.com" },
],
```

**How to find the right hostname:** look at a product's image URL in your data (e.g. `primary_image` field in `data/products.json`). Extract the hostname and add it here. If images come from multiple CDNs, add all of them.

> **If you skip this step**, product images will fail to load and Next.js will log an error like:
> `hostname "..." is not configured under images in your next.config.js`

## 7. Add Product Data

Place your product data as JSON in `data/products.json`. Each record should already be in the shape you want indexed to Algolia (with `objectID` as the primary key).

If you're pulling from an existing Algolia index, you can use a download script like:

```ts
// scripts/download-index.ts (one-time use, gitignored)
import "dotenv/config";
import { algoliasearch } from "algoliasearch";
import { writeFileSync, mkdirSync } from "fs";

const client = algoliasearch("YOUR_APP_ID", process.env.ALGOLIA_ADMIN_API_KEY!);
const records: Record<string, unknown>[] = [];

await client.browseObjects({
  indexName: "your_source_index",
  browseParams: { hitsPerPage: 1000 },
  aggregator: (response) => records.push(...response.hits as any[]),
});

mkdirSync("data", { recursive: true });
writeFileSync("data/products.json", JSON.stringify(records, null, 2));
```

## 8. Index Products

```bash
pnpm tsx scripts/index-data.ts [path/to/products.json]
```

If no path is given, defaults to `data/products.json`.

This script will:
1. Index all records to Algolia
2. Configure searchable attributes, facets, and ranking
3. Create/update the Composition (uses `COMPOSITION_ID` from config, or derives one from the index name)

### Searchable Attributes Format

When configuring `searchableAttributes` in `scripts/index-data.ts`:

- **Same-priority attributes**: comma-separate in ONE string (e.g., `"attr1, attr2, attr3"`). They are unordered by default — do NOT wrap each in `unordered()` inside a comma-separated string, as this breaks Algolia's parsing.
- **Single attributes**: use `unordered(attr)` to disable word-position ranking within that attribute.

```typescript
// ✅ Correct
"searchable_categories.lvl0, searchable_categories.lvl1, searchable_categories.lvl2",
"unordered(brand)",

// ❌ Wrong — breaks Algolia parsing
"unordered(attr1), unordered(attr2), unordered(attr3)",
```

## 9. Set Up Recommendations

```bash
pnpm tsx scripts/setup-recommend.ts
```

This triggers training for **Related Products** and **Looking Similar** Recommend models. Training takes a few hours to complete. Once trained, recommendations appear automatically on product pages.

The script uses an undocumented internal API (the same one the Dashboard calls). Configuration:
- **Related Products** — uses content-based filtering on category, brand, and gender
- **Looking Similar** — uses the `primary_image` attribute for visual similarity

> **Note:** Models retrain automatically as new events come in. You can check training status at `https://dashboard.algolia.com/apps/<APP_ID>/recommend/models`.

## 10. Set Up Agents

```bash
pnpm tsx scripts/setup-agent.ts
```

## 11. Add Branding Assets

- Place your logo at the path configured in `lib/demo-config/index.ts` (default: `public/logo.svg`)
- Add `public/icon.png` and `public/favicon.ico`

## 12. Set Up Query Suggestions (optional)

```bash
pnpm tsx scripts/setup-query-suggestions.ts
```

This creates a `<index_name>_query_suggestions` index (e.g. `fashion_ns_query_suggestions`) that powers autocomplete. The suggestions index is rebuilt automatically by Algolia.

## 13. Configure Relevance Tests (optional)

Edit the `TEST_CASES` array in `scripts/test-relevance.ts` to define queries with expected objectIDs and ordering. Each test case has:

- **name** — Human-readable label
- **query** — The search query to test
- **expectedIds** — objectIDs that must appear in this order in the results
- **maxPosition** — (optional) How deep to look, defaults to top 20

Run the tests with:

```bash
pnpm tsx scripts/test-relevance.ts
```

## 14. Run Development Server

```bash
pnpm dev
```

Visit http://localhost:3000 to see the demo.

## Quick Reference: Config Files

| File | Purpose |
|------|---------|
| `lib/demo-config/index.ts` | Brand, locale, image domains |
| `lib/demo-config/categories.ts` | Category tree and icons |
| `lib/demo-config/users.ts` | Demo user profiles and preference metadata |
| `lib/demo-config/agents.ts` | AI agent instructions |
| `lib/algolia-config.ts` | Algolia app ID, API keys, index/composition/agent IDs |
| `.env` | Algolia admin API key |
