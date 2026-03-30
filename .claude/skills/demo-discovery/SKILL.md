---
name: demo-discovery
description: 'Explore use cases, inspect the customer website, review similar past demos, and suggest what the demo should look like. Use before /demo-data-indexing when setting up a new demo, or when the user wants to explore what interactions and features the demo should have.'
---

# Demo Discovery

Explore what the demo should accomplish before touching data or code. Research the customer's website, review similar past demos in this repo, and produce a vision brief with visual suggestions.

## Prerequisites

- Customer name and website URL (or at least a vertical)
- Git access to this repo's branches (past demos live on feature branches)

## Phase 0: Gather Context

Ask the user ALL questions at once:

```
Let's explore what this demo should accomplish. I need some context:

1. **Customer name + website URL**: ___
2. **Who is the audience?** (e.g., "AE showing to VP of Digital", "SE doing a technical deep-dive", "self-serve trial")
3. **Key pain points or use cases** the demo should highlight:
   - [ ] Search relevance / merchandising
   - [ ] AI-powered discovery (NeuralSearch, recommendations)
   - [ ] Personalization
   - [ ] AI shopping assistant (agent)
   - [ ] Faceted navigation / filtering
   - [ ] Other: ___
4. **Vertical**: (e.g., fashion, electronics, grocery, marketplace, B2B)
5. **Any specific scenarios** to demo? (e.g., "show how a user searching for 'red dress' gets better results")
6. **Anything to preserve** from the customer's current site UX?
```

If the user already provided some of this info, skip those questions and proceed with what's known.

**WAIT for the user to respond before proceeding.**

## Phase 1: Research — Visual References

Capture screenshots to use as reference throughout the demo build. All screenshots are saved to `data/discovery/` so downstream skills (`/demo-branding`, `/demo-data-indexing`, etc.) can reference them.

```bash
mkdir -p data/discovery
```

**Use the mode that applies (A → B → C, in priority order):**

### Mode A: Customer Website Screenshots (when URL is provided)

Use `page_capture.py` to screenshot key pages on the customer's actual site:

```bash
# Homepage (full-page, no navbar) — used as the demo's hero image
python .claude/skills/demo-discovery/scripts/page_capture.py \
  --url "SITE_URL" --output "public/homepage.png" \
  --full-page --remove-navbar

# Homepage (reference copy for discovery analysis)
python .claude/skills/demo-discovery/scripts/page_capture.py \
  --url "SITE_URL" --output "data/discovery/homepage.png"

# Search results (append a generic search query to the URL)
python .claude/skills/demo-discovery/scripts/page_capture.py \
  --url "SITE_URL/search?q=shoes" --output "data/discovery/search-results.png"

# Product detail (pick a representative product URL)
python .claude/skills/demo-discovery/scripts/page_capture.py \
  --url "PRODUCT_URL" --output "data/discovery/product-detail.png"

# Category page (pick a main category URL)
python .claude/skills/demo-discovery/scripts/page_capture.py \
  --url "CATEGORY_URL" --output "data/discovery/category-page.png"
```

The `public/homepage.png` capture replaces the template placeholder and becomes the hero image shown on the demo's landing page (when no search query is active). The `--full-page` flag captures the entire scrollable page and `--remove-navbar` strips the site's navigation so it blends cleanly under the demo's own navbar.

For each capture, note:
1. **Homepage** — layout, hero, featured products/categories
2. **Search results page** — facets/filters, product display (grid/list/card), product info shown (price, ratings, colors, sizes), autocomplete behavior
3. **Product detail page** — image gallery style, product attributes displayed, recommendations section, reviews
4. **Category page** — hierarchy depth, sub-category presentation, sorting options

Capture extra screenshots if needed (mobile view, mega-menu, checkout). Name them descriptively (e.g., `mobile-search.png`, `mega-menu.png`).

### Mode B: Similar Demos & Algolia Customers (when no website URL)

If no customer website is available, pull visual references from existing implementations:

1. **Check git branches** for demos in the same vertical (branches explored further in Phase 2):
   ```bash
   git branch -a | grep -i "<vertical>"
   ```
   If matching branches have live deployments (check for Netlify URLs in commit history or READMEs), screenshot those.

2. **Find live Algolia-powered sites** in the same vertical via web search. Screenshot key pages as reference.

3. Save all reference screenshots to `data/discovery/` with descriptive names:
   ```bash
   python .claude/skills/demo-discovery/scripts/page_capture.py \
     --url "REFERENCE_URL" --output "data/discovery/ref-{source}-{page}.png"
   ```

