import { DEMO_CONFIG } from "./index";

export const AGENT_PRODUCT_ATTRIBUTES = [
  "objectID",
  "title",
  "brand",
  "price",
  "normalPrice",
  "unit",
  "priceUnit",
  "offer",
  "groups",
  "promotions",
  "inStock",
  "categories",
  "description",
  "imageUrl",
  "enriched",
];

export const RECIPES_INDEX_ENHANCED_DESCRIPTION = `Consum recipe collection. Each recipe has a title, description, ingredients, categories, and optional nutritional info.

**Key searchable fields:**
- title: Recipe name (e.g., "Arroz negro", "Paella valenciana")
- ingredients: Ingredient names
- categories: Recipe categories (e.g., "Arroces", "Postres", "Ensaladas")
- description: Recipe description
- mealType: Meal type (e.g., "Almuerzo", "Cena")
- dietaryInfo: Dietary information

**Key filterable fields:**
- categories: Recipe category
- mealType: Type of meal
- dietaryInfo: Dietary restrictions
- servings: Number of servings (numeric)
- totalTimeMinutes: Total cooking time in minutes (numeric). Use numeric_filters "totalTimeMinutes <= 30" for quick recipes, "totalTimeMinutes <= 15" for very fast recipes
- calories: Calories per serving (numeric). Use numeric_filters "calories <= 300" for low-calorie recipes. Note: only some recipes have nutritional data
- protein: Protein in grams (numeric). Use numeric_filters "protein >= 20" for high-protein recipes
- carbohydrates: Carbohydrates in grams (numeric)
- fat: Fat in grams (numeric)
- hasNutrition: Boolean, true if nutritional info is available

**Returned fields (only these are available):**
objectID, title, description, imageUrl, servings, totalTimeMinutes, categories, ingredients, ingredientProducts, mealType, dietaryInfo, url, calories, protein, carbohydrates, fat

**ingredientProducts field:** A mapping of ingredient name to an array of product objectIDs from new_consum_products. Use these objectIDs directly with showItems and addToCart instead of searching for ingredients separately. Example: {"Arroz bomba": ["12345", "67890"], "Caldo de pescado": ["22222"]}

**NOT returned (to save context):** instructions, instructionsText, ingredientsFull, qualityScore, likes, comments, slug, id, season, hasNutrition. Do NOT reference these fields.`;

export const GUIDES_INDEX_ENHANCED_DESCRIPTION = `Consum food guides with nutritional information, seasonality, and food properties. Guides cover meats, fruits, vegetables, fish, seafood, and wines.

**Key searchable fields:**
- title: Guide title (e.g., "Manzana", "Salmón", "Ternera")
- tags: Searchable tags
- category: Food category (e.g., "Meats", "Fruits", "Vegetables", "Fish and seafood", "Wines")
- description: Guide description
- properties: Food properties and benefits

**Key filterable fields:**
- category: Food category
- type: Guide type ("product", "category", "wine")
- seasonality: Seasonal availability months
- hasNutrition: Boolean, has nutritional data
- caloriesRange: Calorie range ("0-50", "50-100", "100-200", "200-300", "300+")
- proteinLevel: Protein level ("Low (<2g)", "Medium (2-10g)", "High (>10g)")

**Important:** Guide results contain nutritional info in a nested nutritionalInfo object with calories, fats, proteins, carbohydrates, vitamins, and minerals.`;

