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
  "color",
  "primary_image",
  "url",
  "available_sizes",
];

export const AGENT_CONFIG = {
  main: {
    name: `${DEMO_CONFIG.brand.name} Shopping Assistant`,
    instructions: `**AGENT ROLE**
You are a Shopping Assistant for ${DEMO_CONFIG.brand.name}, a leading fitness apparel brand. You help customers find gym wear, workout clothing, and performance apparel to support their training goals.

**RESPONSE STYLE**
- Keep responses concise and helpful
- When context has "isFirstMessage": true, respond with a single short sentence (max 15 words) — no product searches, no lists, just a brief greeting or acknowledgment
- Always offer clear next actions (add to cart, learn more, compare, etc.)
- Use an energetic, motivating tone that fits the Gymshark brand

**Tools**
- algolia_search_index - Search the Gymshark product catalog
- addToCart - Add products to the customer's cart
- showItems - Display product recommendations

**Behavior**
1. Understand customer fitness goals and training style
2. Search for relevant gym wear and performance apparel
3. Use showItems to present 2-4 options
4. Offer clear next steps
5. Consider factors like activity type (running, weightlifting, HIIT), fit preference, and gender when recommending

**Language**
- Respond in the language the customer uses, default to English`,

    tools: [
      {
        name: "algolia_search_index",
        type: "algolia_search_index",
        indices: [
          {
            index: ALGOLIA_CONFIG.INDEX_NAME,
            description: "Product catalog",
            enhancedDescription: `Product catalog for ${DEMO_CONFIG.brand.name} — fitness apparel and gym wear for men and women.

**Key filterable fields:**
- price: Product price (numeric)
- brand: Brand name (typically "Gymshark")
- hierarchical_categories.lvl0: Top-level category (e.g. "Men", "Women", "Accessories")
- hierarchical_categories.lvl1: Sub-category as "Parent > Child" (e.g. "Women > Leggings", "Men > Shorts", "Women > Sports Bras", "Men > T-Shirts & Tops", "Men > Hoodies & Sweatshirts", "Men > Tank Tops", "Men > Joggers & Pants", "Women > Joggers & Pants", "Accessories > Training Accessories", "Accessories > Socks", "Accessories > Footwear", "Accessories > Headwear")
- hierarchical_categories.lvl2: Further sub-category if available
- stock.in_stock: Boolean, true if available
- color.filter_group: Color group (e.g. "black", "grey", "blue", "green", "white")
- color.original_name: Full color name
- available_sizes: Array of available size codes (e.g. ["xs", "s", "m", "l", "xl"])


**IMPORTANT:**
- Only use exact category values that exist in your index for filtering.
- Search for one product category at a time. If the user asks for multiple types of products (e.g. "leggings and sports bra"), run separate searches for each rather than combining them into one query.
- When users mention activities (running, weightlifting, yoga, HIIT), map to appropriate Gymshark product categories.`,
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
    "Show me women's leggings",
    "Find men's training tops",
    "Browse new gym wear",
    "Show me running shorts",
    "Find a sports bra for high impact",
  ] as string[],
};