### Mode C: User-Provided References (fallback)

If neither A nor B yields good references:

1. Ask the user for inspiration URLs, competitor sites, wireframes, or screenshots
2. Screenshot any provided URLs using `page_capture.py`
3. Save to `data/discovery/` with descriptive names (e.g., `inspiration-competitor-homepage.png`)

**Always tell the user which mode you're using:**
> "I'll capture screenshots of [website] to use as reference throughout the demo build."
> or
> "No website URL — I'll pull visual references from similar demos and Algolia customer sites in the same vertical."

### Reference Index

After capturing, create `data/discovery/README.md`:

```markdown
# Discovery Visual References

| File | Source | Page | Key observations |
|------|--------|------|------------------|
| homepage.png | customer site | Homepage | [notes] |
| search-results.png | customer site | Search Results | [notes] |
| product-detail.png | customer site | Product Detail | [notes] |
| category-page.png | customer site | Category Page | [notes] |
```

### Analysis

Read the visual analysis checklist: `.claude/skills/demo-discovery/references/visual-analysis-checklist.json`

For each captured page, read the `.lowres.png` version and analyze every item in the checklist for that page type. For each item, determine:
- **Preserve**: What works well and should be reflected in the demo
- **Improve**: What's weak and where the demo can show a better experience

## Phase 1.5: Search Relevance Testing (Mode A only)

Skip this phase if no customer URL was provided. This tests the customer's current search to find concrete relevance gaps that the demo should fix.

### Step 1: Recon + Verify Captures

Before running the full test, confirm the script can actually find the search bar, type in it, and capture both autocomplete and results on this specific site. Failing to verify this leads to a batch of useless screenshots.

**1a. Run recon** to gather site intel:

```bash
python .claude/skills/demo-discovery/scripts/search_capture.py \
  --url "SITE_URL" \
  --recon \
  --output-dir "data/discovery/search-test"
```

Read `data/discovery/search-test/recon.json` for product names, categories, and vertical guess.

**1b. Run a single test query** using a real product name from recon:

```bash
python .claude/skills/demo-discovery/scripts/search_capture.py \
  --url "SITE_URL" \
  --query "PRODUCT_NAME_FROM_RECON" \
  --output-dir "data/discovery/search-test"
```

**1c. Verify the captures** — read both `.lowres.png` screenshots:
- **Autocomplete screenshot**: Is the autocomplete dropdown actually open and visible? Are suggestions showing? If the screenshot just shows the page with text in the search bar but no dropdown, the capture timing or selectors need adjusting.
- **Results screenshot**: Did it navigate to the results page? Are product results visible?

