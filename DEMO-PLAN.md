# Consum Cooperativa — Demo Plan

**Audience:** Eduardo & Consum team
**Demo URL:** https://consum-demo.netlify.app
**Duration:** ~30 minutes
**Language:** The demo UI and agent respond in Spanish

---

## Part 1: Search & Discovery (10 min)

### 1.1 Homepage & Query Suggestions (Use Case 13)

1. Open the demo homepage
2. Click the search bar and start typing **"choc"**
3. Show how **query suggestions** appear in real time: "chocolate con leche", "chocolate negro", etc.
4. Clear the search and type **"leche"** — show suggestions adapting
5. **Key message:** Autocomplete accelerates search, reduces typos, and guides customers to popular queries

### 1.2 Federated Search: Products + Recipes + Guides

1. Type **"salmón"** in the search bar
2. Show the **three result sections** in the dropdown:
   - **Products** — salmon fillets, smoked salmon, etc.
   - **Recipes** — recipes featuring salmon
   - **Food guides** — nutritional guide for salmon (properties, seasonality, vitamins)
3. **Key message:** A single search returns results across products, recipes, and food knowledge — all powered by Algolia

### 1.3 Category Navigation

1. Open the **Categories** menu from the navbar
2. Navigate into **Frescos > Verduras** — show the hierarchical category structure
3. Browse to **Droguería y limpieza** — show the non-food catalog breadth
4. Click into a category to show the category page with filters and products
5. **Key message:** Full catalog organized in 13 root categories with 40+ subcategories

### 1.4 Filters & Facets

1. From the search page, search for **"queso"**
2. Use the **sidebar filters**:
   - Filter by **brand**
   - Filter by **category** (e.g., "Quesos")
   - Show the **price range slider**
   - Filter by **promotions/groups** (e.g., "Ahora más barato")
3. Show **active filter chips** at the top with the ability to remove them
4. **Key message:** Faceted navigation lets customers refine results precisely

---

## Part 2: Personalization (5 min)

### 2.1 User Profiles (Use Case 15)

1. Click the **user selector** in the navbar
2. Select **"Familia con niños"** (Family with Children)
3. Search for **"desayuno"** — show how results are boosted toward family-friendly, breakfast, and kids' products
4. Open the **"For You"** filter section in the sidebar — show preference-matched facets with scores
5. Switch to **"Vegano"** (Vegan) profile
6. Search **"queso"** again — show how vegan/plant-based options are boosted to the top
7. Switch to **"Ahorro máximo"** (Maximum Savings) profile
8. Show how offers and budget products rise in the ranking
9. **Key message:** Personalization re-ranks results based on the customer's purchase history and preferences — "queso" returns different first results for a vegan vs. a family

### 2.2 User Profile Page

1. Click **"View profile"** on any user
2. Show the **preference breakdown** with affinity scores (0–20) across categories, brands, and groups
3. **Key message:** Each customer builds a taste profile over time that improves their experience

---

## Part 3: Product Page & Recommendations (5 min)

### 3.1 Product Detail Page

1. Click into any product (e.g., a cheese or a fresh product)
2. Show: image gallery, price with discount badge, unit price, brand, category breadcrumb
3. Add the product to the cart — show the cart sheet open with the item
4. **Key message:** Rich product pages with all the info a customer needs to decide

### 3.2 Algolia Recommend (Related & Similar)

1. Scroll down on the product page
2. Show the **"Related Products"** carousel — products frequently bought together
3. Show the **"Looking Similar"** carousel — visually or categorically similar products
4. **Key message:** AI-powered recommendations increase basket size and help customers discover alternatives

### 3.3 Ask AI About This Product (Use Case 12)

1. On a product page, click **"Ask AI About This Product"**
2. Click one of the quick suggestions: **"Alérgenos"**, **"Sustitutos"**, or **"Propiedades"**
3. Show the AI answering with product-specific knowledge
4. Try: **"¿Existe este producto pero sin gluten?"** — the agent searches for gluten-free alternatives
5. **Key message:** Customers can ask natural-language questions about any product and get instant, contextual answers

---

## Part 4: AI Shopping Assistant — Agent Studio (10 min)

Open the **AI Assistant** (brain icon in navbar) for all the following. Each demo below maps to Eduardo's use cases.

### 4.1 Intent-Based Product Search

**Use Case 1 — Crema de verduras:**
1. Type: **"algo para hacer crema de verduras"**
2. Show the agent searching products, applying category filters (Frescos/Verduras), and presenting 3-4 relevant products (vegetables, broth, cream, etc.)
3. Show the **product cards** with prices and "add to cart" actions

**Use Case 8 — Comida para niños:**
4. Type: **"Comida para niños pequeños"**
5. Show the agent filtering by Infantil category and returning baby food, purees, etc.

**Use Case 16 — Más proteína:**
6. Type: **"Quiero comer más proteína"**
7. Show the agent finding high-protein products (meat, legumes, yogurts, tofu)

**Key message:** The agent understands shopping *intent* — not just keywords — and maps vague needs to concrete products with smart filtering

### 4.2 Recipe Workflows

**Use Case 3 — Paella (recipe to cart):**
1. Start a new conversation. Type: **"quiero hacer paella"**
2. Show the agent:
   - Searching the **recipes index** (not products)
   - Calling **showRecipes** with recipe cards
   - Mentioning cooking time and servings
   - Offering to add ingredients to cart
3. Type: **"añade los ingredientes al carrito"**
4. Show the agent calling **addToCart** directly using `ingredientProducts` — **no re-search needed**
5. Open the cart sheet to show the ingredients added

