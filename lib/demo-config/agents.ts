/**
 * Agent Studio configuration
 *
 * Defines the AI shopping assistant's behavior, tools, and product knowledge.
 */
import { DEMO_CONFIG } from "./index";

/**
 * Product attributes exposed to the agent API key.
 * Keep this list minimal — only what the agent needs to answer questions.
 */
export const AGENT_PRODUCT_ATTRIBUTES = [
  "objectID",
  "name",
  "brand",
  "price",
  "description",
  "gender",
  "color",
  "available_sizes",
  "product_segment",
  "product_line",
  "hierarchical_categories",
  "attrs",
  "primary_image",
  "inStock",
];

export const AGENT_CONFIG = {
  main: {
    name: `${DEMO_CONFIG.brand.name} Gear Advisor`,
    instructions: `**AGENT ROLE**
You are the ${DEMO_CONFIG.brand.name} Gear Advisor — an expert motorcycle, bike, and ski gear specialist. You help riders find the right protective equipment for their discipline, skill level, and conditions.

**RESPONSE STYLE**
- Keep responses concise and authoritative
- When context has "isFirstMessage": true, respond with a single short sentence (max 15 words) — no product searches, no lists, just a brief greeting
- Always offer clear next actions (add to cart, compare, learn more, etc.)
- When discussing protection, mention CE certification levels when relevant

**DOMAIN KNOWLEDGE**
- Riding disciplines: Racing, Sport Touring, Adventure Touring, Urban, Off-Road
- Protection standards: EN 17092 (A, AA, AAA for garments), EN 1621 (CE Level 1/2 for protectors)
- Materials: leather (best abrasion), textile (versatility), Gore-Tex (waterproof), D-Dry (Dainese waterproof membrane)
- D-air: Dainese's airbag technology for racing and street
- Fit: Italian sizing runs slim — recommend sizing up if between sizes

**Tools**
- algolia_search_index - Search the product catalog
- addToCart - Add products to the customer's cart
- showItems - Display product recommendations

**Behavior**
1. Understand the rider's discipline and needs
2. Search for relevant products using appropriate filters
3. Use showItems to present 2-4 options with clear differentiators
4. Explain protection levels and material choices when relevant
5. Offer to complete an outfit (jacket + pants + gloves + boots)

**Language**
- Respond in the language the customer uses, default to English`,

    indexDescription: `Product catalog for ${DEMO_CONFIG.brand.name} — premium motorcycle, bike, and ski protective gear.

**Key filterable fields:**
- price.value: Product price in USD (numeric)
- gender: Men, Women, Unisex, Kids
- product_segment: Racing, Sport Touring, Adventure Touring, Urban, Merchandising, Piste
- product_line: Motorcycles, Multisport - Snow, Demon Basics, Multisport - Wheels
- hierarchical_categories.lvl0: Leather Jackets, Textile Jackets, Gloves, Boots, Safety, etc.
- color.filter_group: Color name (BLACK, RED, WHITE, etc.)
- available_sizes: Size codes (44, 46, 48, 50, XS, S, M, L, etc.)

**Product attributes (attrs):** Rich technical specs including characteristics, protective_inserts, main_materials, ergonomics, temperature ratings.

**IMPORTANT:** Only use exact facet values that exist in the index for filtering.`,

    tools: [
      {
        name: "addToCart",
        type: "client_side",
        description:
          "Add products to the customer's shopping cart. Use this when the customer wants to buy or add items to their cart.",
        inputSchema: {
          type: "object",
          properties: {
            objectIDs: {
              type: "array",
              items: { type: "string" },
              description: "Array of product objectIDs to add to cart",
            },
          },
          required: ["objectIDs"],
        },
      },
      {
        name: "showItems",
        type: "client_side",
        description:
          "Display products as visual cards. Use for recommendations, comparisons, or results. Include a title and explanation.",
        inputSchema: {
          type: "object",
          properties: {
            objectIDs: {
              type: "array",
              items: { type: "string" },
              description: "Array of product objectIDs to display",
            },
            title: {
              type: "string",
              description:
                "Title for the product display section (e.g. 'Racing Jackets for You')",
            },
            explanation: {
              type: "string",
              description:
                "Brief explanation of the selection (e.g. 'Top-rated leather jackets with CE AAA protection')",
            },
          },
          required: ["objectIDs", "title", "explanation"],
        },
      },
    ],
  },

  fallbackSuggestions: [
    "Help me choose a riding jacket",
    "What protection do I need for track days?",
    "Show me waterproof touring gear",
    "I need gloves for summer riding",
    "What's the difference between leather and textile?",
  ] as string[],
};
