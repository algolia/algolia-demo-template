---
name: demo-data-indexing
description: 'Load product data into Algolia, train Recommend models, and set up Query Suggestions. Use when indexing products from a JSON/CSV file, downloading from an existing Algolia index, or after scraping with /demo-scrape.'
---

# Demo Data Indexing

Load product data into Algolia and configure search features (Recommend models, Query Suggestions).

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

## Step 1.5: Analyze & Prepare Data Structure (recommended)

Invoke `/data-structure` to analyze the data against the Product interface and generate transform/enrich functions in `scripts/index-data.ts`.

Skip if:
- Data is already in the expected Product format (e.g., downloaded from this template's own index)
- The user explicitly says the data is ready as-is
- `transformRecords()` and `enrichRecords()` in `scripts/index-data.ts` are already populated

## Step 2: Index Data

```bash
pnpm tsx scripts/index-data.ts [path/to/products.json]
```

Default path is `data/products.json`. The script:
- Reads the JSON file and indexes products in batches of 1000
- Automatically populates `categoryPageId` (flat array of all ancestor category paths) from `hierarchical_categories`
- Configures index settings: searchable attributes, faceting, custom ranking, etc.
- Creates or updates the Composition API configuration (`<INDEX_NAME>_composition`)

## Step 3: Setup Recommend Models

```bash
pnpm tsx scripts/setup-recommend.ts
```

Trains two Algolia Recommend models (takes minutes to hours depending on data size):
- **Related Products** — content-based filtering using `hierarchical_categories.lvl0`, `brand`, `gender`
- **Looking Similar** — image-based similarity using `primary_image`

## Step 4: Setup Query Suggestions

```bash
pnpm tsx scripts/setup-query-suggestions.ts
```

Configures Query Suggestions from index facet data (no event tracking required). Mines facet values from: brand, categories (lvl0/lvl1), gender, color, and combinations thereof.

Creates index: `<INDEX_NAME>_query_suggestions`.

## Does NOT Run

This skill does NOT run `scripts/setup-agent.ts`. Agent setup is a separate concern — use `/demo-agent-setup` for that.

## Output Report

When done, report ALL of the following to the user:

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

- If indexing fails, verify `ALGOLIA_ADMIN_API_KEY` is set in `.env`
- If Composition creation fails, verify `APP_ID` and `INDEX_NAME` in `lib/algolia-config.ts`
