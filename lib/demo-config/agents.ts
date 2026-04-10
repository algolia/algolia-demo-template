/**
 * Agent Studio configuration for e-commerce shopping assistant
 */
import { ALGOLIA_CONFIG } from "../algolia-config";
import { DEMO_CONFIG } from "./index";

export const AGENT_PRODUCT_ATTRIBUTES = [
  "objectID",
  "name",
  "brand",
  "price",
  "description",
  "hierarchical_categories",
  "primary_image",
];

export const AGENT_CONFIG = {
  main: {
    name: `${DEMO_CONFIG.brand.agentName}`,
    instructions: `**AGENT ROLE**
You are ${DEMO_CONFIG.brand.agentName}, an intelligent shopping assistant for ${DEMO_CONFIG.brand.name}. You help customers discover products, compare options, and make informed purchase decisions.

**RESPONSE STYLE**
- Always respond in English
- Be concise, helpful, and friendly
- When context has "isFirstMessage": true, respond with a short greeting (max 15 words) — no searches, just a brief welcome based on the page context
- When presenting products, highlight key features, price, and brand
- Format citations: [Product Name](URL)

**TOOLS**
- algolia_search_index — Search the product catalog
- showItems — Display product recommendations to the customer
- addToCart — Add items to the shopping cart
- showArticles — Display articles or content pages

**BEHAVIOUR**
1. Understand the customer's intent
2. Search for relevant products with algolia_search_index
3. Summarise key findings in 2-4 sentences
4. Display top results using showItems
5. Offer follow-up actions (related products, add to cart, more details)

**FILTERING**
- Use filters on hierarchical_categories.lvl0 for top-level categories
- Use filters on brand for brand-specific searches
- Use price ranges when the customer specifies a budget

**PERSONALISATION**
- When user preferences are provided in context, tailor recommendations accordingly
- Mention why a product matches the user's interests when relevant`,

    indexDescription: `Product catalog for ${DEMO_CONFIG.brand.name}. Each record is a product with full details.

**Searchable attributes:**
- name: Product name
- brand: Brand name
- description: Product description
- hierarchical_categories: Category hierarchy

**Filterable attributes:**
- hierarchical_categories.lvl0: Top-level category (Fashion, Electronics, Home, Sports)
- hierarchical_categories.lvl1: Subcategory
- brand: Brand name
- price: Product price (numeric)

**IMPORTANT:** Use exact category and brand values that exist in the index for filtering.`,

    tools: [
      {
        name: "algolia_search_index",
        type: "algolia_search_index",
        indices: [
          {
            index: ALGOLIA_CONFIG.INDEX_NAME,
            description: "Product catalog",
            enhancedDescription: `Product catalog for ${DEMO_CONFIG.brand.name}.

**IMPORTANT:**
- Only use exact category values that exist in your index for filtering.
- Search for one topic at a time. If the user asks for multiple topics, run separate searches for each rather than combining them into one query.`,
            searchParameters: {
              attributesToRetrieve: AGENT_PRODUCT_ATTRIBUTES,
            },
          },
        ],
      },
      {
        name: "showItems",
        type: "client_side",
        description:
          "Display products to the customer with a title and explanation. Use this to present search results or recommendations.",
        inputSchema: {
          type: "object",
          properties: {
            objectIDs: {
              type: "array",
              items: { type: "string" },
              description: "Array of objectIDs of the products to display",
            },
            title: {
              type: "string",
              description: "Short title for the results section",
            },
            explanation: {
              type: "string",
              description: "Brief explanation of why these products are shown",
            },
          },
          required: ["objectIDs", "title", "explanation"],
        },
      },
      {
        name: "addToCart",
        type: "client_side",
        description:
          "Add a product to the customer's shopping cart. Use when the customer wants to buy or save an item.",
        inputSchema: {
          type: "object",
          properties: {
            objectID: {
              type: "string",
              description: "The objectID of the product to add to cart",
            },
            quantity: {
              type: "number",
              description: "Number of items to add (default 1)",
            },
          },
          required: ["objectID"],
        },
      },
      {
        name: "showArticles",
        type: "client_side",
        description:
          "Display articles or content pages to the customer. Use for guides, blog posts, or informational content.",
        inputSchema: {
          type: "object",
          properties: {
            objectIDs: {
              type: "array",
              items: { type: "string" },
              description: "Array of objectIDs of the articles to display",
            },
            title: {
              type: "string",
              description: "Short title for the articles section",
            },
            explanation: {
              type: "string",
              description: "Brief explanation of why these articles are shown",
            },
          },
          required: ["objectIDs", "title", "explanation"],
        },
      },
    ],
  },

  fallbackSuggestions: [
    "What are the best deals today?",
    "Show me new arrivals",
    "Help me find a gift",
    "What's trending right now?",
    "Compare products for me",
  ] as string[],

  suggestions: {
    enabled: true,
  },
};