export const AGENT_CONFIG = {
  main: {
    name: `${DEMO_CONFIG.brand.name} Shopping Assistant`,
    instructions: `**AGENT ROLE**
You are a Grocery Shopping Assistant for Consum, a Spanish cooperative supermarket. You help customers find groceries, fresh products, beverages, household items, and personal care products. You also help with recipes and food guides. You respond in Spanish by default.

**RESPONSE STYLE**
- Keep responses concise, friendly, and helpful
- When context has "isFirstMessage": true, respond with a single short sentence (max 15 words) \u2014 no product searches, no lists, just a brief greeting or acknowledgment
- Recommend products based on the customer's needs (recipes, dietary preferences, budget, etc.)
- Always offer clear next actions (add to cart, see similar products, filter by brand, etc.)
- Highlight offers and promotions when relevant

**Tools**
- algolia_search_index (new_consum_products) - Search the Consum product catalog
- algolia_search_index (new_consum_recipes) - Search Consum recipes
- algolia_search_index (new_consum_guides) - Search Consum food guides
- addToCart - Add products to the customer's cart
- showItems - Display product recommendations
- showRecipes - Display recipe cards to the customer

**DIETARY FILTERING**
Product catalog dietary categories:
- Gluten-free: search "sin gluten", or categories.lvl1 "Pan sin gluten" / "Sin azúcar, veganos y saludables"
- Vegan: facet_filter groups:"Productos veganos" (8000+ products)
- Organic/Eco: facet_filter categories.lvl0:"Ecológico y saludable"
- Sugar-free: categories.lvl1 "Sin azúcar, veganos y saludables" or "Zumos y néctares sin azúcar"
- Lactose-free: search "sin lactosa"
- Healthy/Diet: categories.lvl1 "Nutrición y dietética"
For recipe dietary filtering: use dietaryInfo facet on new_consum_recipes. Use numeric_filters for fat/calories (e.g., "fat <= 10" for low-fat).

**EXAMPLE — Ingredient Shopping (DO THIS, NOT clarification)**
User: "algo para hacer crema de verduras"
✅ CORRECT: Search products for "calabacín", "puerro", "zanahoria", "patata" (separate short searches), then showItems with a title like "Ingredientes para crema de verduras" and offer to add to cart.
❌ WRONG: Asking "¿Qué tipo de crema quieres?" or "¿Qué verduras prefieres?" — the user expects you to know common ingredients.
❌ WRONG: Searching "ingredientes crema de verduras calabacín puerro zanahoria patata cebolla" in one giant query — this returns poor results. Use one search per ingredient.

**Language**
- Respond in the language the customer uses but default to Spanish
- Use informal but respectful tone (t\u00fa instead of usted)`,

    indexDescription: `Consum cooperative supermarket product catalog (~20,000 products). Includes food, beverages, cleaning, personal care, pets, baby products.

**Key filterable fields:**
- price: Product price (numeric, EUR). Use numeric_filters "price <= 5" for budget queries.
- brand: Brand name
- categories.lvl0: Top-level categories — "Despensa", "Frescos", "Bebidas", "Cuidado personal", "Droguería y limpieza", "Congelados y helados", "Platos preparados", "Bazar", "Mascotas", "Infantil", "Horno", "Ecológico y saludable", "Ahora más barato"
- categories.lvl1: Subcategories — "Lácteos y huevos", "Carnicería", "Pescadería", "Verduras", "Frutas", "Arroz, pastas, legumbres", "Conservas, aceites y condimentos", "Caldos, sopas y purés", "Limpieza hogar", "Cuidado ropa", "Cuidado del cabello", "Nutrición y dietética", "Pan sin gluten", "Sin azúcar, veganos y saludables", "Alimentación infantil", etc.
- categories.lvl2: Fine-grained subcategories
- inStock: Boolean, true if available
- offer: Boolean, true if product is on offer/promotion
- groups: Promotional groups — "Productos veganos" (8400+), "¡Así se ahorra en Consum!", "Ofertas a 1€, 2€ y 3€", "Descubre nuestros Mejor valorados"
- promotions: Active promotions
- unit: Product unit (e.g., "1 Kg", "1 L", "1 Ud")

**Enriched field:** Products have an enriched object with description, keywords, dietaryTags, and useCases for better semantic matching.

**IMPORTANT:** Only use exact category values that exist in your index for filtering. When unsure, use a text query instead of a facet_filter.`,

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
          "Display product recommendations to the customer with a title and explanation.",
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
              description: "Brief explanation of why these products are being recommended",
            },
          },
          required: ["objectIDs", "title", "explanation"],
        },
      },
      {
        name: "showRecipes",
        type: "client_side",
        description:
          "Display recipe cards to the customer. Use after searching new_consum_recipes to present recipe results visually.",
        inputSchema: {
          type: "object",
          properties: {
            objectIDs: {
              type: "array",
              items: { type: "string" },
              description: "Array of recipe objectIDs from the new_consum_recipes index",
            },
            title: {
              type: "string",
              description: "A short title for the recipes section",
            },
            explanation: {
              type: "string",
              description: "Brief explanation of why these recipes are being shown",
            },
          },
          required: ["objectIDs", "title"],
        },
      },
    ],
  },

  fallbackSuggestions: [
    "Buscar ofertas de la semana",
    "Ver productos frescos",
    "Explorar bebidas y refrescos",
    "Encontrar recetas f\u00e1ciles",
    "Buscar productos ecol\u00f3gicos",
  ] as string[],
};
