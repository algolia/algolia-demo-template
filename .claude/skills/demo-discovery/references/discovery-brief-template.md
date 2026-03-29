# Demo Discovery Brief

This is the expected output structure of the `/demo-discovery` skill. The brief is saved to `data/discovery/brief.md` and consumed by downstream skills: `/data-structure`, `/demo-branding`, `/demo-user-profiles`, `/demo-agent-setup`.

Every field should be filled in. Use "N/A" only if genuinely not applicable (e.g., no agent needed). Never leave sections blank.

---

## Demo Discovery Brief

**Customer:** {company name}
**Website:** {URL or "N/A — no website provided"}
**Vertical:** {e.g., fashion, electronics, grocery, marketplace, B2B, beauty, home & garden}
**Audience:** {who will see this demo — e.g., "AE showing to VP of Digital at Gymshark", "SE technical deep-dive for engineering team", "self-serve trial"}
**Key use cases:** {comma-separated list — e.g., "search relevance, personalization, AI agent"}

### Features (priority order)

Rank by impact for the specific audience. Each feature gets a one-line description of what it demonstrates and why it matters for this prospect.

1. **{Feature name}** — {what it shows and why it matters}
2. **{Feature name}** — {what it shows and why it matters}
...

Feature categories to consider:
- **Search**: autocomplete, query suggestions, NeuralSearch, typo tolerance, synonym handling
- **Faceting**: which attributes, visual facets (color swatches, size pills), dynamic facets
- **Category navigation**: hierarchy depth, sidebar vs top-nav, category landing pages
- **Personalization**: user profiles, preference weights, "For You" section, boosted results
- **AI agent**: tools, context injection, key scenarios, personality
- **Recommendations**: Related Products, Looking Similar, Trending, Frequently Bought Together
- **Merchandising**: pinned results, boosting rules, banners, seasonal promotions

### Data Requirements

This section is the primary input for `/data-structure`. Be specific — name actual fields from the Product interface where possible.

- **Required fields:** {list fields from Product interface that must be populated — e.g., "name, brand, price, color.filter_group, hierarchical_categories (3 levels), reviews.rating, primary_image, image_urls"}
- **Required facets:** {attributes that must be filterable — e.g., "brand, color.filter_group (for swatches), available_sizes, price.value (range), hierarchical_categories"}
- **Enrichments needed:** {what should be AI-generated during indexing — e.g., "semantic_attributes for NeuralSearch, keywords for autocomplete quality, image_description for accessibility"}
- **Ranking signals:** {business metrics needed for custom ranking — e.g., "sales_last_30d for popularity, reviews.bayesian_avg for quality, margin for business optimization"}
- **Category hierarchy:** {expected depth and structure — e.g., "3 levels: Department > Category > Subcategory. Example: Women > Clothing > Dresses"}

Example Product:

```json
{
  "name": "Nike Air Max 270", // searchableAttributes
  "brand": "Nike", // searchableAttributes
  "price": { "value": 160 }, // numericAttributesForFiltering and filterOnly(price.value)
  "color": { "filter_group": "red", "original_name": "Red" }, // attributesForFaceting and searchable(color.filter_group)
  "available_sizes": ["M", "L", "XL"], // attributesForFaceting 
  "reviews": { "bayesian_avg": 4.5, "count": 100, "rating": 4.5 }, // attributesForFaceting 
  "primary_image": "https://example.com/image.jpg", // searchableAttributes
  "image_urls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"], // searchableAttributes
  "description": "The Nike Air Max 270 is a running shoe that features a Max Air unit in the heel.", // searchableAttributes
  "keywords": ["running", "shoe", "Nike", "Air Max 270"], // searchableAttributes
  "semantic_attributes": "The Nike Air Max 270 is a running shoe that features a Max Air unit in the heel.", // searchableAttributes
}
```


### Personalization Strategy

Consumed by `/demo-user-profiles` to generate user personas.

- **Persona count:** {how many user profiles — typically 3-4}
- **Persona sketches:** {brief description of each — e.g., "fitness enthusiast who prefers premium brands", "budget-conscious student", "trend-follower who buys new arrivals"}
- **Preference attributes:** {which Product fields to weight — e.g., "brand, gender, hierarchical_categories.lvl0, color.filter_group, price range"}
- **Personalization surfaces:** {where personalization shows up — e.g., "For You filter, search result boosting, agent context, homepage recommendations"}

### Agent Strategy

Consumed by `/demo-agent-setup` to configure the AI shopping assistant.

- **Agent persona:** {personality and expertise — e.g., "knowledgeable fitness apparel advisor who understands body types and workout needs"}
- **Key scenarios:** {2-3 conversations the agent should handle well — e.g., "help find running shoes for flat feet", "compare two jackets for cold weather hiking"}
- **Custom tools needed:** {beyond default addToCart + showItems — e.g., "size recommendation based on measurements, outfit builder"}
- **Product attributes for context:** {which fields the agent should reference — e.g., "name, brand, price, available_sizes, color, reviews.rating, description"}

### Visual Direction

Consumed by `/demo-branding` for brand configuration.

- **Brand identity:** {logo URL, brand colors if known, overall aesthetic — e.g., "minimal, dark mode, athletic"}
- **Locale:** {language and currency — e.g., "en-US, USD" or "fr-FR, EUR"}
- **Image domains:** {where product images are hosted — e.g., "images.gymshark.com, cdn.shopify.com"}

### Visual References

Screenshots captured during discovery, saved in `data/discovery/`:

| File | Source | Page | Key observations |
|------|--------|------|------------------|
| homepage.png | {source} | Homepage | {what's notable} |
| search-results.png | {source} | Search Results | {what's notable} |
| product-detail.png | {source} | Product Detail | {what's notable} |
| category-page.png | {source} | Category Page | {what's notable} |

Additionally, `public/homepage.png` contains the full-page homepage capture (navbar removed) used as the demo's hero image.

### Preservation Notes

What to keep vs improve from the customer's current site (or reference sites if no customer URL).

- **Preserve:** {UX patterns that work well — e.g., "mega-menu category navigation", "color swatch facets", "product card layout with quick-add"}
- **Improve:** {where the demo can show a better experience — e.g., "no autocomplete currently", "search results lack personalization", "no AI assistant"}

### Reference Demos

Past demos in this repo that informed this brief.

| Branch | Vertical | What was reused |
|--------|----------|-----------------|
| {branch-name} | {vertical} | {what's relevant — e.g., "category structure, agent instructions"} |

If no similar branches exist: "No existing demos match this vertical. Built from base template."

### External References

| URL | What it shows |
|-----|---------------|
| {url} | {why it's relevant} |
