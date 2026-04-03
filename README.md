# Arcaplanet Demo

> Italian pet store e-commerce demo showcasing retail media, Click & Collect, AI-powered guided purchase assistant, and deep pet-specific faceting across 10,000+ products.

## Screenshots

| Homepage | Search Results |
|----------|---------------|
| ![Homepage](data/showcase/homepage.lowres.png) | ![Search Results](data/showcase/search-results.lowres.png) |

| Category Page | AI Agent |
|---------------|----------|
| ![Category Page](data/showcase/category-page.lowres.png) | ![AI Agent](data/showcase/agent.lowres.png) |

## Use Case

- **Customer:** Arcaplanet — Italy's largest pet store chain (500+ stores)
- **Vertical:** Pet retail / E-commerce
- **Audience:** AE showing to Arcaplanet digital team
- **Key scenarios:** Retail media monetization, omnichannel Click & Collect with store availability, AI shopping assistant with guided purchase flow for pet owners

## What Makes This Demo Different

This demo goes well beyond standard e-commerce search. It tells a **retail media revenue story** — showing how Arcaplanet can monetize their search traffic by letting brands like Royal Canin, Monge, Purina, and Advantix sponsor search results through carousel takeovers, inline sponsored cards, and cross-sell banners. Each rule models a real paid placement: brand sponsorship ("Royal Canin owns dog food searches"), conquest campaigns ("Monge appears when users search Royal Canin"), and cross-category upsells ("suggest snacks when browsing kibble"). The homepage itself features sponsored category cards with brand attribution.

The **Click & Collect** system adds an omnichannel dimension — customers can search for a nearby Arcaplanet store, see real-time stock availability per product, and choose in-store pickup. This is powered by a dedicated locations index with store data across Italy.

The **AI shopping assistant** speaks Italian and follows a guided purchase flow designed for pet owners: it profiles the animal (species, age, size, health needs) through conversational questions, then searches with precise filters (e.g., `età.value:PUPPY + taglia.value:MEDIA`), presents 2-3 options with explanations, and cross-sells complementary products. The pet-specific attribute system (età, razza, taglia, gusto, funzione, formato) enables faceted filtering that mirrors how a knowledgeable store associate would guide a customer.

The data comes from Arcaplanet's VTEX e-commerce platform — 10,124 real products with images, pricing, descriptions, and rich pet-specific metadata, all in Italian with EUR pricing.

## Features Highlighted

- **Retail Media** — Sponsored carousels, inline ads, and banners triggered by search queries and category filters. Models real CPM/CPC campaign types with brand attribution labels.
- **Click & Collect** — Store locator with address search, map view, and per-product stock availability badges. Powered by a separate `arcaplanet_locations` Algolia index.
- **AI Guided Purchase** — Italian-speaking agent that profiles the pet (species, age, size, needs), searches with targeted filters, presents options with explanations, and cross-sells intelligently.
- **Pet-Specific Faceting** — Filterable attributes for animal age (PUPPY/ADULTO/ANZIANO), breed, size, flavor, health function, and packaging format.
- **Deep Category Hierarchy** — 4 animal types (Cane, Gatto, Piccoli Animali, Persona e Casa) with 3 levels of subcategories matching Arcaplanet's real catalog structure.
- **Personalization** — Two personas (new puppy owner, senior dog owner) with preference weights on age, brand, and category — boosting relevant products in search and agent responses.
- **Query Suggestions** — Homepage shows popular search pills (Cibo secco cane, Antiparassitari, Snack gatto, Crocchette, Royal Canin) for quick discovery.

## Customizations vs Template

### Data & Relevance
- **Product count:** 10,124 products
- **Data source:** Arcaplanet VTEX e-commerce platform (JSON export with VTEX items/sellers structure)
- **Key facets:** `brand`, `hierarchical_categories` (3 levels), `età.value`, `razza.value`, `taglia.value`, `gusto.value`, `funzione.value`, `formato.value`, `conservazione.value`, `consistenza.value`, `tipo.value`, `price.value`, `reviews.rating`, `discount_rate`
- **Enrichments:** Synthetic business metrics (sales velocity, margin, AOV), synthetic reviews with Bayesian averaging, HTML entity stripping for Italian characters, `categoryPageId` and `searchable_categories` derived from hierarchical categories
- **Transform logic:** `scripts/index-data.ts` filters VTEX records, extracts pricing from items/sellers structure, converts hierarchical categories from arrays to strings, maps `shopAvailability` to store objectIDs, and generates deterministic synthetic metrics from objectID hashes

### Personalization
- **Nuovo proprietario cucciolo** — Boosts puppy food, snacks, toys, Royal Canin, PUPPY age
- **Proprietario cane anziano** — Boosts diet food, health products, Royal Canin, ANZIANO age, weight control

### AI Agent
- **Agent name:** Arcaplanet Shopping Assistant
- **Key capabilities:** Multi-turn guided purchase (profile animal → search with filters → present options → cross-sell), Algolia Recommend for related products, cart management
- **Custom tools:** `algolia_search_index`, `recommend_related_products`, `addToCart`, `showItems`
- **Notable instructions:** Full Italian instructions with a 5-step guided purchase flow (profile → filter → present → cross-sell → close). Knows all pet attribute values for precise filtering. Responds with pet-themed emoji personality.

### Retail Media
- **9 campaign rules** across 3 placement types (carousel, inline, banner)
- **Brand sponsors:** Royal Canin (dog category + food searches), Purina Pro Plan (cat category + snacks), Advantix (antiparasitic searches), Vitakraft (small animals), Monge (conquest targeting Royal Canin), Almo Nature (wet cat food)
- **Homepage sponsorship:** Category cards show brand attribution (e.g., "Sponsorizzato · Royal Canin")

### Click & Collect
- **Store locator** with address search and interactive map
- **Per-product availability badges** based on `availableInStores` field
- **Dedicated locations index** (`arcaplanet_locations`) for store data

### Branding
- **Locale:** Italian / EUR
- **Category depth:** 3 levels (Animal > Product Type > Subcategory)
- **Visual identity:** Arcaplanet yellow (`#FFD700`) and black brand colors, official logo SVG, Italian UI throughout

## Running This Demo

```bash
pnpm install
pnpm dev
```

Requires `.env` with `ALGOLIA_ADMIN_API_KEY` for indexing scripts. Search works with the committed search-only key.

## Tech Stack

Next.js 16, React 19, Algolia Composition API, Agent Studio, AI SDK v5, Tailwind CSS 4, shadcn/ui.
