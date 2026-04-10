# Arcaplanet Demo

> Italian pet retail demo for Arcaplanet's structured vendor evaluation. Showcases retail media monetization, Click & Collect with 500+ real store locations, AI-powered guided purchase for pet owners, NeuralSearch with Italian semantic understanding, and deep pet-specific personalization — all built on Arcaplanet's real VTEX product catalog.

**Demo URL:** https://arcaplanet-demo.netlify.app

## Screenshots

| Homepage | Search Results |
|----------|---------------|
| ![Homepage](data/showcase/homepage.lowres.png) | ![Search Results](data/showcase/search-results.lowres.png) |

| Category Page | AI Agent |
|---------------|----------|
| ![Category Page](data/showcase/category-page.lowres.png) | ![AI Agent](data/showcase/agent.lowres.png) |

| Retail Media: Carousel | Retail Media: Conquest |
|------------------------|----------------------|
| ![Carousel: cibo cane](data/showcase/retail-media-carousel.lowres.png) | ![Inline: royal canin](data/showcase/retail-media-inline.lowres.png) |

| Retail Media: Cross-sell Banner | Retail Media: Antiparassitari |
|---------------------------------|-------------------------------|
| ![Banner: crocchette](data/showcase/retail-media-banner.lowres.png) | ![Carousel: antiparassitari](data/showcase/retail-media-antiparassitari.lowres.png) |

## Use Case

- **Customer:** Arcaplanet — Italy's largest pet store chain (500+ stores)
- **Vertical:** Pet retail / E-commerce
- **Audience:** AE showing to Arcaplanet digital team during structured vendor evaluation
- **Key scenarios:** Retail media revenue, omnichannel Click & Collect, AI shopping assistant with guided purchase, pet-profile personalization, NeuralSearch in Italian

---

## What Makes This Demo Different

This demo tells four connected stories through one customer journey — Maria, a pet owner in Milan with an 8-year-old Golden Retriever named Luna. Each demo area maps to a stage in her relationship with Arcaplanet, building emotional momentum while systematically covering every evaluation criterion.

### 1. Retail Media Revenue Engine

The standout feature is a complete **retail media system** powered by Algolia Composition Rules. Nine campaign rules model real paid placements that brands pay retailers for:

- **Brand sponsorship** (carousel) — Royal Canin owns "cibo cane" searches with a horizontal strip above organic results
- **Conquest campaigns** (inline) — Monge products appear when users search "royal canin" — classic competitive targeting
- **Cross-category upsell** (banner) — Search for "crocchette" and a snack banner appears between rows, increasing basket size
- **Category takeover** — Royal Canin sponsors the entire Cane category; Purina sponsors Gatto

Each placement type has its own visual treatment. A debug overlay (`?retail_media=true`) shows which rules fired.

### 2. Click & Collect with Real Store Data

Full omnichannel experience with 500+ Arcaplanet store locations across Italy:

- **Store finder** with address search, interactive map, service filters (grooming, vet, adoption events)
- **Store-first mode** — select a store, entire catalog filters to that store's inventory
- **Radius mode** — browse with location enabled, products stocked in more nearby stores rank higher
- **Cart-aware re-boosting** — add a product from Store A, subsequent searches favor Store A's inventory
- **Availability badges** on every product card ("Disponibile nel tuo negozio", "Pronto in 1 ora")

### 3. AI Guided Purchase for Pet Owners

The agent speaks Italian and follows a structured flow designed for the pet vertical:

1. Profile the animal (species, breed, age, size, health needs) through conversational questions
2. Search with precise filters (e.g., `età.value:ANZIANO + taglia.value:GRANDE + age_bucket:8+`)
3. Present 2-3 options with explanations via `showItems`
4. Cross-sell complementary products
5. Search 314 indexed Arcaplanet magazine articles for educational content when users ask for advice

The agent uses `context-snapshot.ts` to inject page context (current product, search query, user profile) into every message, so it always knows what the customer is looking at.

### 4. Pet-Specific Personalization with Age & Size Boosting

Two personas demonstrate how DY affinities would flow into Algolia as `optionalFilters`:

- **Maria + Luna** — 8-year-old Golden Retriever (GRANDE). Boosts: `age_bucket:8+` (score 20), `taglia.value:GRANDE` (18), `età.value:ANZIANO` (10)
- **Luca + Rocco & Milo** — Senior Labrador + puppy Beagle. Dual-age boosting: senior products AND puppy products surfaced together

