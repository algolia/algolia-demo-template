# Demo Discovery Brief

Output of `/demo-discovery`. Saved to `data/discovery/brief.json`. Consumed by `/data-structure`, `/demo-branding`, `/demo-user-profiles`, `/demo-agent-setup`.

Every field must be filled. Use `null` only if genuinely not applicable.

```json
{
  "overview": {
    "customer": "company name",
    "website": "https://example.com",
    "vertical": "fashion | electronics | grocery | marketplace | B2B | beauty | home & garden",
    "audience": "who sees this demo — e.g. AE showing to VP of Digital at Gymshark",
    "use_cases": ["search relevance", "personalization", "AI agent"]
  },

  "data_requirements": {
    "required_fields": ["name", "brand", "price.value", "color.filter_group", "hierarchical_categories", "reviews.rating", "primary_image", "image_urls", "description"],
    "facets": [
      { "attribute": "color.filter_group", "display": "swatches" },
      { "attribute": "available_sizes", "display": "text_list" },
      { "attribute": "brand", "display": "text_list" },
      { "attribute": "price.value", "display": "range_slider" },
      { "attribute": "hierarchical_categories", "display": "hierarchy" }
    ],
    "enrichments": [
      { "field": "semantic_attributes", "purpose": "NeuralSearch" },
      { "field": "keywords", "purpose": "autocomplete quality" }
    ],
    "ranking_signals": [
      { "field": "sales_last_30d", "purpose": "popularity" },
      { "field": "reviews.bayesian_avg", "purpose": "quality" },
      { "field": "margin", "purpose": "business optimization" }
    ],
    "category_hierarchy": {
      "depth": 3,
      "structure": "Department > Category > Subcategory",
      "example": "Women > Clothing > Dresses"
    }
  },

  "product_card": {
    "fields": [
      { "field": "primary_image", "notes": null },
      { "field": "brand", "notes": "uppercase, above product name" },
      { "field": "name", "notes": null },
      { "field": "description", "notes": "2-line clamp" },
      { "field": "color", "notes": "swatches from variants array" },
      { "field": "price.value", "notes": "with discount badge when discount_rate > 0" },
      { "field": "reviews.rating", "notes": "star display" }
    ],
    "layout": "grid | list | compact_grid",
    "custom_rendering": ["show material instead of brand", "show rating stars"]
  },

  "relevance_gaps": {
    "search_provider": "Elasticsearch | Algolia | Coveo | unknown",
    "queries": [
      {
        "query": "Lift Seamless Leggings",
        "category": "exact_product",
        "score": "pass | weak | fail",
        "gap": "what went wrong",
        "algolia_fix": "typo tolerance | NeuralSearch | synonyms | query rules"
      }
    ],
    "best_demo_scenarios": [
      { "query": "seamles leggins", "why": "typo returns zero results — Algolia handles this out of the box" },
      { "query": "outfit for a summer wedding", "why": "intent query returns nothing — NeuralSearch understands this" }
    ]
  },

  "personalization": {
    "personas": [
      { "name": "Sarah", "description": "fitness enthusiast, prefers premium brands, buys leggings and sports bras" },
      { "name": "Tom", "description": "budget-conscious student, buys basics and sale items" },
      { "name": "Maya", "description": "trend-follower, buys new arrivals, prefers bold colors" }
    ],
    "preference_attributes": ["brand", "gender", "hierarchical_categories.lvl0", "color.filter_group"]
  },

  "agent": {
    "persona": "knowledgeable fitness apparel advisor who understands body types and workout needs",
    "scenarios": [
      "help find running shoes for flat feet",
      "compare two jackets for cold weather hiking"
    ],
    "product_attributes": ["name", "brand", "price", "available_sizes", "color", "reviews.rating", "description"]
  },

  "visual_direction": {
    "brand_identity": {
      "logo_url": "https://example.com/logo.svg",
      "colors": ["#000000", "#FFFFFF"],
      "aesthetic": "minimal, dark mode, athletic"
    },
    "locale": {
      "language": "en-US",
      "currency": "USD"
    },
    "image_domains": ["images.gymshark.com", "cdn.shopify.com"],
    "preserve": ["mega-menu navigation", "color swatch facets"],
    "improve": ["no autocomplete currently", "no personalization", "slow search"]
  }
}
```

## Field reference

- `data_requirements.facets[].display`: `swatches` | `text_list` | `range_slider` | `toggle` | `hierarchy`
- `product_card.layout`: `grid` (default) | `list` | `compact_grid`. See `components/ProductCard.tsx` for variants.
- `relevance_gaps.queries[].score`: `pass` (top results relevant) | `weak` (partially relevant) | `fail` (irrelevant or zero results)
- `relevance_gaps`: omit entirely (set to `null`) if no customer URL was tested
