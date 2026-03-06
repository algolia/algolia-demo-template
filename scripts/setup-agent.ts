import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { AGENT_CONFIG } from "../lib/demo-config/agents";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const ALGOLIA_APP_ID = ALGOLIA_CONFIG.APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const AGENT_API_KEY = ALGOLIA_CONFIG.AGENT_API_KEY;
let AGENT_ID = ALGOLIA_CONFIG.AGENT_ID;
let SUGGESTION_AGENT_ID = ALGOLIA_CONFIG.SUGGESTION_AGENT_ID;
const INDEX_NAME = ALGOLIA_CONFIG.INDEX_NAME;

const ALGOLIA_CONFIG_PATH = path.resolve(__dirname, "../lib/algolia-config.ts");

/**
 * Update a specific key in lib/algolia-config.ts with a new value.
 */
function updateAlgoliaConfig(key: string, value: string) {
  const content = fs.readFileSync(ALGOLIA_CONFIG_PATH, "utf-8");
  // Match the key followed by its value (quoted string, possibly multi-line)
  const regex = new RegExp(`(${key}:\\s*)(?:"[^"]*"|'[^']*'|""|''|\`[^\`]*\`)`, "s");
  const replacement = `$1"${value}"`;
  const updated = content.replace(regex, replacement);
  if (updated === content) {
    console.warn(`Warning: Could not find ${key} in ${ALGOLIA_CONFIG_PATH} to update.`);
    return;
  }
  fs.writeFileSync(ALGOLIA_CONFIG_PATH, updated, "utf-8");
  console.log(`Updated ${key} in lib/algolia-config.ts to "${value}"`);
}

// Default model and provider - can be overridden via environment variables
const DEFAULT_MODEL = "gpt-5";
const DEFAULT_PROVIDER_ID = process.env.ALGOLIA_AGENT_PROVIDER_ID;

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

interface AgentConfigPayload {
  name: string;
  instructions: string;
  model?: string;
  providerId?: string;
  tools: AgentTool[];
}

async function setupAgent(): Promise<{ apiKey: string; providerId: string } | { apiKey: null; providerId: null }> {
  console.log("Setting up Algolia Agent Studio - Main Shopping Agent...");
  console.log(`App ID: ${ALGOLIA_APP_ID}`);
  console.log(`Existing Agent ID: ${AGENT_ID || "(none - will create new)"}`);
  console.log(`Index: ${INDEX_NAME}`);

  if (!ALGOLIA_APP_ID) {
    console.error("Missing required: APP_ID");
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

  const agentConfig: AgentConfigPayload = {
    name: AGENT_CONFIG.main.name,
    instructions: AGENT_CONFIG.main.instructions,
    model: DEFAULT_MODEL,
    providerId: providerId,
    tools: [
      {
        name: "algolia_search_index",
        type: "algolia_search_index",
        indices: [
          {
            index: INDEX_NAME,
            description: "Product catalog",
            enhancedDescription: AGENT_CONFIG.main.indexDescription,
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
    ],
  };

  console.log("\nAgent configuration:");
  console.log(JSON.stringify(agentConfig, null, 2));

  console.log("\nSending request to Agent Studio API...");

  let response: Response;

  if (AGENT_ID) {
    // Try to update existing agent
    console.log(`Attempting to update existing agent ${AGENT_ID}...`);
    response = await fetch(
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

    // If the configured agent no longer exists, fall through to create
    if (response.status === 404 || response.status === 405) {
      console.log(`Agent ${AGENT_ID} not found, creating a new one...`);
      response = await fetch(
        `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents`,
        {
          method: "POST",
          headers: {
            "x-algolia-application-id": ALGOLIA_APP_ID,
            "x-algolia-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(agentConfig),
        }
      );
    }
  } else {
    // No agent ID configured — create a new agent
    console.log("No existing agent ID configured, creating a new agent...");
    response = await fetch(
      `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents`,
      {
        method: "POST",
        headers: {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentConfig),
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
    console.log("2. Create or select an agent");
    console.log("3. Use the following configuration:\n");
    console.log("Instructions:");
    console.log(AGENT_CONFIG.main.instructions);
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

  // Persist the agent ID to config if it's new or changed
  if (agentId && agentId !== AGENT_ID) {
    console.log(`\nAgent ID changed: "${AGENT_ID || ""}" -> "${agentId}"`);
    updateAlgoliaConfig("AGENT_ID", agentId);
    AGENT_ID = agentId;
  }

  return { apiKey, providerId: providerId! };
}

async function setupSuggestionAgent(apiKey: string, providerId: string) {
  console.log("\n" + "=".repeat(60));
  console.log("Setting up Suggestion Agent...");
  console.log(`Existing Agent ID: ${SUGGESTION_AGENT_ID || "(none - will create new)"}`);

  const agentConfig: AgentConfigPayload = {
    name: AGENT_CONFIG.suggestion.name,
    instructions: AGENT_CONFIG.suggestion.instructions,
    model: DEFAULT_MODEL,
    providerId: providerId,
    tools: [
      {
        name: "suggestedQuestions",
        type: "client_side",
        description: "Return follow-up suggestions for the user. Call this with exactly 3 short, actionable suggestions.",
        inputSchema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: { type: "string" },
              description: "Array of exactly 3 short suggestion phrases",
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

  let response: Response;

  if (SUGGESTION_AGENT_ID) {
    console.log(`Attempting to update existing suggestion agent ${SUGGESTION_AGENT_ID}...`);
    response = await fetch(
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

    if (response.status === 404 || response.status === 405) {
      console.log(`Suggestion agent ${SUGGESTION_AGENT_ID} not found, creating a new one...`);
      response = await fetch(
        `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents`,
        {
          method: "POST",
          headers: {
            "x-algolia-application-id": ALGOLIA_APP_ID,
            "x-algolia-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(agentConfig),
        }
      );
    }
  } else {
    console.log("No existing suggestion agent ID configured, creating a new agent...");
    response = await fetch(
      `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents`,
      {
        method: "POST",
        headers: {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentConfig),
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

  // Persist the suggestion agent ID to config if it's new or changed
  if (agentId && agentId !== SUGGESTION_AGENT_ID) {
    console.log(`\nSuggestion Agent ID changed: "${SUGGESTION_AGENT_ID || ""}" -> "${agentId}"`);
    updateAlgoliaConfig("SUGGESTION_AGENT_ID", agentId);
    SUGGESTION_AGENT_ID = agentId;
  }
}

async function updateAgentApiKeyRestrictions(adminKey: string) {
  console.log("\n" + "=".repeat(60));
  console.log("Updating Agent API key restrictions...");

  if (!AGENT_API_KEY) {
    console.log("NEXT_PUBLIC_AGENT_API_KEY not set, skipping key update");
    return;
  }

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

  const queryParameters = `attributesToRetrieve=${productAttributes.join(",")}`;

  console.log(`Agent API key: ${AGENT_API_KEY.slice(0, 8)}...${AGENT_API_KEY.slice(-4)}`);
  console.log(`Restricting to index: ${INDEX_NAME}`);
  console.log(`Restricting attributes to: ${productAttributes.join(", ")}`);

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
        indexes: [INDEX_NAME],
        queryParameters,
        description: "Agent API key with restricted attributes",
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
