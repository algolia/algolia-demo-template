import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { AGENT_CONFIG, AGENT_PRODUCT_ATTRIBUTES } from "../lib/demo-config/agents";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const ALGOLIA_APP_ID = ALGOLIA_CONFIG.APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;

const ALGOLIA_CONFIG_PATH = path.resolve(__dirname, "../lib/algolia-config.ts");

// Default model and provider - can be overridden via environment variables
const DEFAULT_MODEL = "gpt-5.3-chat-latest";
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
    searchParameters?: Record<string, unknown>;
  }>;
}

interface AgentConfigPayload {
  name: string;
  instructions: string;
  model?: string;
  providerId?: string;
  tools: AgentTool[];
  config?: { suggestions?: { enabled: boolean } };
}

/**
 * Update a specific key in lib/algolia-config.ts with a new value.
 */
function updateAlgoliaConfig(key: string, value: string) {
  const content = fs.readFileSync(ALGOLIA_CONFIG_PATH, "utf-8");
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

/**
 * Resolve the API key and provider ID needed for agent setup.
 */
async function resolveCredentials(): Promise<{ apiKey: string; providerId: string } | null> {
  if (!ALGOLIA_APP_ID) {
    console.error("Missing required: APP_ID");
    return null;
  }

  const apiKey = ALGOLIA_ADMIN_KEY;
  if (!apiKey) {
    console.error("Missing API key. Set ALGOLIA_ADMIN_API_KEY in .env");
    return null;
  }
  console.log(`Using API key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);

  let providerId = DEFAULT_PROVIDER_ID;
  if (!providerId) {
    console.log("Fetching available providers...");
    const res = await fetch(
      `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/providers`,
      {
        method: "GET",
        headers: {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": apiKey,
        },
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch providers:", await res.text());
      return null;
    }

    const data = await res.json();
    if (!data.data?.length) {
      console.error("No providers found. Create one in the Algolia Agent Studio dashboard first.");
      return null;
    }

    providerId = data.data[0].id;
    console.log(`Using provider: ${data.data[0].name} (${providerId})`);
  }

  return { apiKey, providerId: providerId! };
}

/**
 * Create or update an agent, then publish it if in draft status.
 * Returns the agent ID on success, or null on failure.
 */
async function upsertAndPublishAgent(
  config: AgentConfigPayload,
  existingId: string,
  configKey: string,
  apiKey: string
): Promise<string | null> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Setting up ${config.name}...`);
  console.log(`Existing ID: ${existingId || "(none — will create new)"}`);

  const headers = {
    "x-algolia-application-id": ALGOLIA_APP_ID,
    "x-algolia-api-key": apiKey,
    "Content-Type": "application/json",
  };
  const baseUrl = `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents`;
  const body = JSON.stringify(config);

  let response: Response;

  if (existingId) {
    console.log(`Updating existing agent ${existingId}...`);
    response = await fetch(`${baseUrl}/${existingId}`, { method: "PATCH", headers, body });

    if (response.status === 404 || response.status === 405) {
      console.log(`Agent ${existingId} not found, creating a new one...`);
      response = await fetch(baseUrl, { method: "POST", headers, body });
    }
  } else {
    console.log("Creating new agent...");
    response = await fetch(baseUrl, { method: "POST", headers, body });
  }

  if (!response.ok) {
    console.error(`Failed to create/update agent (${response.status}):`, await response.text());
    console.log(`\nManual setup: https://dashboard.algolia.com/apps/${ALGOLIA_APP_ID}/agent-studio`);
    return null;
  }

  const result = await response.json();
  console.log("Agent created/updated successfully!");

  const agentId: string = result.id;

  // Publish if draft
  if (result.status === "draft") {
    console.log("Publishing agent...");
    const pubRes = await fetch(`${baseUrl}/${agentId}/publish`, { method: "POST", headers });
    if (!pubRes.ok) {
      console.error(`Failed to publish (${pubRes.status}):`, await pubRes.text());
      console.log("The agent was created but not published. Publish it manually in the dashboard.");
    } else {
      console.log("Agent published successfully!");
    }
  }

  // Persist the agent ID to config if changed
  if (agentId !== existingId) {
    console.log(`Agent ID changed: "${existingId || ""}" -> "${agentId}"`);
    updateAlgoliaConfig(configKey, agentId);
  }

  return agentId;
}

async function main() {
  console.log(`App ID: ${ALGOLIA_APP_ID}`);
  console.log(`Index: ${ALGOLIA_CONFIG.INDEX_NAME}`);

  const creds = await resolveCredentials();
  if (!creds) return;

  const { apiKey, providerId } = creds;

  await upsertAndPublishAgent(
    {
      name: AGENT_CONFIG.main.name,
      instructions: AGENT_CONFIG.main.instructions,
      model: DEFAULT_MODEL,
      providerId,
      tools: AGENT_CONFIG.main.tools,
      config: { suggestions: { enabled: true } },
    },
    ALGOLIA_CONFIG.AGENT_ID,
    "AGENT_ID",
    apiKey
  );

  console.log(`\n${"=".repeat(60)}`);
  console.log("Agent setup complete!");
}

main().catch((error) => {
  console.error("Error setting up agents:", error);
  process.exit(1);
});