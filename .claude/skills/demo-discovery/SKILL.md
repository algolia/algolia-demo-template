---
name: demo-discovery
description: 'Explore use cases, inspect the customer website, review similar past demos, and suggest what the demo should look like. Use before /data-structure when setting up a new demo, or when the user wants to explore what interactions and features the demo should have.'
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

## Phase 1: Research — Customer Website

Screenshot and analyze the customer's website. Visit and capture:

1. **Homepage** — layout, hero, featured products/categories
2. **Search results page** — search for a generic term, note:
   - What facets/filters are available
   - How products are displayed (grid, list, card layout)
   - What product info is shown (price, ratings, colors, sizes)
   - Autocomplete/suggestions behavior
3. **Product detail page** — pick a representative product, note:
   - Image gallery style
   - What product attributes are displayed
   - Recommendations section (if any)
   - Reviews display
4. **Category page** — navigate to a category, note:
   - Category hierarchy depth
   - How sub-categories are presented
   - Sorting options

For each page, identify:
- **Preserve**: What works well and should be reflected in the demo
- **Improve**: What's weak and where the demo can show a better experience

## Phase 2: Research — Similar Past Demos

Explore git branches in this repo for similar demos:

```bash
git branch -a
```

Identify branches matching the vertical or use case (branch names typically include customer/vertical info).

For each matching branch, inspect key config files (use `git show <branch>:<path>` — do NOT check out branches):

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

Based on use cases + vertical + customer website analysis, recommend which features to emphasize:

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

Based on the suggested features, list what the data MUST support. This section becomes the input brief for `/data-structure`.

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

Once confirmed, output the summary brief:

```
## Demo Discovery Brief

**Customer:** [name]
**Vertical:** [vertical]
**Audience:** [who]
**Key use cases:** [list]

### Features (priority order)
1. [feature]
2. [feature]
...

### Data Requirements
- **Required fields:** [list]
- **Required facets:** [list]
- **Enrichments needed:** [list]
- **Ranking signals:** [list]
- **Category hierarchy:** [depth + structure notes]

### Visual Direction
- [key UX decisions and references]

### Reference Demos
- [branch names with what was reused]
- [external URLs]

### Preservation Notes
- [what to keep from customer's current site]
- [what to improve]
```

This brief is passed to `/data-structure` as context for data analysis and transformation.

## Does NOT Run

This skill does NOT modify code or data. It produces a discovery brief that informs downstream skills:

- `/data-structure` — uses the data requirements to prioritize field mappings and enrichments
- `/demo-branding` — uses the visual direction and preservation notes
- `/demo-user-profiles` — uses the personalization strategy
- `/demo-agent-setup` — uses the agent feature suggestions
