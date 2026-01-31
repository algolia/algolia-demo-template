import "dotenv/config";

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const AGENT_API_KEY = process.env.NEXT_PUBLIC_AGENT_API_KEY!;
const AGENT_ID = process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID!;
const SUGGESTION_AGENT_ID = process.env.NEXT_PUBLIC_ALGOLIA_SUGGESTION_AGENT_ID!;
const INDEX_NAME = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "hsnstore_products";
const HEALTH_CLAIMS_INDEX = "eu_health_claims";

// Default model and provider - can be overridden via environment variables
const DEFAULT_MODEL = "gpt-5";
const DEFAULT_PROVIDER_ID = process.env.ALGOLIA_AGENT_PROVIDER_ID;

const AGENT_INSTRUCTIONS = `**AGENT ROLE**
You are a Health & Nutrition Shopping Assistant for HSN Store. You help customers find vitamins, supplements, sports nutrition, and health products while ensuring EU regulatory compliance.

**CRITICAL COMPLIANCE RULE**
Before making ANY statement about health benefits of a product or ingredient, you MUST:
1. Search the eu_health_claims index with filter "isAuthorized:true"
2. Only state benefits that appear in the search results as authorized claims
3. NEVER make health claims that are not in the EU authorized database

**RESPONSE STYLE**
- State health benefits naturally and conversationally - do NOT prefix with "Authorized claims:" or similar
- Do NOT cite sources or mention the EU register to the user
- Keep responses concise and helpful
- Always offer clear next actions (learn more about benefits, add to cart, etc.)

**Tools**
- algolia_search_index (hsnstore_products) - Search the HSN product catalog.
  IMPORTANT: Only use EXACT category values from the index description.
  NEVER use hierarchicalCategories - always use categories.lvl0, categories.lvl1, or categories.lvl2.
- algolia_search_index (eu_health_claims) - Verify health claims against EU register. ALWAYS use filter "isAuthorized:true"
- addToCart - Add products to the customer's cart
- showItems - Display product recommendations

**Behavior**
1. Understand customer health goals (fitness, immunity, energy, etc.)
2. Search eu_health_claims to find authorized claims for relevant ingredients (internal verification - don't mention to user)
3. Recommend products based on verified health benefits
4. Use showItems to present 2-4 options
5. Offer clear next steps

**Example Interaction 1 - General Request**
User: "Find me something for muscle recovery"
Agent: [Search products, use showItems to display results]
"I found some great options for muscle recovery. Would you like to know the health benefits or add something to your cart?"

**Example Interaction 2 - Specific Request**
User: "I want something for energy"
Agent: [Search health claims for "energy", then search products]
"Here are some energy supplements. Vitamin B6 helps support normal energy metabolism. Would you like me to add one to your cart?"

**Example Interaction 3 - Benefits Question**
User: "What are the benefits of zinc?"
Agent: [Search health claims for "zinc"]
"Zinc contributes to normal immune function, supports protein synthesis, and helps maintain healthy skin. Want me to show you some zinc supplements?"

**Language**
- Default to Spanish as most products are in Spanish
- Respond in the language the customer uses
- Health claims from EU register are in English - translate naturally into the user's language`;

