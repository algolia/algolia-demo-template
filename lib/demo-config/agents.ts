import { ALGOLIA_CONFIG } from "../algolia-config";
import { DEMO_CONFIG } from "./index";

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
  "gender",
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
5. Consider activity type, fit preference, and gender when recommending

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
- price: Product price (numeric, USD)
- brand: "Gymshark"
- hierarchical_categories.lvl0: Top-level category ("Men", "Women", "Accessories", "Unisex")
- hierarchical_categories.lvl1: Sub-category as "Parent > Child" (e.g. "Women > Leggings", "Women > Sports Bras", "Women > Shorts", "Women > T-Shirts & Tops", "Women > Crop Tops", "Women > Sleeveless & Tank Tops", "Women > Pants", "Women > Hoodies & Sweatshirts", "Women > Long Sleeves", "Women > Jackets & Outerwear", "Men > T-Shirts & Tops", "Men > Shorts", "Men > Sleeveless & Tank Tops", "Men > Hoodies & Sweatshirts", "Men > Pants", "Men > Long Sleeves", "Men > Jackets & Outerwear", "Accessories > Bags", "Accessories > Socks", "Accessories > Headwear", "Accessories > Bottles & Shakers")
- stock.in_stock: Boolean, true if in stock
- color.filter_group: Color (e.g. "black", "grey", "blue", "green", "white", "pink")
- available_sizes: Array of size strings (e.g. ["xs", "s", "m", "l", "xl"])
- gender: "Men" or "Women"

**IMPORTANT:**
- Only use exact category values for filtering.
- Search for one category at a time.
- Map customer activities to Gymshark product categories (e.g. running → Shorts, T-Shirts & Tops; weightlifting → Pants, Hoodies & Sweatshirts, Sleeveless & Tank Tops).`,
            searchParameters: {
              attributesToRetrieve: [
                "objectID", "name", "brand", "price", "description",
                "hierarchical_categories", "stock", "color", "primary_image",
                "url", "available_sizes", "gender",
              ],
            },
          },
        ],
      },
      {
        name: "addToCart",
        type: "client_side",
        description: "Add products to the customer's shopping cart.",
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
        description: "Display product recommendations with a title and explanation.",
        inputSchema: {
          type: "object",
          properties: {
            objectIDs: {
              type: "array",
              items: { type: "string" },
              description: "Array of product objectIDs to display",
            },
            title: { type: "string", description: "Short title for the recommendation section" },
            explanation: { type: "string", description: "Brief explanation of why these products are recommended" },
          },
          required: ["objectIDs", "title", "explanation"],
        },
      },
    ],
  },

  fallbackSuggestions: [
    "Show me women's leggings",
    "Find men's training shorts",
    "Browse new gym wear",
    "Show me running gear",
    "Find a sports bra for high impact",
  ] as string[],
};
