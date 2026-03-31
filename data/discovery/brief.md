# Demo Discovery Brief

Output of `/demo-discovery`. Consumed by `/data-structure`, `/demo-branding`, `/demo-user-profiles`, `/demo-agent-setup`.

---

## Overview

**Customer:** Dainese
**Website:** https://www.dainese.com/
**Vertical:** E-commerce — Protective sportswear (motorcycle, bike, ski)
**Audience:** Demo presentation on 2026-03-31
**Key use cases:** Variant handling with distinct, search relevance, basic AI agent

## Data Requirements

- **Record types:** Products (primary) — one row per color variant in the feed, to be grouped by `master` using Algolia `distinct`
- **Required fields:** name (from `Display Name` or `var_display_name`), brand (always "Dainese"), price.value (must be scraped — not in feed), color.filter_group (from `color_desc`), color.original_name (from `color_desc`), hierarchical_categories (3 levels from `product_line` > `product_family` > `product_category`), primary_image (constructed from Thron CDN UUID), image_urls (all UUIDs from `pdp_image`), description (from `long_description` or `var_long_description`), short_description, gender (extracted from `Display Name` — MEN'S/WOMEN'S/UNISEX), material, season, size_codes, size_range, available_sizes (parsed from `size_codes` JSON string), product_segment, homologation, Collection
- **Facets with display types:**
  - hierarchical_categories.lvl0, lvl1, lvl2 — text list (sidebar hierarchy)
  - color.filter_group — swatches
  - gender — text list
  - product_line — text list (Motorcycles, Bike, Ski, etc.)
  - product_segment — text list (Racing, Sport, Urban, etc.)
  - material — text list
  - price.value — range slider
  - season — text list
  - size_range — text list
  - Collection — text list
- **Enrichments:** keywords (extracted from product name + description for autocomplete), semantic_attributes (natural language description for NeuralSearch combining name, category, material, protection features)
- **Ranking signals:** No sales data or reviews in feed. Use NeuralSearch vector ranking + textual relevance. Optionally generate a popularity_score from product_segment (Racing > Sport > Urban).
- **Category hierarchy:** 3 levels: product_line > product_family > product_category. Example: Motorcycles > Leather Jackets > Racing

## Example Record

```jsonc
{
  // --- Identifiers ---
  "objectID": "201533866001",
  "name": "AVRO 5 - MEN'S MOTORCYCLE LEATHER JACKET",
  "slug": "avro-5-mens-motorcycle-leather-jacket",
  "sku": "201533866001",
  "parentID": "201533866",  // master — used for distinct grouping

  // --- Core fields ---
  "brand": "Dainese",
  "description": "The Avro 5 is the leather jacket that combines racing DNA with touring comfort...",
  "shortDescription": "Men's motorcycle leather jacket with racing heritage",
  "gender": "Men",

  // --- Price (scraped or generated) ---
  "price": {
    "value": 599.95,
    "currency": "USD"
  },

  // --- Images (Thron CDN) ---
  "primary_image": "https://dainese-cdn.thron.com/delivery/public/image/dainese/18d79786-44b2-4864-b848-9c813d7fe898/px6qct/std/960x960/201533866_001_1.png",
  "image_urls": [
    "https://dainese-cdn.thron.com/delivery/public/image/dainese/18d79786-44b2-4864-b848-9c813d7fe898/px6qct/std/960x960/201533866_001_1.png",
    "https://dainese-cdn.thron.com/delivery/public/image/dainese/df00639c-552e-4779-8e4f-052524869c87/px6qct/std/960x960/201533866_001_2.png"
  ],

  // --- Facets ---
  "color": {
    "filter_group": "Black",
    "original_name": "BLACK"
  },
  "hierarchical_categories": {
    "lvl0": "Motorcycles",
    "lvl1": "Motorcycles > Leather Jackets",
    "lvl2": "Motorcycles > Leather Jackets > Racing"
  },
  "categoryPageId": ["Motorcycles", "Leather Jackets", "Racing"],
  "product_line": "Motorcycles",
  "product_family": "Leather Jackets",
  "product_category": "Racing",
  "product_segment": "Racing",
  "material": "Sport Touring",
  "Collection": "Leather Jackets",
  "season": "SS25",
  "available_sizes": ["44", "46", "48", "50", "52", "54", "56", "58"],
  "size_range": "A2",

  // --- Technical specs (parsed from tf_ JSON blobs) ---
  "characteristics": ["Made in Italy", "EN 17092 AAA certified", "Pocket for back protector"],
  "protection": ["Pro-Armor 2.0 shoulders", "Pro-Armor 2.0 elbows"],
  "materials_detail": ["Tutu cowhide leather"],

  // --- Enrichments (AI-generated during indexing) ---
  "keywords": ["avro", "leather jacket", "racing", "motorcycle", "men", "black", "protective"],
  "semantic_attributes": "Men's premium black leather motorcycle racing jacket by Dainese. EN 17092 AAA certified protection with Pro-Armor inserts at shoulders and elbows. Made in Italy cowhide leather construction. Designed for sport touring and racing."
}
```