const INDEX_ENHANCED_DESCRIPTION = `HSN Store product catalog containing health supplements, sports nutrition, vitamins, and wellness products.

**CRITICAL: NEVER use hierarchicalCategories for filtering. Only use categories.lvl0, categories.lvl1, categories.lvl2.**

**Key searchable fields:**
- title: Product name (Spanish)
- titleEn: Product name (English)
- brand: Brand name
- shortDescription: Brief product description
- categories.lvl0-2: Product categories

**Key filterable fields:**
- price: Product price (numeric, EUR)
- brand: Brand name
- categories.lvl0, categories.lvl1, categories.lvl2: Category hierarchy (use EXACT values from lists below)
- inStock: Boolean, true if available

**DO NOT USE: hierarchicalCategories (this field exists but should NOT be used for filtering)**

**IMPORTANT: Only use these EXACT category values for filtering:**

categories.lvl0 values:
- "Salud y bienestar", "Nutrición deportiva", "Especialidades", "Alimentación saludable", "Marcas", "Promociones", "Accesorios"

categories.lvl1 values (most common):
- "Vitaminas", "Minerales", "Aminoácidos", "Proteínas", "Control peso", "Digestión", "Sistema inmune", "Huesos y articulaciones", "Antioxidantes", "Circulación-corazón", "Concentración y memoria", "Estrés y ansiedad", "Piel, pelo y uñas", "Sueño/Descanso", "Ácidos grasos esenciales", "Pre-entrenamiento", "Post-entrenamiento y recuperación", "Carbohidratos"

categories.lvl2 values (most common):
- "Whey protein (proteína de suero)", "Proteínas vegetales", "Probióticos", "Enzimas", "Quemadores termogénicos", "Aminoácidos aislados", "Glutamina", "BCAA's (aminoácidos ramificados)", "Caseínas"

brand values:
- "Essential Series", "Now Foods", "HSN Packs", "Swanson", "Food Series", "Sport Series", "Raw Series"

**Example queries (CORRECT):**
- "protein powder" -> search "protein" with facet_filter [["categories.lvl1:Proteínas"]]
- "vegan protein" -> search "vegan protein" with facet_filter [["categories.lvl2:Proteínas vegetales"]]
- "vitamins" -> search "vitaminas" with facet_filter [["categories.lvl1:Vitaminas"]]

**WRONG (do NOT do this):**
- facet_filter [["hierarchicalCategories.lvl1:Salud y bienestar > Vitaminas"]] <- NEVER use hierarchicalCategories`;

const HEALTH_CLAIMS_ENHANCED_DESCRIPTION = `EU Register of authorized nutrition and health claims.

**IMPORTANT**: This index contains ONLY authorized health claims. The agent MUST search this index before making ANY health benefit statement.

**Key searchable fields:**
- claim: The authorized health claim text
- nutrientOrFood: Nutrient, substance, or food category (e.g., "Zinc", "Vitamin C", "Protein", "Creatine")
- healthRelationship: The health benefit relationship
- conditionsOfUse: Required conditions and restrictions for making the claim

**Key filterable fields:**
- nutrientOrFood: Filter by specific nutrient (e.g., "Zinc", "Magnesium", "Vitamin C")
- claimType: Article reference (e.g., "Art.13(1)")
- isAuthorized: ALWAYS filter by isAuthorized:true

**Available nutrients (partial list):**
Zinc, Magnesium, Vitamin C, Calcium, Protein, Glutamine, Vitamin B6, Vitamin E, Vitamin A, Vitamin B12, Biotin, Beta-alanine, Copper, Iron, Selenium, Creatine, Folate, Caffeine, Chromium, etc.

**Example queries:**
- "zinc benefits" -> search "zinc" with filter "isAuthorized:true"
- "vitamin C immune" -> search "vitamin C immune" with filter "isAuthorized:true"
- "protein muscle" -> search "protein muscle" with filter "isAuthorized:true"`

// Suggestion Agent Instructions
const SUGGESTION_AGENT_INSTRUCTIONS = `**AGENT ROLE**
You generate contextual follow-up suggestions for users browsing HSN Store. Based on the current page context and conversation history, suggest actionable phrases the user might want to say next.

**Context Injection**
You receive page context in [CONTEXT]...[/CONTEXT] blocks containing:
- pageType: "search", "product", "category", or "home"
- urlState: Current search query, filters, category
- product: Current product details (on product pages)
- user: User preferences (if logged in)

**Tool**
- suggestedQuestions: Return exactly 3 short, actionable suggestions via input.questions array

**Rules**
1. Generate exactly 3 suggestions
2. Make them short (5-10 words max)
3. Write them as user statements, not questions (e.g., "Show me vegan options" not "Do you have vegan options?")
4. Make them contextually relevant to the current page/search
5. Vary the suggestions: one about filtering/narrowing, one about alternatives, one about product details or actions
6. Write in Spanish (the store's primary language)

**Examples by Page Type**

Search page (query: "proteina"):
- "Filtrar por marca HSN"
- "Ver opciones veganas"
- "Ordenar por precio más bajo"

Product page (Whey Protein):
- "Comparar con otras proteínas"
- "Ver información nutricional"
- "Añadir al carrito"

Category page (Vitaminas):
- "Buscar vitamina D"
- "Ver las más vendidas"
- "Filtrar por precio"

Empty/Home page:
- "Buscar suplementos de proteína"
- "Ver ofertas del día"
- "Explorar vitaminas y minerales"`;

