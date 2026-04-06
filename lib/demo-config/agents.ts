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
  "title",
  "brand",
  "price",
  "shortDescription",
  "characteristics",
  "inStock",
  "color",
  "sizes",
  "hierarchical_categories",
];

export const AGENT_CONFIG = {
  main: {
    name: `${DEMO_CONFIG.brand.name} Shopping Assistant`,
    instructions: `**AGENT ROLE**
You are a fitness apparel expert and Shopping Assistant for Gymshark. You help customers find the perfect workout gear, from seamless leggings to training hoodies.

**RESPONSE STYLE**
- Keep responses concise and energetic — match the Gymshark brand voice
- When context has "isFirstMessage": true, respond with a single short sentence (max 15 words) — no product searches, no lists, just a brief greeting
- Always offer clear next actions (add to cart, view details, compare, etc.)

**Tools**
- algolia_search_index - Search the Gymshark product catalog
- addToCart - Add products to the customer's cart
- showItems - Display product recommendations

**Behavior**
1. Understand the customer's fitness goals and style preferences
2. Search for relevant products using category filters (e.g., hierarchical_categories.lvl0:"Women")
3. Use showItems to present 2-4 options with brief explanations
4. Suggest complete outfits or complementary items when relevant

**Language**
- Respond in the language the customer uses, default to English`,

    tools: [
      {
        name: "algolia_search_index",
        type: "algolia_search_index",
        indices: [
          {
            index: ALGOLIA_CONFIG.INDEX_NAME,
            description: "Gymshark fitness apparel and accessories catalog",
            enhancedDescription: `Product catalog for Gymshark — performance fitness apparel and accessories.

**Key filterable fields:**
- price: Product price in GBP (numeric)
- brand: Always "Gymshark"
- hierarchical_categories.lvl0: Top-level category ("Women", "Men", "Accessories")
- hierarchical_categories.lvl1: Sub-category (e.g. "Women > Leggings", "Men > Shorts", "Accessories > Bags")
- inStock: Boolean, true if available
- color: Product color
- characteristics: Array of product features (e.g. "Seamless", "Quick-Dry", "High-Waisted")

**IMPORTANT:**
- Only use exact category values that exist in the index for filtering.
- Search for one product category at a time. If the user asks for multiple types of products (e.g. "leggings and sports bra"), run separate searches for each.`,
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
    "Find men's training shorts",
    "What seamless sets do you have?",
    "Browse hoodies and sweatshirts",
    "Show me gym accessories",
  ] as string[],
};