If either capture is wrong (autocomplete not open, results page didn't load, page is blocked), debug before proceeding. Common issues:
- Search icon needs clicking before input is visible
- Autocomplete takes longer than expected to appear
- Site uses a search overlay/modal instead of a dropdown
- Bot detection blocked the page

**Do not proceed to Step 2 until both screenshots look correct.**

### Step 2: Design Test Queries

Read the query templates: `.claude/skills/demo-discovery/references/query_templates.json`

Design 8-10 queries tailored to this site using recon data:

| Category | Count | Purpose |
|----------|-------|---------|
| Exact product name | 2 | Use real names from recon. Should rank #1 |
| Typo | 1 | Misspell a popular product. Should still return it |
| Conversational / intent | 2 | Natural language queries relevant to the vertical |
| Synonym pair | 1 | Two words for the same thing — run both |
| Multi-attribute | 1 | Combine facets: color + category + price intent |
| Edge case | 1 | Gibberish or zero-result query |

Save to `data/discovery/queries.json`:
```json
[
  {"query": "Lift Seamless Leggings", "category": "exact_product", "expectation": "Exact product should be #1"},
  {"query": "seamles leggins", "category": "typo", "expectation": "Should still show seamless leggings"},
  {"query": "outfit for a summer wedding", "category": "conversational", "expectation": "Should show dresses, accessories"}
]
```

### Step 3: Run Captures

```bash
python .claude/skills/demo-discovery/scripts/search_capture.py \
  --url "SITE_URL" \
  --queries-file "data/discovery/queries.json" \
  --output-dir "data/discovery/search-test" \
  --site-name "Brand Name"
```

### Step 4: Analyze Results

Read `data/discovery/search-test/capture-summary.json` — this is the primary data source (extracted text, product names, API timings). Only read `.lowres` screenshots for queries that scored Weak or Fail.

Score each query:

| Score | Meaning |
|-------|---------|
| **Pass** | Top results are relevant, expected product appears |
| **Weak** | Partially relevant — right category but wrong products, or slow |
| **Fail** | Irrelevant results, zero results, or broken experience |

Summarize the gaps:
- Which query categories failed? (typos? synonyms? conversational?)
- What Algolia capability would fix each gap? (typo tolerance, NeuralSearch, synonyms, query rules)
- What are the best "before vs after" demo scenarios?

This feeds directly into the brief's **Relevance Gaps** section and informs Phase 3's feature recommendations.

## Phase 1.75: Data Audit

Skip if no data source is available yet. Run when the user has provided a JSON/CSV file, an existing Algolia index, or data has been scraped via `/demo-scrape`.

### 1. Load & count

Load the data source and get basics:
- **Record count** — <50 is thin for a demo (empty facets, sparse categories). >100k means enrichment time/cost matters.
- **Record types** — check for a `type` field or distinct field patterns. Products? Articles? Mixed?

### 2. Image audit

Broken images kill a demo instantly.

- What % of records have an image URL field?
- **Spot check**: HTTP HEAD 5 random image URLs — do they resolve (200) or 404?
- Are they full-res or thumbnails? (check URL patterns like `_thumb`, `100x100`, or fetch one and check dimensions)
- Multiple images per record (`image_urls` array) or just one?

### 3. Price & currency

- Is price present? What format — `19.99` (number), `"$19.99"` (string with symbol), `{ value: 19.99 }` (nested)?
- Is there both original price and sale price for discount display?
- Single currency or mixed? Symbol embedded in value or separate field?

### 4. Category structure

- How deep is the hierarchy? Flat tags, 2-level, 3-level?
- **Distribution**: count records per top-level category. Flag if >70% are in one category or if any category has <5 records (empty sidebar).
- Format: already `"Level1 > Level2 > Level3"` or needs reshaping from separate fields / flat arrays?

### 5. Facet candidates

For each field that could be a facet:
- **Cardinality** — how many unique values? >200 unique values may need grouping or a searchable facet.
- **Color fields specifically** — consolidated names ("Red", "Blue") or raw names ("Dusty Rose Mauve", "Ocean Breeze Blue")? Raw names need `filter_group` consolidation.
- Are values clean strings or do they contain junk (leading spaces, mixed case, "N/A")?

### 6. Text quality

- **Descriptions**: rich paragraphs, one-liners, HTML, or missing entirely?
- **Average word count** of description field across records.
- If descriptions are thin (<20 words avg) or missing, NeuralSearch will need `semantic_attributes` enrichment.
- **Language**: single or mixed? Detect from a sample of 10 descriptions.

### 7. Variant / duplicate detection

- Are color/size variants stored as separate records or nested arrays within a record?
- Quick check: sort by name, look for near-duplicates (same name, different color/size). If variants are separate records, the demo needs dedup or grouping to avoid "5 identical shoes in different colors" in results.

### 8. Field coverage summary

After the specific checks above, produce one summary table:

| Field | % Populated | Format | Action |
|-------|-------------|--------|--------|
| {field} | {0-100%} | {type/format notes} | {use as-is / clean / enrich / consolidate / drop} |

This table, plus the findings from checks 2-7, feeds directly into the brief's **Data Audit** section.

## Phase 2: Research — Similar Past Demos

Explore git branches in this repo for similar demos:

```bash
git branch -a
```

Identify branches matching the vertical or use case (branch names typically include customer/vertical info).

For each matching branch, **check the README first** (use `git show <branch>:<path>` — do NOT check out branches):

```bash
git show <branch>:README.md
```

If the README contains a `## Use Case` section, this branch has a **demo card** (created by `/demo-showcase`). The demo card gives you the full picture — use case, differentiators, features, data strategy, personalization, and agent setup — without needing to inspect individual config files. Also check for showcase screenshots:

```bash
git show <branch>:data/showcase/homepage.lowres.png > /tmp/ref-<branch>-homepage.png
git show <branch>:data/showcase/search-results.lowres.png > /tmp/ref-<branch>-search.png
```

Read the `.lowres.png` screenshots to understand the visual direction of the demo.

**Fallback:** If the README is still the template version (no `## Use Case` section), inspect key config files individually:

- `lib/demo-config/index.ts` — brand config, locale, image domains
- `lib/demo-config/categories.ts` — category structure
- `lib/demo-config/users.ts` — user profiles and personalization attributes
- `lib/demo-config/agents.ts` — agent instructions and tools
- `scripts/index-data.ts` — transform/enrich functions (how data was shaped)

Note patterns:
- What facets were used for this vertical
- What enrichments were applied
- What agent tools were configured
- What personalization strategy was used

**If no similar branches exist**, say so explicitly:
> "No existing demos match this vertical. We'll build from the base template."

Also search for external references:
- Algolia demo showcases or public examples relevant to the vertical
- Competitor implementations worth referencing
- Provide URLs to relevant examples when available

## Phase 3: Suggest Demo Vision

Present a structured suggestion combining all research. This is the core output.

### 3a. Suggested Interactions & Features

Based on use cases + vertical + customer website analysis + **relevance test results**, recommend which features to emphasize. Prioritize features that directly address gaps found in Phase 1.5 — these make the strongest demo moments because you can show "their search fails here, ours doesn't."

- **Search behavior** — autocomplete, query suggestions, NeuralSearch, typo tolerance
- **Faceting strategy** — which attributes to facet on, filter vs searchable, visual facets (color swatches, size pills)
- **Category navigation** — hierarchy depth, sidebar vs top-nav, category page layout
- **Personalization** — which user profiles, which preference weights, "For You" section
- **AI agent** — what tools it needs, what context to inject, key scenarios it should handle
- **Recommendations** — Related Products, Looking Similar, Trending, Frequently Bought Together
- **Merchandising** — pinned results, boosting rules, banners

### 3b. Visual Suggestions

For each major page/component:

- **ASCII mockups** for any novel layouts or non-standard arrangements
- **Component references** — point to existing components in the repo with file paths (e.g., `components/ProductCard.tsx`, `components/sidebar/`)
- **URLs to external examples** that illustrate the suggested UX
- **Preservation notes** — what to keep from the customer's current site vs what to change

Example format:
```
Search Results Page:
┌──────────────────────────────────────────┐
│ [Search Bar with Autocomplete]           │
├──────────┬───────────────────────────────┤
│ Filters  │ ┌─────┐ ┌─────┐ ┌─────┐     │
│ ───────  │ │     │ │     │ │     │     │
│ Brand    │ │ Pro │ │ Pro │ │ Pro │     │
│ Color ●  │ │ duct│ │ duct│ │ duct│     │
│ Size     │ │     │ │     │ │     │     │
│ Price    │ └─────┘ └─────┘ └─────┘     │
│          │                               │
│ [For You]│ ┌─────┐ ┌─────┐ ┌─────┐     │
│          │ │     │ │     │ │     │     │
└──────────┴───────────────────────────────┘

- Color facet uses swatches (components/facets/ColorSwatch.tsx)
- "For You" toggle in sidebar (components/sidebar/ForYouFilter.tsx)
- See: [example URL] for similar layout
```

### 3c. Data Requirements

Based on the suggested features, list what the data MUST support. This section becomes the input brief for `/demo-data-indexing`.

- **Required fields** — which Product interface fields are needed for the suggested features
- **Required facets** — which attributes need to be filterable (e.g., "need `color.filter_group` for swatches")
- **Ranking signals** — what signals are needed for merchandising (e.g., "need sales data or popularity score")
- **Enrichment needs** — what should be AI-generated (e.g., "`semantic_attributes` for NeuralSearch, `keywords` for autocomplete quality")
- **Category hierarchy** — expected depth and structure

## Phase 4: Confirm & Output

Present the full vision to the user. Ask:

```
Does this match what you had in mind? Anything to adjust before we move to data preparation?
```

**WAIT for confirmation.**

Once confirmed, write the brief to `data/discovery/brief.md` following the template in `.claude/skills/demo-discovery/references/discovery-brief-template.md`. Fill in every section — the template contains field descriptions and examples for guidance.

This brief is the primary input for downstream skills (`/demo-data-indexing`, `/demo-branding`, `/demo-user-profiles`, `/demo-agent-setup`).

## Does NOT Run

This skill does NOT modify code or data. It produces a discovery brief that informs downstream skills:

- `/demo-data-indexing` — uses the data requirements to prioritize field mappings and enrichments
- `/demo-branding` — uses the visual direction and preservation notes
- `/demo-user-profiles` — uses the personalization strategy
- `/demo-agent-setup` — uses the agent feature suggestions
