# Demo Discovery Brief

Output of `/demo-discovery`. Saved to `data/discovery/brief.md`. Consumed by `/data-structure`, `/demo-branding`, `/demo-user-profiles`, `/demo-agent-setup`.

Every field must be filled. Use "N/A" only if genuinely not applicable.

---

## Overview

**Customer:** {company name}
**Website:** {URL or "N/A"}
**Vertical:** {fashion, electronics, grocery, marketplace, B2B, beauty, home & garden, etc.}
**Audience:** {who sees this demo — e.g., "AE showing to VP of Digital at Gymshark"}
**Key use cases:** {comma-separated — e.g., "search relevance, personalization, AI agent"}

## Data Requirements

Primary input for `/data-structure`. Name actual Product interface fields where possible.

- **Required fields:** {e.g., "name, brand, price.value, color.filter_group, hierarchical_categories (3 levels), reviews.rating, primary_image, image_urls, description"}
- **Facets with display types:**
  - {attribute} — {swatches | text list | range slider | toggle} {e.g., "color.filter_group — swatches"}
  - {attribute} — {type}
  - ...
- **Enrichments:** {what to AI-generate during indexing — e.g., "semantic_attributes for NeuralSearch, keywords for autocomplete"}
- **Ranking signals:** {e.g., "sales_last_30d for popularity, reviews.bayesian_avg for quality, margin for business optimization"}
- **Category hierarchy:** {depth + structure — e.g., "3 levels: Department > Category > Subcategory. Example: Women > Clothing > Dresses"}

## Product Card Spec

What appears on each product card in search results. Informs `/data-structure` about which fields are critical vs nice-to-have.

**Fields to display:**
- {field} — {notes if any} {e.g., "brand — uppercase, above product name"}
- {field}
- ...

**Layout variant:** {grid (default) | list | compact grid — pick based on vertical and product density}

**Custom rendering:** {any non-standard display — e.g., "show material instead of brand", "show rating stars", "show discount badge when discount_rate > 0", "color swatches from variants array"}

Reference: `components/ProductCard.tsx` has 4 variants (ProductCard, ProductListItem, CompactProductCard, CompactProductListItem). Default fields rendered: image, name, brand, description, top category, color swatches, price + discount, personalization badge.

## Relevance Gaps

Summary of Phase 1.5 search testing. Identifies what the customer's current search gets wrong and what the demo should fix. Omit this section if no customer URL was tested.

| Query | Category | Score | Gap | Algolia Fix |
|-------|----------|-------|-----|-------------|
| {query} | {exact/typo/conversational/synonym/multi-attr/edge} | {Pass/Weak/Fail} | {what went wrong} | {typo tolerance / NeuralSearch / synonyms / query rules / etc.} |

**Best demo scenarios** (queries where the gap is most visible):
1. {query} — {why this makes a compelling before/after}
2. {query} — {why}

**Search provider detected:** {Algolia / Elasticsearch / Coveo / unknown / etc.}

## Personalization

Consumed by `/demo-user-profiles`.

- **Persona count:** {typically 3-4}
- **Persona sketches:**
  - {name} — {one line — e.g., "fitness enthusiast, prefers premium brands, buys leggings and sports bras"}
  - {name} — {one line}
  - ...
- **Preference attributes:** {Product fields to weight — e.g., "brand, gender, hierarchical_categories.lvl0, color.filter_group"}

## Agent

Consumed by `/demo-agent-setup`.

- **Persona:** {personality and expertise — e.g., "knowledgeable fitness apparel advisor who understands body types and workout needs"}
- **Key scenarios:**
  1. {conversation the agent should handle well — e.g., "help find running shoes for flat feet"}
  2. {scenario}
- **Product attributes for context:** {fields the agent should reference — e.g., "name, brand, price, available_sizes, color, reviews.rating, description"}

## Visual Direction

Consumed by `/demo-branding`.

- **Brand identity:** {logo URL if found, brand colors, aesthetic — e.g., "minimal, dark mode, athletic"}
- **Locale:** {language + currency — e.g., "en-US, USD" or "fr-FR, EUR"}
- **Image domains:** {CDN hostnames for next.config.ts — e.g., "images.gymshark.com, cdn.shopify.com"}
- **Preserve:** {UX patterns to keep — e.g., "mega-menu navigation, color swatch facets"}
- **Improve:** {what the demo does better — e.g., "no autocomplete currently, no personalization, slow search"}