## Product Card Spec

**Fields to display:**
- primary_image — product photo on white background
- name — product name (uppercase, as on dainese.com)
- price.value — with sale price and discount badge when applicable
- color swatches — from sibling variants grouped by `parentID`
- product_segment badge — e.g., "Racing", "Urban", "Adventure"

**Layout variant:** grid (4 columns, matching dainese.com layout)

**Custom rendering:**
- Color swatches from variant siblings (grouped by `parentID` via `distinct`)
- Discount badge when sale price differs from original
- Product segment as subtle tag/badge
- No brand display needed (everything is Dainese)

**Card mockup:**

```
┌─────────────────────┐
│  ┌───────────────┐  │
│  │               │  │
│  │    [image]    │  │
│  │               │  │
│  └───────────────┘  │
│  ● ● ●  (colors)   │
│  AVRO 5 - MEN'S     │
│  MOTORCYCLE LEATHER  │
│  JACKET              │
│  $599.95             │
│  [Racing]            │
└─────────────────────┘
```

## Relevance Gaps

The current Dainese search on Salesforce Commerce Cloud (Demandware) is severely broken. **8 out of 10 test queries return identical "default" results** — the search engine falls back to merchandised defaults when it cannot match.

| Query | Category | Score | Gap | Algolia Fix |
|-------|----------|-------|-----|-------------|
| Avro 5 leather jacket | exact_product | **Fail** | Product at position 5, behind 4 irrelevant defaults | Textual relevance — exact name match at #1 |
| Super Speed 4 | exact_product | **Fail** | Product at position 5, behind defaults | Textual relevance |
| lether jaket | typo | **Fail** | No leather jackets in results, shows boots and race suits | Typo tolerance |
| gear for riding in the rain | conversational | **Fail** | Same default results, no rain gear shown | NeuralSearch |
| what to wear under a race suit | conversational | **Fail** | Same default results, no base layers | NeuralSearch |
| boots | synonym | **Weak** | Boots appear after 4 irrelevant defaults | Relevance tuning, remove pinned defaults |
| sneakers | synonym | **Weak** | Shoes appear after defaults | Synonyms (sneakers → shoes) |
| black leather jacket men size 50 | multi_attribute | **Fail** | Default results, no filtering on any attribute | Multi-attribute search |
| back protector CE level 2 | multi_attribute | **Fail** | Default results, no protectors shown | Faceted search + NeuralSearch |
| xyznotaproduct123 | edge_case | **Fail** | Shows 12 products instead of zero-results page | Proper zero-results handling |

**Best demo scenarios** (queries where the gap is most visible):
1. **"lether jaket"** — Their search shows boots and race suits. Algolia with typo tolerance returns leather jackets instantly. Compelling before/after.
2. **"gear for riding in the rain"** — Their search shows the same default results. NeuralSearch understands intent and surfaces waterproof/D-Dry products.
3. **"Avro 5 leather jacket"** — Searching for an exact product name and it's buried at position 5. Algolia puts it at #1.

**Search provider detected:** Salesforce Commerce Cloud built-in search (Demandware) with Einstein recommendations (CQuotient). No external search vendor detected.

## Personalization

- **Persona count:** 3
- **Persona sketches:**
  - Marco — Track day racer, prefers Racing/Performance segment, leather jackets and race suits, high-end protective gear
  - Sarah — Adventure touring rider, prefers Sport Touring segment, Gore-Tex/D-Dry waterproof gear, boots
  - Alex — Urban commuter, prefers Urban segment, casual motorcycle shoes, textile jackets, merchandising items
- **Preference attributes:** product_segment, product_line, product_family, Collection, material

## Agent

- **Persona:** Expert motorcycle gear advisor who understands protection levels (CE certifications), riding disciplines (racing, touring, urban), and weather conditions. Speaks with authority about safety without being preachy.
- **Key scenarios:**
  1. Help find the right jacket for a specific riding style and budget
  2. Explain protection levels and certifications (what does EN 17092 AAA mean?)
  3. Suggest a complete outfit for a specific use case (e.g., "I'm starting track days, what do I need?")
- **Product attributes for context:** name, brand, price, color, product_segment, product_family, product_category, characteristics, protection, materials_detail, available_sizes, description

## Visual Direction

- **Brand identity:** Dainese logo (red devil/demon on white), brand color is Dainese Red (#ED1C24). Premium motorsport aesthetic — dark backgrounds for hero, white for product grids. Sharp, angular design (no rounded corners).
- **Locale:** en-US, USD
- **Image domains:** `dainese-cdn.thron.com`
- **Preserve:** Top nav category structure (Airbag, Motorbike, Bike, Ski), product card layout (large image, name below, price, color swatches), white-background product photography, premium/technical feel
- **Improve:** Search relevance (completely broken), autocomplete (shows random trending queries instead of relevant suggestions), zero-results experience, variant grouping (show one card per model with color swatches instead of separate cards per color)