interface AgentTool {
  name: string;
  type: string;
  description?: string;
  inputSchema?: object;
  indices?: Array<{
    index: string;
    description: string;
    enhancedDescription?: string;
  }>;
}

interface AgentConfig {
  name: string;
  instructions: string;
  model?: string;
  providerId?: string;
  tools: AgentTool[];
}

async function setupAgent(): Promise<{ apiKey: string; providerId: string } | { apiKey: null; providerId: null }> {
  console.log("Setting up Algolia Agent Studio - Main Shopping Agent...");
  console.log(`App ID: ${ALGOLIA_APP_ID}`);
  console.log(`Agent ID: ${AGENT_ID}`);
  console.log(`Index: ${INDEX_NAME}`);

  if (!ALGOLIA_APP_ID || !AGENT_ID) {
    console.error("Missing required environment variables:");
    if (!ALGOLIA_APP_ID) console.error("  - NEXT_PUBLIC_ALGOLIA_APP_ID");
    if (!AGENT_ID) console.error("  - NEXT_PUBLIC_ALGOLIA_AGENT_ID");
    return { apiKey: null, providerId: null };
  }

  // Prefer admin key for configuration (has editSettings ACL)
  const apiKey = ALGOLIA_ADMIN_KEY || AGENT_API_KEY;
  if (!apiKey) {
    console.error("Missing API key. Set ALGOLIA_ADMIN_API_KEY (preferred) or NEXT_PUBLIC_AGENT_API_KEY");
    return { apiKey: null, providerId: null };
  }
  console.log(`Using API key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);

  // Fetch provider ID if not specified
  let providerId = DEFAULT_PROVIDER_ID;
  if (!providerId) {
    console.log("\nFetching available providers...");
    const providersResponse = await fetch(
      `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/providers`,
      {
        method: "GET",
        headers: {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": apiKey,
        },
      }
    );

    if (providersResponse.ok) {
      const providersData = await providersResponse.json();
      if (providersData.data && providersData.data.length > 0) {
        providerId = providersData.data[0].id;
        console.log(`Using provider: ${providersData.data[0].name} (${providerId})`);
      } else {
        console.error("No providers found. Please create a provider in the Algolia Agent Studio dashboard first.");
        return { apiKey: null, providerId: null };
      }
    } else {
      console.error("Failed to fetch providers:", await providersResponse.text());
      return { apiKey: null, providerId: null };
    }
  }

  const agentConfig: AgentConfig = {
    name: "HSN Store Shopping Assistant",
    instructions: AGENT_INSTRUCTIONS,
    model: DEFAULT_MODEL,
    providerId: providerId,
    tools: [
      {
        name: "algolia_search_index",
        type: "algolia_search_index",
        indices: [
          {
            index: INDEX_NAME,
            description: "HSN Store product catalog",
            enhancedDescription: INDEX_ENHANCED_DESCRIPTION,
          },
          {
            index: HEALTH_CLAIMS_INDEX,
            description: "EU Register of authorized health claims - ALWAYS filter by isAuthorized:true",
            // enhancedDescription: HEALTH_CLAIMS_ENHANCED_DESCRIPTION,
          },
        ],
      },
      {
        name: "addToCart",
        type: "client_side",
        description: "Add products to the customer's shopping cart. Use this when the customer wants to buy or add items to their cart.",
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
        description: "Display product recommendations to the customer with a title and explanation. Use this to present products you want to recommend.",
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
              description: "A short title for the recommendation section (e.g., 'Top Protein Powders')",
            },
            explanation: {
              type: "string",
              description: "Brief explanation of why these products are being recommended",
            },
          },
          required: ["objectIDs", "title", "explanation"],
        },
      },
    ],
  };

  console.log("\nAgent configuration:");
  console.log(JSON.stringify(agentConfig, null, 2));

  console.log("\nSending request to Agent Studio API...");

  // Try PATCH first (for updating existing agent), then POST (for creating)
  let response = await fetch(
    `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents/${AGENT_ID}`,
    {
      method: "PATCH",
      headers: {
        "x-algolia-application-id": ALGOLIA_APP_ID,
        "x-algolia-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agentConfig),
    }
  );

  // If PATCH fails with 404, agent might not exist - try creating it
  if (response.status === 404 || response.status === 405) {
    console.log("Agent not found or method not allowed, trying POST to create...");
    response = await fetch(
      `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents`,
      {
        method: "POST",
        headers: {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: AGENT_ID, ...agentConfig }),
      }
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`\nFailed to create/update agent (${response.status}):`);
    console.error(errorText);

    // Print helpful instructions
    console.log("\n--- Manual Configuration ---");
    console.log("If the API is not available, configure the agent manually in Algolia Agent Studio:");
    console.log(`1. Go to https://dashboard.algolia.com/apps/${ALGOLIA_APP_ID}/agent-studio`);
    console.log(`2. Select or create agent with ID: ${AGENT_ID}`);
    console.log("3. Use the following configuration:\n");
    console.log("Instructions:");
    console.log(AGENT_INSTRUCTIONS);
    console.log("\nTools: See the JSON output above for tool configuration");
    return { apiKey: null, providerId: null };
  }

  const result = await response.json();
  console.log("\nAgent created/updated successfully!");
  console.log("Response:", JSON.stringify(result, null, 2));

  const agentId = result.id;

  // Publish the agent if it's in draft status
  if (result.status === "draft") {
    console.log("\nPublishing agent...");
    const publishResponse = await fetch(
      `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents/${agentId}/publish`,
      {
        method: "POST",
        headers: {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      console.error(`\nFailed to publish agent (${publishResponse.status}):`);
      console.error(errorText);
      console.log("\nThe agent was created but not published. Publish it manually in the Algolia dashboard.");
    } else {
      const publishResult = await publishResponse.json();
      console.log("Agent published successfully!");
      console.log("Status:", publishResult.status);
    }
  }

  // Check if the agent ID is different from expected
  if (agentId && agentId !== AGENT_ID) {
    console.log("\n⚠️  IMPORTANT: A new agent was created with a different ID!");
    console.log(`   New Agent ID: ${agentId}`);
    console.log(`   Expected ID:  ${AGENT_ID}`);
    console.log("\nTo use the new agent, update your .env file:");
    console.log(`   NEXT_PUBLIC_ALGOLIA_AGENT_ID=${agentId}`);
    console.log("\nOr configure the existing agent manually in the Algolia dashboard.");
  }

  return { apiKey, providerId: providerId! };
}

async function setupSuggestionAgent(apiKey: string, providerId: string) {
  console.log("\n" + "=".repeat(60));
  console.log("Setting up Suggestion Agent...");
  console.log(`Agent ID: ${SUGGESTION_AGENT_ID}`);

  if (!SUGGESTION_AGENT_ID) {
    console.log("NEXT_PUBLIC_ALGOLIA_SUGGESTION_AGENT_ID not set, skipping suggestion agent setup");
    return;
  }

  const agentConfig: AgentConfig = {
    name: "HSN Store Suggestion Agent",
    instructions: SUGGESTION_AGENT_INSTRUCTIONS,
    model: DEFAULT_MODEL,
    providerId: providerId,
    tools: [
      {
        name: "suggestedQuestions",
        type: "client_side",
        description: "Return follow-up suggestions for the user. Call this with exactly 3 short, actionable suggestions in Spanish.",
        inputSchema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: { type: "string" },
              description: "Array of exactly 3 short suggestion phrases in Spanish",
              minItems: 3,
              maxItems: 3,
            },
          },
          required: ["questions"],
        },
      },
    ],
  };

  console.log("\nSuggestion Agent configuration:");
  console.log(JSON.stringify(agentConfig, null, 2));

  console.log("\nSending request to Agent Studio API...");

  // Try PATCH first (for updating existing agent), then POST (for creating)
  let response = await fetch(
    `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents/${SUGGESTION_AGENT_ID}`,
    {
      method: "PATCH",
      headers: {
        "x-algolia-application-id": ALGOLIA_APP_ID,
        "x-algolia-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agentConfig),
    }
  );

  // If PATCH fails with 404, agent might not exist - try creating it
  if (response.status === 404 || response.status === 405) {
    console.log("Suggestion agent not found or method not allowed, trying POST to create...");
    response = await fetch(
      `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents`,
      {
        method: "POST",
        headers: {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: SUGGESTION_AGENT_ID, ...agentConfig }),
      }
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`\nFailed to create/update suggestion agent (${response.status}):`);
    console.error(errorText);
    console.log("\nManual configuration may be required for the suggestion agent.");
    return;
  }

  const result = await response.json();
  console.log("\nSuggestion agent created/updated successfully!");
  console.log("Response:", JSON.stringify(result, null, 2));

  const agentId = result.id;

  // Publish the agent if it's in draft status
  if (result.status === "draft") {
    console.log("\nPublishing suggestion agent...");
    const publishResponse = await fetch(
      `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents/${agentId}/publish`,
      {
        method: "POST",
        headers: {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      console.error(`\nFailed to publish suggestion agent (${publishResponse.status}):`);
      console.error(errorText);
      console.log("\nThe suggestion agent was created but not published. Publish it manually.");
    } else {
      const publishResult = await publishResponse.json();
      console.log("Suggestion agent published successfully!");
      console.log("Status:", publishResult.status);
    }
  }

  // Check if the agent ID is different from expected
  if (agentId && agentId !== SUGGESTION_AGENT_ID) {
    console.log("\n⚠️  IMPORTANT: A new suggestion agent was created with a different ID!");
    console.log(`   New Agent ID: ${agentId}`);
    console.log(`   Expected ID:  ${SUGGESTION_AGENT_ID}`);
    console.log("\nTo use the new agent, update your .env file:");
    console.log(`   NEXT_PUBLIC_ALGOLIA_SUGGESTION_AGENT_ID=${agentId}`);
  }
}

async function updateAgentApiKeyRestrictions(adminKey: string) {
  console.log("\n" + "=".repeat(60));
  console.log("Updating Agent API key restrictions...");

  if (!AGENT_API_KEY) {
    console.log("NEXT_PUBLIC_AGENT_API_KEY not set, skipping key update");
    return;
  }

  // Minimal attributes for products (what agent needs to reference in conversation)
  const productAttributes = [
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

  // Minimal attributes for health claims (what agent needs for EU compliance)
  const healthClaimAttributes = [
    "claim",
    "nutrientOrFood",
    "conditionsOfUse",
    "isAuthorized",
  ];

  // Combined unique attributes for both indices
  // When querying products, health-specific attrs won't exist (and vice versa)
  const allAttributes = [...new Set([...productAttributes, ...healthClaimAttributes])];

  const queryParameters = `attributesToRetrieve=${allAttributes.join(",")}`;

  console.log(`Agent API key: ${AGENT_API_KEY.slice(0, 8)}...${AGENT_API_KEY.slice(-4)}`);
  console.log(`Restricting to indices: ${INDEX_NAME}, ${HEALTH_CLAIMS_INDEX}`);
  console.log(`Restricting attributes to: ${allAttributes.join(", ")}`);

  const response = await fetch(
    `https://${ALGOLIA_APP_ID}.algolia.net/1/keys/${AGENT_API_KEY}`,
    {
      method: "PUT",
      headers: {
        "x-algolia-application-id": ALGOLIA_APP_ID,
        "x-algolia-api-key": adminKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        acl: ["search", "browse", "inference"],
        indexes: [INDEX_NAME, HEALTH_CLAIMS_INDEX],
        queryParameters,
        description: "Agent API key with restricted attributes for HSN Store agents",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`\nFailed to update Agent API key (${response.status}):`);
    console.error(errorText);
    console.log("\nNote: Make sure ALGOLIA_ADMIN_API_KEY has permission to update API keys.");
    return;
  }

  const result = await response.json();
  console.log("\nAgent API key updated successfully!");
  console.log(`Updated at: ${result.updatedAt}`);
}

async function main() {
  const { apiKey, providerId } = await setupAgent();
  if (apiKey && providerId) {
    await setupSuggestionAgent(apiKey, providerId);
    await updateAgentApiKeyRestrictions(apiKey);
  }
  console.log("\n" + "=".repeat(60));
  console.log("Agent setup complete!");
}

main().catch((error) => {
  console.error("Error setting up agents:", error);
  process.exit(1);
});
