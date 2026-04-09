/**
 * Agent Studio configuration
 *
 * Edit this file to customize AI agent instructions, tools, and metadata.
 * These are used by scripts/setup-agent.ts to configure agents in Algolia.
 */
import { ALGOLIA_CONFIG } from "../algolia-config";
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
  "hierarchical_categories",
  "stock",
  "colour",
  "primary_image",
  "url",
  "dimensions",
];

export const AGENT_CONFIG = {
  main: {
    name: `${DEMO_CONFIG.brand.name} Shopping Assistant`,
    instructions: `**AGENT ROLE**
You are a Shopping Assistant for ${DEMO_CONFIG.brand.name}, a leading UK bathroom retailer. You help customers find bathroom products including baths, showers, toilets, basins, taps, furniture, and accessories to create their dream bathroom.

**RESPONSE STYLE**
- Keep responses concise and helpful
- When context has "isFirstMessage": true, respond with a single short sentence (max 15 words) — no product searches, no lists, just a brief greeting or acknowledgment
- Always offer clear next actions (add to cart, learn more, compare, etc.)
- Use a professional yet friendly tone appropriate for a premium UK bathroom retailer
- Use British English spelling (colour, favourite, etc.)
- Show prices in GBP (£)

**Tools**
- algolia_search_index - Search the Ideal Bathrooms product catalog
- addToCart - Add products to the customer's cart
- showItems - Display product recommendations

**Behavior**
1. Understand customer's bathroom project, style preferences, and budget
2. Search for relevant bathroom products
3. Use showItems to present 2-4 options
4. Offer clear next steps
5. Consider factors like bathroom size, style (modern, traditional, industrial), budget, and specific requirements when recommending

**Language**
- Respond in the language the customer uses, default to British English`,

    tools: [
      {
        name: "algolia_search_index",
        type: "algolia_search_index",
        indices: [
          {
            index: ALGOLIA_CONFIG.INDEX_NAME,
            description: "Product catalog",
            enhancedDescription: `Product catalog for ${DEMO_CONFIG.brand.name} — bathroom products including baths, showers, toilets, basins, taps, tiles, and accessories for UK homes.

**Key filterable fields:**
- price: Product price in GBP (numeric)
- brand: Brand name (e.g. "Grohe", "Roca", "Vitra", "Ideal Standard", "Crosswater")
- hierarchical_categories.lvl0: Top-level category (e.g. "Baths", "Showers", "Sanitaryware", "Taps", "Furniture", "Tiles", "Accessories")
- hierarchical_categories.lvl1: Sub-category as "Parent > Child" (e.g. "Baths > Freestanding Baths", "Baths > Double Ended Baths", "Showers > Electric Showers", "Showers > Shower Enclosures", "Showers > Shower Trays", "Sanitaryware > Toilets", "Sanitaryware > Basins", "Taps > Bath Taps", "Taps > Basin Taps", "Furniture > Vanity Units", "Furniture > Bathroom Cabinets")
- colour: Product colour (e.g. "white", "chrome", "black", "brushed nickel")
- stock.in_stock: Boolean, true if available

**IMPORTANT:**
- Only use exact category values that exist in your index for filtering.
- Search for one product category at a time. If the user asks for multiple types of products (e.g. "bath and toilet"), run separate searches for each rather than combining them into one query.
- When users mention bathroom styles (modern, contemporary, traditional, industrial), map to appropriate product styles and brands.`,
            searchParameters: {
              attributesToRetrieve: AGENT_PRODUCT_ATTRIBUTES,
            },
          },
        ],
      },
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
          "Display product recommendations to the customer with a title and explanation. Use this to present products you want to recommend.",
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
              description: "A short title for the recommendation section",
            },
            explanation: {
              type: "string",
              description:
                "Brief explanation of why these products are being recommended",
            },
          },
          required: ["objectIDs", "title", "explanation"],
        },
      },
    ],
  },

  fallbackSuggestions: [
    "Show me freestanding baths",
    "Find electric showers under £300",
    "Browse modern bathroom furniture",
    "Show me chrome taps",
    "Find a close-coupled toilet",
  ] as string[],
};
