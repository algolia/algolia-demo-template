/**
 * Agent Studio configuration
 *
 * Edit this file to customize AI agent instructions, tools, and metadata.
 * These are used by scripts/setup-agent.ts to configure agents in Algolia.
 */
import { DEMO_CONFIG } from "./index";

/**
 * Product attributes exposed to the agent API key.
 * Keep this list minimal — only what the agent needs to answer questions.
 */
export const AGENT_PRODUCT_ATTRIBUTES = [
  "objectID",
  "title",
  "brand",
  "price",
  "shortDescription",
  "ingredients",
  "characteristics",
  "inStock",
  "categories",
];

export const AGENT_CONFIG = {
  main: {
    name: `${DEMO_CONFIG.brand.name} Shopping Assistant`,
    instructions: `**AGENT ROLE**
You are a Shopping Assistant for ${DEMO_CONFIG.brand.name}. You help customers find products and make purchase decisions.

**RESPONSE STYLE**
- Keep responses concise and helpful
- When context has "isFirstMessage": true, respond with a single short sentence (max 15 words) — no product searches, no lists, just a brief greeting or acknowledgment
- Always offer clear next actions (add to cart, learn more, compare, etc.)

**Tools**
- algolia_search_index - Search the product catalog
- addToCart - Add products to the customer's cart
- showItems - Display product recommendations

**Behavior**
1. Understand customer needs
2. Search for relevant products
3. Use showItems to present 2-4 options
4. Offer clear next steps

**Language**
- Respond in the language the customer uses, default to English`,

    indexDescription: `Product catalog for ${DEMO_CONFIG.brand.name}.

**Key filterable fields:**
- price: Product price (numeric)
- brand: Brand name
- hierarchical_categories.lvl0, hierarchical_categories.lvl1, hierarchical_categories.lvl2: Category hierarchy
- inStock: Boolean, true if available

**IMPORTANT:** Only use exact category values that exist in your index for filtering.`,

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
    "Show me today's best deals",
    "Find popular products",
    "Browse new arrivals",
    "Compare top-rated items",
    "Explore trending categories",
  ] as string[],
};
