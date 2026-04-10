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

If you're pulling from an existing Algolia index, you can use:

```bash
pnpm tsx scripts/download-index.ts
```

This browses an existing Algolia index and saves all records to `data/products.json`.

## 8. Index Products (with NeuralSearch)

```bash
pnpm tsx scripts/index-data.ts [path/to/products.json]
```

If no path is given, defaults to `data/products.json`.

This script will:
1. Index all records to Algolia
2. Configure searchable attributes, facets, and ranking
3. **Configure NeuralSearch** — enables semantic search on the index using the `neuralSearchMode: "active"` setting with custom attribute weights
4. Create/update the Composition (uses `COMPOSITION_ID` from config, or derives one from the index name)

### Searchable Attributes Format

When configuring searchable attributes in the indexing script, note the format:

- `"name,brand"` — Comma-separated attributes on the same line share the **same priority level** (tied ranking)
- `"description"` — A single attribute on its own line is a distinct priority level
- `unordered("attribute")` — Disables word position ranking within that attribute (useful for long-form text like descriptions)

Example:
```ts
searchableAttributes: [
  "name,brand",           // Priority 1: name and brand (tied)
  "categories",           // Priority 2
  unordered("description") // Priority 3: word position doesn't matter
]
```

### NeuralSearch Configuration

NeuralSearch is configured during indexing via the Algolia REST API (`/1/indexes/{indexName}/settings`). The indexing script sets:

- **neuralSearchMode** — `"active"` to enable semantic search
- **neuralSearchAttributes** — Which attributes to use for semantic understanding (typically `name`, `brand`, `categories`, `description`)
- **neuralSearchPreset** — `"custom"` for fine-grained control over attribute weights
- **enableNeuralSearchSortBy** — Enables sorting by neural relevance

This means NeuralSearch is ready out of the box after running the indexing script. No manual Dashboard configuration needed.

## 9. Index Articles (Optional)

```bash
pnpm tsx scripts/index-articles.ts [path/to/articles.json]
```

This indexes article/content records (blog posts, guides, FAQs) into a separate `_articles` index alongside your product index. The script:

1. Indexes articles with dedup (prevents duplicate content from multiple URLs)
2. Configures searchable attributes optimized for content (title, body, tags)
3. Creates a separate composition for article search

Articles appear in autocomplete and can be surfaced by the AI agent via the `showArticles` tool.

## 10. Set Up Retail Media

```bash
pnpm tsx scripts/setup-composition-rules.ts
```

This creates composition rules that power the retail media pipeline. Rules are defined in `lib/demo-config/retail-media.ts` and support three placement types:

- **Carousel** — Sponsored product carousel at the top of search results
- **Inline** — Sponsored products injected into the search result grid
- **Banner** — Cross-sell or promotional banners between result rows

Each rule specifies trigger conditions (query patterns, category context, user segments) and the sponsored products to display. The script converts these into Algolia composition rules with tagged metadata that the frontend parses to choose the correct visualization component.

## 11. Set Up Click & Collect

### Store Data

```bash
pnpm tsx scripts/index-stores.ts [path/to/stores.json]
```

Indexes store location data with `_geoloc` coordinates for proximity search. Each store record includes name, address, coordinates, and opening hours.

To enrich store data with geocoded coordinates:

```bash
pnpm tsx scripts/enrich-stores.ts
```

### How It Works

- **Store finder** — Users select a preferred store via the `ClickCollectProvider`
- **Availability badges** — Product cards show "Available for pickup" when the selected store has stock
- **Proximity boost** — When a store is selected, search results are boosted by geographic proximity to that store's coordinates

## 12. Set Up Recommendations

```bash
pnpm tsx scripts/setup-recommend.ts
```

This triggers training for **Related Products** and **Looking Similar** Recommend models. Training takes a few hours to complete. Once trained, recommendations appear automatically on product pages.

The script uses an undocumented internal API (the same one the Dashboard calls). Configuration:
- **Related Products** — uses content-based filtering on category, brand, and product attributes
- **Looking Similar** — uses the `primary_image` attribute for visual similarity

> **Note:** Models retrain automatically as new events come in. You can check training status at `https://dashboard.algolia.com/apps/<APP_ID>/recommend/models`.

## 13. Set Up Agents

```bash
pnpm tsx scripts/setup-agent.ts
```

Configures the AI shopping assistant via Agent Studio. The agent has access to:
- `algolia_search_index` — Server-side product search
- `addToCart` — Add products to the shopping cart (client-side)
- `showItems` — Display product recommendations (client-side)
- `showArticles` — Display article/content results (client-side)

## 14. Add Branding Assets

- Place your logo at the path configured in `lib/demo-config/index.ts` (default: `public/logo.svg`)
- Add `public/icon.png` and `public/favicon.ico`

## 15. Set Up Query Suggestions (Optional)

```bash
pnpm tsx scripts/setup-query-suggestions.ts
```

This creates a `<index_name>_query_suggestions` index that powers autocomplete. The suggestions index is rebuilt automatically by Algolia.

## 16. Configure Relevance Tests (Optional)

Edit the `TEST_CASES` array in `scripts/test-relevance.ts` to define queries with expected objectIDs and ordering. Each test case has:

- **name** — Human-readable label
- **query** — The search query to test
- **expectedIds** — objectIDs that must appear in this order in the results
- **maxPosition** — (optional) How deep to look, defaults to top 20

Run the tests with:

```bash
pnpm tsx scripts/test-relevance.ts
```

## 17. Run Development Server

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
| `lib/demo-config/agents.ts` | AI agent instructions and tools |
| `lib/demo-config/retail-media.ts` | Retail media rule definitions |
| `lib/algolia-config.ts` | Algolia app ID, API keys, index/composition/agent IDs |
| `.env` | Algolia admin API key |