The indexing pipeline enriches products with:
- **`age_bucket`** — extracted from product names (e.g., "Ageing 8+" -> `8+`) or derived from `età.value` categories. 5,028 products tagged.
- **`taglia` auto-tagging** — 207 products missing size data get tagged from name patterns (mini -> PICCOLA, maxi -> GRANDE)
- **`isAccessori`** — boolean flag for 1,391 accessories, demoted in custom ranking so food/health products rank first

### 5. NeuralSearch in Italian

Custom NeuralSearch configuration with semantic understanding for Italian:
- Model: `algolia-large-multilang-generic-v2410`
- Semantic blend weight: 0.6 (balanced keyword + semantic)
- Dynamic threshold with 0.663 lower limit
- Handles natural language queries like "qualcosa per i denti" matching dental products despite no exact keyword overlap

---

## Features Highlighted

| Feature | What It Shows | Why It Matters |
|---------|---------------|----------------|
| **Retail Media** | 9 composition rules with carousel, inline, and banner placements | Revenue monetization of search traffic — €5-15 CPM per placement |
| **Click & Collect** | Store finder, per-product availability, cart-aware store boost | Omnichannel without new middleware — plugs into existing store data |
| **AI Agent** | Italian-speaking guided purchase with article KB | Replaces in-store associate experience online |
| **NeuralSearch** | Italian semantic search with custom blend weight | Natural language queries work without synonym management |
| **Personalization** | Age/size/breed-aware product boosting | DY affinities flow directly into search — no new profiling system |
| **Pet Faceting** | 10 pet-specific attributes (età, razza, taglia, gusto, funzione...) | Mirrors how a knowledgeable store associate filters products |
| **Accessory Demotion** | `isAccessori` in custom ranking | Food/health products surface first — matches real purchase priority |
| **Dynamic Facets** | `DynamicWidgets` with ordered facet rendering | Different categories surface different filter orders automatically |
| **Query Suggestions** | Popular search pills on homepage | Quick discovery for common pet product searches |

---

## Customizations vs Template

### Data & Relevance
- **Product count:** 8,756 products (filtered from 10,124 raw VTEX records)
- **Data source:** Arcaplanet VTEX e-commerce platform (JSON with items/sellers structure)
- **Key facets:** `brand`, `hierarchical_categories` (3 levels), `età.value`, `razza.value`, `taglia.value`, `gusto.value`, `funzione.value`, `formato.value`, `conservazione.value`, `consistenza.value`, `tipo.value`, `price.value`, `reviews.rating`, `discount_rate`, `age_bucket`, `isAccessori`
- **Enrichments:** `age_bucket` from product names/età (5,028 products), `taglia` auto-fill from names (207 products), `isAccessori` from category hierarchy (1,391 products), synthetic business metrics, Bayesian review averaging
- **Custom ranking:** `asc(isAccessori)` > `desc(reviews.bayesian_avg)` > `desc(sales_last_24h)`
- **NeuralSearch:** Active with custom config — multilang model, 0.6 blend weight, dynamic threshold 0.663

### Personalization
- **Maria + Luna** — Senior Golden Retriever owner. Boosts GRANDE size, 8+ age, ANZIANO, Royal Canin, digestion/sensitivity functions
- **Luca + Rocco & Milo** — Multi-dog household (senior Labrador + puppy Beagle). Dual-age boosting, GRANDE + MEDIA sizes, growth/weight control functions

### AI Agent
- **Agent name:** Arcaplanet Shopping Assistant
- **Key capabilities:** Multi-turn guided purchase, article search (314 magazine articles), Algolia Recommend for related products, cart management
- **Custom tools:** `algolia_search_index` (products + articles), `recommend_related_products`, `addToCart`, `showItems`, `showArticles`
- **Notable instructions:** Full Italian with 5-step guided purchase flow. Knows all pet attribute values for precise filtering. Context injection with page state, user profile, and selected products.

### Retail Media
- **9 composition rules** across 4 placement types (carousel, inline, banner, homepage)
- **Real scenarios modeled:** brand sponsorship, conquest campaigns, category takeover, cross-category upsell
- **Debug overlay:** `?retail_media=true` shows which rules fired and their placement types

### Click & Collect
- **500+ store locations** in dedicated `arcaplanet_locations` index
- **Store services:** grooming, vet, adoption events, parking, express pickup
- **Address search** via Mapbox geocoding
- **Cart store grouping** with multi-store pickup warnings

### Branding
- **Locale:** Italian / EUR
- **Category depth:** 3 levels (Animal > Product Type > Subcategory) with 4 root categories
- **Visual identity:** Official Arcaplanet logo, Italian UI throughout