**Use Case 5 — Fajitas:**
6. Start new conversation. Type: **"Quiero preparar fajitas"**
7. Show the agent searching recipes, and if none found, falling back to show relevant products (tortilla kits, chicken, etc.)

**Use Case 9 — Ingredient-based recipe search:**
8. Start new conversation. Type: **"tengo pollo y arroz, ¿qué puedo cocinar?"**
9. Show the agent finding matching recipes
10. Type: **"¿me falta algo más?"**
11. Show the agent identifying missing ingredients and offering to show/add them

**Use Case 7 — Cena para 10:**
12. Type: **"Cena para 10 personas"**
13. Show the agent suggesting a recipe and mentioning serving adjustments (multiplier for 10 people)

**Key message:** The agent handles the full cooking workflow — from recipe discovery to ingredient shopping to cart — all in natural conversation

### 4.3 Dietary Filtering

**Use Case 11 — Sin gluten:**
1. Type: **"Productos sin gluten"**
2. Show the agent using dietary filters and returning gluten-free products

**Use Case 10 — Receta baja en grasas sin lactosa:**
3. Type: **"receta baja en grasas, soy intolerante a la lactosa"**
4. Show the agent searching recipes with `dietaryInfo: "Sin lactosa"` filter and presenting lactose-free, low-fat options

**Key message:** The agent respects dietary restrictions and combines multiple constraints — gluten-free, lactose-free, low-fat — in a single query

### 4.4 Budget & Savings

**Use Case 21 — Gastar menos:**
1. Type: **"Quiero gastar menos este mes"**
2. Show the agent filtering by `offer: true` and showing discounted/promotional products
3. Show prices and discount badges in the results

**Use Case 18 — Cena < 5 euros:**
4. Type: **"Cena rica por menos de 5 euros"**
5. Show the agent handling the budget constraint — either suggesting affordable recipes or products under €5

**Key message:** The agent understands budget intent and leverages Consum's promotions ("Ahora más barato", group offers) to help customers save

### 4.5 Non-Food Products

**Use Case 22 — Limpiar vitrocerámica:**
1. Type: **"Algo para limpiar la vitrocerámica"**
2. Show the agent mapping the need to "Droguería y limpieza" category and returning cleaning products

**Use Case 25 — Ropa limpia:**
3. Type: **"Para que la ropa salga más limpia"**
4. Show the agent returning detergents, stain removers, and fabric softeners

**Key message:** The agent covers the full Consum catalog — not just food. It maps everyday needs to the right product categories

---

## Part 5: Recipe Page (2 min)

1. Navigate to a **recipe page** (from federated search or agent results)
2. Show: recipe image, cooking time, servings, category badges
3. Show the **nutrition info grid**: calories, protein, carbs, fat
4. Scroll to the **Ingredient Product Carousel** — show actual Consum products mapped to each ingredient with "Add to Cart"
5. **Key message:** Recipes are shoppable — every ingredient links directly to purchasable products

---

## Part 6: Checkout (1 min)

1. With items in the cart, open the **cart sheet** — show item list with quantities
2. Navigate to **/checkout**
3. Walk through: shipping info, delivery options (standard/express), payment methods
4. Show the **order summary** with subtotal, shipping, and total
5. **Key message:** Complete end-to-end shopping experience from discovery to purchase

---

## Use Case Coverage Map

| # | Use Case | Demo Section |
|---|----------|-------------|
| 1 | "algo para hacer crema de verduras" | 4.1 |
| 2 | "almuerzo saludable" | 4.1 (mention) |
| 3 | "quiero hacer paella" → ingredients to cart | 4.2 |
| 4 | "cena rápida para dos" | 4.2 (mention) |
| 5 | "quiero preparar fajitas" | 4.2 |
| 6 | "cena ligera esta noche" | 4.2 (similar to cena rápida) |
| 7 | "cena para 10 personas" → adjust quantities | 4.2 |
| 8 | "comida para niños pequeños" | 4.1 |
| 9 | "tengo pollo y arroz, ¿qué puedo cocinar?" → missing ingredients | 4.2 |
| 10 | "receta baja en grasas" + lactose restriction | 4.3 |
| 11 | "productos sin gluten" | 4.3 |
| 12 | "¿existe este producto pero sin gluten?" | 3.3 |
| 13 | Query suggestions ("choc..." → "chocolate con leche") | 1.1 |
| 14 | Search trends / seasonal inspiration | 1.2 (federated) |
| 15 | Personalization by purchase history | 2.1 |
| 16 | "quiero comer más proteína" | 4.1 |
| 17 | "productos locales / proximidad" | (mention in 4.1) |
| 18 | "cena rica por menos de 5 euros" | 4.4 |
| 19 | "cesta barata para la semana" | 4.4 (similar to gastar menos) |
| 20 | "opciones económicas de pescado" | 4.4 (mention) |
| 21 | "quiero gastar menos este mes" | 4.4 |
| 22 | "algo para limpiar la vitrocerámica" | 4.5 |
| 23 | "bolsas para congelar" | 4.5 (mention) |
| 24 | "cosas para organizar la nevera" | 4.5 (mention) |
| 25 | "para que la ropa salga más limpia" | 4.5 |
| 26 | "regalos para San Valentín" | (seasonal campaign, mention) |

---

## Tips for the Demo

- **Clear the agent conversation** between sections to keep context clean
- **Switch user profiles** during Part 2 to make the personalization difference visible
- **Keep the cart visible** during the recipe→cart flow — it's the most impressive moment
- If the agent returns unexpected results, **try rephrasing** — LLM behavior has natural variance
- The agent is limited to **2 searches per message** for efficiency — this is by design