---

## What Can Be Brought to Main

These features were built for Arcaplanet but are generic enough to become template capabilities:

### Ready to merge

| Feature | Files | Effort | Notes |
|---------|-------|--------|-------|
| **Retail Media system** | `lib/retail-media.ts`, `lib/demo-config/retail-media.ts`, `components/retail-media/*`, `scripts/setup-composition-rules.ts` | Medium | Rule definitions are demo-specific, but the rendering pipeline (classify hits by injectedItemKey -> carousel/inline/banner) is fully generic. Needs retail-media config to be empty by default in template. |
| **Click & Collect** | `components/click-collect/*`, `lib/click-collect-utils.ts`, `lib/algolia-locations.ts`, `scripts/index-stores.ts`, `scripts/enrich-stores.ts` | Medium | Store finder, availability badges, cart store grouping. Needs a locations index and `availableInStores` on products. Template could ship with the components but no store data. |
| **NeuralSearch in indexing** | `scripts/index-data.ts` (semanticSearch settings block) | Small | The `PUT /semanticSearch/settings` call is a generic pattern — every demo should configure NeuralSearch during indexing rather than manually in the dashboard. Just needs the config values to be parameterized. |
| **Article indexing + agent search** | `scripts/index-articles.ts`, agent instructions with multi-index search | Small | Pattern: scrape/index articles as a second index, give agent access to search both. Arcaplanet-specific is the scraping logic, but the dual-index agent pattern is reusable. |
| **`isAccessori` custom ranking** | `scripts/index-data.ts` (enrichRecords) | Small | Generic concept: tag non-core products (accessories, consumables) and demote in ranking. Category detection logic is demo-specific. |
| **Product enrichment pipeline** | `extractAgeBucket()`, `extractTaglia()` in `scripts/index-data.ts` | Small | Pattern is generic (extract facet values from product names when source data is missing). Functions themselves are pet-specific. |
| **Searchable attributes format** | `SETUP.md`, code comments in `scripts/index-data.ts` | Trivial | Documentation about comma-separated vs `unordered()` — already added, should be in main. |

### Needs adaptation first

| Feature | Why it needs work |
|---------|-------------------|
| **Pet-specific faceting** | The 10 pet attributes (età, razza, taglia...) are Arcaplanet-specific. Template main should have example facets but not pet ones. |
| **User personas** | Maria/Luca profiles with pet data are demo-specific. Template should have placeholder personas with different preference structures. |
| **Store data format** | `availableInStores` with `shopId` mapping is VTEX-specific. A generic store availability format would need to be defined. |
| **Agent instructions** | Full Italian pet advisory personality. Template main should have English placeholder instructions. |

### Key architectural patterns to preserve

1. **Composition Rules for retail media** — Don't build a custom sponsored products API. Use composition rules with `injectedItemKey` encoding placement types. The frontend classifies hits by reading `_rankingInfo.composed[].injectedItemKey`.

2. **Context injection for agents** — `context-snapshot.ts` resolves page context before each agent message. This pattern (snapshot current state -> inject as `[CONTEXT]...[/CONTEXT]`) should be the standard for all agent integrations.

3. **Enrichment in indexing, not at query time** — `age_bucket`, `taglia` auto-fill, and `isAccessori` are computed during indexing. This keeps queries fast and makes the enriched fields facetable/filterable.

4. **DynamicWidgets with facetOrdering** — Server-controlled facet order per category, rendered by `DynamicWidgets` with `fallbackComponent`. Business team controls order from dashboard.

---

## Running This Demo

```bash
pnpm install
pnpm dev
```

Visit http://localhost:3000

Requires `.env` with `ALGOLIA_ADMIN_API_KEY` for indexing scripts. Search works with the committed search-only key.

### Full re-index (if needed)

```bash
pnpm tsx scripts/index-data.ts          # Products + NeuralSearch config
pnpm tsx scripts/index-articles.ts      # Magazine articles
pnpm tsx scripts/index-stores.ts        # Store locations
pnpm tsx scripts/setup-composition-rules.ts  # Retail media rules
pnpm tsx scripts/setup-agent.ts         # Agent Studio config
pnpm tsx scripts/setup-recommend.ts     # Recommend models
pnpm tsx scripts/setup-query-suggestions.ts  # Query suggestions
```

## Tech Stack

Next.js 16, React 19, Algolia Composition API, Agent Studio, AI SDK v5, Tailwind CSS 4, shadcn/ui.
