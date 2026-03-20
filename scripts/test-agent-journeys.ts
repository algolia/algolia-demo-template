import "dotenv/config";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";
import { AGENT_CONFIG } from "../lib/demo-config/agents";

// ============================================================================
// Types
// ============================================================================

interface ToolCall {
  name: string;
  toolCallId: string;
  input: Record<string, any>;
  output?: Record<string, any>;
}

interface TurnTrace {
  userMessage: string;
  assistantText: string;
  toolCalls: ToolCall[];
  rawParts: any[];
}

interface TurnDefinition {
  userMessage: string;
  rubric: string; // For human/agent review
}

interface JourneyDefinition {
  name: string;
  group: string;
  turns: TurnDefinition[];
}

interface TurnResult {
  turn: TurnDefinition;
  trace: TurnTrace;
  durationMs: number;
}

interface JourneyResult {
  journey: JourneyDefinition;
  turns: TurnResult[];
  durationMs: number;
  error?: string;
}

// ============================================================================
// Config
// ============================================================================

const APP_ID = ALGOLIA_CONFIG.APP_ID;
const AGENT_ID = ALGOLIA_CONFIG.AGENT_ID;
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
const API_URL = `https://${APP_ID}.algolia.net/agent-studio/1/agents/${AGENT_ID}/completions?stream=true&compatibilityMode=ai-sdk-5`;

const DEFAULT_CONTEXT = {
  page: { path: "/", url: "https://consum-demo.netlify.app/", pageType: "search" },
  algolia: {
    indexName: ALGOLIA_CONFIG.INDEX_NAME,
    searchState: { filters: {} },
  },
  isFirstMessage: false,
};

// ============================================================================
// Journey Definitions
// ============================================================================

const JOURNEYS: JourneyDefinition[] = [
  // Group 1: Intent-Based Product Search
  {
    name: "Crema de verduras",
    group: "Intent-Based Product Search",
    turns: [{
      userMessage: "algo para hacer crema de verduras",
      rubric: "Must search products. Must call showItems with ≥2 products. Products should be relevant to making vegetable soup (vegetables, cream, broth, etc.)",
    }],
  },
  {
    name: "Almuerzo saludable",
    group: "Intent-Based Product Search",
    turns: [{
      userMessage: "almuerzo saludable",
      rubric: "Must search recipes or products. Must call showRecipes or showItems. Results should be healthy/nutritious options suitable for lunch",
    }],
  },
  {
    name: "Cena rápida para dos",
    group: "Intent-Based Product Search",
    turns: [{
      userMessage: "Cena rápida para dos",
      rubric: "Must search recipes or products. Must call showRecipes or showItems. Results should be quick-to-prepare dinner items. Response should acknowledge the 'for two' aspect",
    }],
  },
  {
    name: "Comida para niños",
    group: "Intent-Based Product Search",
    turns: [{
      userMessage: "Comida para niños pequeños",
      rubric: "Must search products. Must call showItems. Products should be child-appropriate food. Should use category filters or search terms relevant to children's food",
    }],
  },

  // Group 2: Recipe Workflows
  {
    name: "Paella (recipe→cart)",
    group: "Recipe Workflows",
    turns: [
      {
        userMessage: "quiero hacer paella",
        rubric: "Must search recipes index (not products). Must call showRecipes. Should mention recipe details (time, servings). Should offer to add ingredients to cart.",
      },
      {
        userMessage: "añade los ingredientes al carrito",
        rubric: "Must call addToCart. Should use ingredientProducts from the recipe — must NOT re-search products index for ingredients. Should add multiple items.",
      },
    ],
  },
  {
    name: "Fajitas",
    group: "Recipe Workflows",
    turns: [{
      userMessage: "Quiero preparar fajitas",
      rubric: "Must search recipes index. Should call showRecipes if results found, or offer product alternatives via showItems. Must call showRecipes or showItems.",
    }],
  },
  {
    name: "Pollo y arroz (→recipe→missing)",
    group: "Recipe Workflows",
    turns: [
      {
        userMessage: "tengo pollo y arroz, ¿qué puedo cocinar?",
        rubric: "Must search recipes index with pollo/arroz. Must call showRecipes.",
      },
      {
        userMessage: "¿me falta algo más?",
        rubric: "Should identify missing ingredients from the recipe and show them via showItems. Should distinguish between what the user already has (pollo, arroz) and what they need.",
      },
    ],
  },
  {
    name: "Cena para 10",
    group: "Recipe Workflows",
    turns: [{
      userMessage: "Cena para 10 personas",
      rubric: "Must search recipes or products. Response MUST mention quantity/serving adjustment for 10 people (multiplier, scaling, etc.)",
    }],
  },

  // Group 3: Dietary Filtering
  {
    name: "Sin gluten",
    group: "Dietary Filtering",
    turns: [{
      userMessage: "Productos sin gluten",
      rubric: "Must search products with gluten-free filtering (facet_filters on categories containing 'sin gluten' or dietary tags). Must call showItems with ≥2 products.",
    }],
  },
  {
    name: "Receta baja en grasas sin lactosa",
    group: "Dietary Filtering",
    turns: [{
      userMessage: "receta baja en grasas, soy intolerante a la lactosa",
      rubric: "Must search recipes index. Should apply filters for low-fat AND lactose-free. Must call showRecipes. Response should acknowledge the lactose intolerance.",
    }],
  },

  // Group 4: Budget-Conscious
  {
    name: "Cena < 5 euros",
    group: "Budget-Conscious",
    turns: [{
      userMessage: "Cena rica por menos de 5 euros",
      rubric: "Must search products or recipes. Must call showItems or showRecipes. Response should acknowledge the budget constraint (≤5 euros). If searching products, should use numeric_filters on price or offer filters.",
    }],
  },
  {
    name: "Gastar menos",
    group: "Budget-Conscious",
    turns: [{
      userMessage: "Quiero gastar menos este mes",
      rubric: "Must search products. Should use offer/promotion filters (offer:true, budget groups, or 'Ahora más barato' category). Must call showItems. Response should emphasize savings/deals.",
    }],
  },

  // Group 5: Non-Food & Goals
  {
    name: "Limpiar vitrocerámica",
    group: "Non-Food & Goals",
    turns: [{
      userMessage: "Algo para limpiar la vitrocerámica",
      rubric: "Must search products. Must call showItems. Products should be cleaning products relevant to ceramic cooktops (not food). Should use appropriate category filters.",
    }],
  },
  {
    name: "Ropa limpia",
    group: "Non-Food & Goals",
    turns: [{
      userMessage: "Para que la ropa salga más limpia",
      rubric: "Must search products. Must call showItems. Products should be laundry detergents/additives (not food). Should map the need to cleaning products.",
    }],
  },
  {
    name: "Más proteína",
    group: "Non-Food & Goals",
    turns: [{
      userMessage: "Quiero comer más proteína",
      rubric: "Must search products. Must call showItems. Products should be high-protein items (meat, eggs, legumes, protein supplements, etc.)",
    }],
  },
];

// ============================================================================
// SSE Parsing (AI SDK 5 data protocol)
// ============================================================================

interface ParsedSSEResponse {
  text: string;
  toolCalls: ToolCall[];
  parts: any[];
  finishReason?: string;
}

function parseSSEStream(rawText: string): ParsedSSEResponse {
  const lines = rawText.split("\n").filter(Boolean);
  let text = "";
  const toolCalls: ToolCall[] = [];
  const parts: any[] = [];
  let finishReason: string | undefined;

  // Track tool calls by ID for matching input/output
  const toolCallMap = new Map<string, ToolCall>();

  for (const line of lines) {
    // Agent Studio SSE format: "data: {JSON}" or "data: [DONE]"
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6);
    if (data === "[DONE]") continue;

    try {
      const event = JSON.parse(data);

      switch (event.type) {
        case "text-delta": {
          text += event.textDelta || "";
          parts.push({ type: "text", text: event.textDelta });
          break;
        }
        case "tool-input-available": {
          // Finalized tool call with parsed input
          const tc: ToolCall = {
            name: event.toolName,
            toolCallId: event.toolCallId,
            input: event.input || {},
          };
          toolCallMap.set(event.toolCallId, tc);
          toolCalls.push(tc);
          parts.push({ type: "tool_call", ...event });
          break;
        }
        case "tool-output-available": {
          // Server-side tool result
          const tc = toolCallMap.get(event.toolCallId);
          if (tc) tc.output = event.output;
          parts.push({ type: "tool_result", ...event });
          break;
        }
        case "data-suggestions": {
          parts.push({ type: "data", data: event.data });
          break;
        }
        case "finish": {
          finishReason = "stop";
          parts.push({ type: "finish" });
          break;
        }
        default: {
          // start, start-step, finish-step, tool-input-start, tool-input-delta — skip
          break;
        }
      }
    } catch {
      // Skip unparseable lines
    }
  }

  return { text, toolCalls, parts, finishReason };
}

// ============================================================================
// Agent API Communication
// ============================================================================

type Message = {
  role: "user" | "assistant";
  parts: any[];
};

async function sendToAgent(messages: Message[]): Promise<ParsedSSEResponse> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-algolia-application-id": APP_ID,
      "x-algolia-api-key": ADMIN_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Agent API error ${res.status}: ${errText}`);
  }

  const rawText = await res.text();
  return parseSSEStream(rawText);
}

function makeContextMessage(): Message {
  return {
    role: "user",
    parts: [{ type: "text", text: `[CONTEXT]${JSON.stringify(DEFAULT_CONTEXT)}[/CONTEXT]` }],
  };
}

function makeUserMessage(text: string): Message {
  return {
    role: "user",
    parts: [{ type: "text", text }],
  };
}

function makeAssistantMessage(text: string, toolCalls: ToolCall[]): Message {
  const parts: any[] = [];

  if (text) {
    parts.push({ type: "text", text });
  }

  for (const tc of toolCalls) {
    // AI SDK 5 ToolPartV5 format — state must be "output-available", field is "output"
    parts.push({
      type: "tool-invocation",
      toolCallId: tc.toolCallId,
      toolName: tc.name,
      args: tc.input,
      state: "output-available",
      output: tc.output,
    });
  }

  return { role: "assistant", parts };
}

// ============================================================================
// Mock Tool Results
// ============================================================================

function mockToolResult(tc: ToolCall): Record<string, any> {
  switch (tc.name) {
    case "showItems":
      return {
        status: "Successfully showed items",
        products: (tc.input.objectIDs || []).map((id: string) => ({ objectID: id, title: `Product ${id}` })),
        title: tc.input.title,
        explanation: tc.input.explanation,
      };
    case "showRecipes":
      return {
        status: "Successfully showed recipes",
        recipes: (tc.input.objectIDs || []).map((id: string) => ({ objectID: id, title: `Recipe ${id}` })),
        title: tc.input.title,
        explanation: tc.input.explanation,
      };
    case "addToCart":
      return {
        status: "Successfully added to cart",
        products: (tc.input.objectIDs || []).map((id: string) => ({ objectID: id, title: `Product ${id}` })),
      };
    default:
      return { status: "ok" };
  }
}

// ============================================================================
// Journey Runner
// ============================================================================

async function runTurn(
  turnDef: TurnDefinition,
  history: Message[]
): Promise<{ trace: TurnTrace; updatedHistory: Message[] }> {
  // Add user message to history
  const userMsg = makeUserMessage(turnDef.userMessage);
  history = [...history, userMsg];

  let fullText = "";
  let allToolCalls: ToolCall[] = [];
  let allParts: any[] = [];

  // Loop: send, handle client-side tool calls, re-send if needed
  let maxIterations = 5;
  while (maxIterations-- > 0) {
    const response = await sendToAgent(history);

    fullText += response.text;
    allParts.push(...response.parts);

    // Separate server-side tool calls (algolia_search_index) from client-side ones
    const clientToolCalls = response.toolCalls.filter(
      (tc) => ["showItems", "showRecipes", "addToCart"].includes(tc.name)
    );
    const serverToolCalls = response.toolCalls.filter(
      (tc) => !["showItems", "showRecipes", "addToCart"].includes(tc.name)
    );

    // Server-side tool calls already have outputs from the SSE stream
    allToolCalls.push(...serverToolCalls);

    if (clientToolCalls.length === 0) {
      // No client-side tools to handle, we're done
      // Add final assistant message to history
      history = [...history, makeAssistantMessage(fullText, [...serverToolCalls])];
      break;
    }

    // Mock client-side tool results
    for (const tc of clientToolCalls) {
      tc.output = mockToolResult(tc);
      allToolCalls.push(tc);
    }

    // Add assistant message with tool results to history and continue
    const allResolved = [...serverToolCalls, ...clientToolCalls];
    history = [...history, makeAssistantMessage(response.text, allResolved)];

    // Check if finish reason indicates we need to continue
    if (response.finishReason === "stop") break;
  }

  const trace: TurnTrace = {
    userMessage: turnDef.userMessage,
    assistantText: fullText,
    toolCalls: allToolCalls,
    rawParts: allParts,
  };

  return { trace, updatedHistory: history };
}

async function runJourney(journey: JourneyDefinition): Promise<JourneyResult> {
  const start = Date.now();
  const turnResults: TurnResult[] = [];

  // Start with context message
  let history: Message[] = [makeContextMessage()];

  try {
    for (const turnDef of journey.turns) {
      const turnStart = Date.now();
      const { trace, updatedHistory } = await runTurn(turnDef, history);
      history = updatedHistory;
      turnResults.push({
        turn: turnDef,
        trace,
        durationMs: Date.now() - turnStart,
      });
    }
  } catch (error: any) {
    return {
      journey,
      turns: turnResults,
      durationMs: Date.now() - start,
      error: error.message,
    };
  }

  return {
    journey,
    turns: turnResults,
    durationMs: Date.now() - start,
  };
}

// ============================================================================
// Algorithmic Checks (basic, no AI)
// ============================================================================

interface CheckResult {
  label: string;
  pass: boolean;
  detail?: string;
}

function runAlgorithmicChecks(trace: TurnTrace, rubric: string): CheckResult[] {
  const results: CheckResult[] = [];
  const toolNames = trace.toolCalls.map((tc) => tc.name);
  const searchCalls = trace.toolCalls.filter((tc) => tc.name === "algolia_search_index");

  // Helper: check search indexes
  const productSearches = searchCalls.filter(
    (tc) => tc.input.index === "new_consum_products" || tc.input.indexName === "new_consum_products"
  );
  const recipeSearches = searchCalls.filter(
    (tc) => tc.input.index === "new_consum_recipes" || tc.input.indexName === "new_consum_recipes"
  );
  const showItemsCalls = trace.toolCalls.filter((tc) => tc.name === "showItems");
  const showRecipesCalls = trace.toolCalls.filter((tc) => tc.name === "showRecipes");
  const totalItems = showItemsCalls.reduce((sum, tc) => sum + (tc.input.objectIDs?.length || 0), 0);

  // Check: Search index requirements (check "or" variants first to avoid substring false matches)
  const searchRubricOr = rubric.includes("Must search products or recipes") || rubric.includes("Must search recipes or products");
  if (searchRubricOr) {
    const anySearch = productSearches.length > 0 || recipeSearches.length > 0;
    results.push({
      label: "Searched products or recipes index",
      pass: anySearch,
      detail: anySearch
        ? `products: ${productSearches.length}, recipes: ${recipeSearches.length}`
        : "No product or recipe searches found",
    });
  } else if (rubric.includes("Must search products")) {
    results.push({
      label: "Searched products index",
      pass: productSearches.length > 0,
      detail: productSearches.length > 0
        ? `${productSearches.length} search(es), queries: ${productSearches.map((s) => JSON.stringify(s.input.query || s.input.q || s.input.params?.query)).join(", ")}`
        : "No product searches found",
    });
  } else if (rubric.includes("Must search recipes")) {
    results.push({
      label: "Searched recipes index",
      pass: recipeSearches.length > 0,
      detail: recipeSearches.length > 0
        ? `${recipeSearches.length} search(es), queries: ${recipeSearches.map((s) => JSON.stringify(s.input.query || s.input.q || s.input.params?.query)).join(", ")}`
        : "No recipe searches found",
    });
  }

  // Check: Display tool requirements (supports "or" conditions)
  if (rubric.includes("Must call showItems or showRecipes") || rubric.includes("Must call showRecipes or showItems")) {
    const anyShow = showItemsCalls.length > 0 || showRecipesCalls.length > 0;
    results.push({
      label: "Called showItems or showRecipes",
      pass: anyShow,
      detail: anyShow
        ? `showItems: ${totalItems} items, showRecipes: ${showRecipesCalls.reduce((s, tc) => s + (tc.input.objectIDs?.length || 0), 0)} recipes`
        : "Neither showItems nor showRecipes called",
    });
  } else if (rubric.includes("Must call showItems")) {
    results.push({
      label: "Called showItems",
      pass: showItemsCalls.length > 0,
      detail: showItemsCalls.length > 0 ? `${totalItems} product(s) shown` : "showItems not called",
    });

    // Check minimum items if specified
    if (rubric.includes("≥2 products")) {
      results.push({
        label: "Showed ≥2 products",
        pass: totalItems >= 2,
        detail: `${totalItems} products`,
      });
    }
  } else if (rubric.includes("Must call showRecipes")) {
    results.push({
      label: "Called showRecipes",
      pass: showRecipesCalls.length > 0,
      detail: showRecipesCalls.length > 0
        ? `${showRecipesCalls.reduce((s, tc) => s + (tc.input.objectIDs?.length || 0), 0)} recipe(s)`
        : "showRecipes not called",
    });
  }

  // Check: Must call addToCart
  if (rubric.includes("Must call addToCart")) {
    const cartCalls = trace.toolCalls.filter((tc) => tc.name === "addToCart");
    results.push({
      label: "Called addToCart",
      pass: cartCalls.length > 0,
      detail: cartCalls.length > 0
        ? `${cartCalls.reduce((s, tc) => s + (tc.input.objectIDs?.length || 0), 0)} item(s)`
        : "addToCart not called",
    });
  }

  // Check: Should NOT re-search products
  if (rubric.includes("must NOT re-search products")) {
    const productSearches = searchCalls.filter(
      (tc) => tc.input.index === "new_consum_products" || tc.input.indexName === "new_consum_products"
    );
    results.push({
      label: "Did not re-search products",
      pass: productSearches.length === 0,
      detail: productSearches.length === 0
        ? "Correctly used ingredientProducts"
        : `Unnecessarily searched products ${productSearches.length} time(s)`,
    });
  }

  // Check: Search filters
  for (const search of searchCalls) {
    const params = search.input.params || search.input;
    if (params.facetFilters || params.facet_filters) {
      results.push({
        label: `Filters on ${search.input.index || search.input.indexName}`,
        pass: true,
        detail: JSON.stringify(params.facetFilters || params.facet_filters),
      });
    }
    if (params.numericFilters || params.numeric_filters) {
      results.push({
        label: `Numeric filters on ${search.input.index || search.input.indexName}`,
        pass: true,
        detail: JSON.stringify(params.numericFilters || params.numeric_filters),
      });
    }
  }

  return results;
}

// ============================================================================
// Output Formatting
// ============================================================================

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function c(color: keyof typeof COLORS, text: string): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printJourneyResult(result: JourneyResult, verbose: boolean) {
  console.log(`\n${c("bold", c("blue", `[JOURNEY]`))} ${c("bold", result.journey.name)} ${c("dim", `(${result.journey.group})`)}`);

  if (result.error) {
    console.log(`  ${c("red", "✗ ERROR:")} ${result.error}`);
    return;
  }

  let journeyPassed = true;
  let turnsPassed = 0;

  for (let i = 0; i < result.turns.length; i++) {
    const tr = result.turns[i];
    console.log(`  ${c("cyan", `[TURN ${i + 1}]`)} "${tr.turn.userMessage}" ${c("dim", `(${(tr.durationMs / 1000).toFixed(1)}s)`)}`);

    // Print tool calls summary
    const toolSummary = tr.trace.toolCalls.map((tc) => {
      if (tc.name === "algolia_search_index") {
        const idx = tc.input.index || tc.input.indexName || "?";
        const q = tc.input.query || tc.input.q || tc.input.params?.query || "";
        const filters = tc.input.params?.facetFilters || tc.input.facetFilters || tc.input.facet_filters || tc.input.params?.facet_filters;
        const numFilters = tc.input.params?.numericFilters || tc.input.numericFilters || tc.input.numeric_filters || tc.input.params?.numeric_filters;
        let s = `algolia_search(${idx}, q="${q}")`;
        if (filters) s += ` filters=${JSON.stringify(filters)}`;
        if (numFilters) s += ` numeric=${JSON.stringify(numFilters)}`;
        return s;
      }
      const ids = tc.input.objectIDs?.length || 0;
      return `${tc.name}(${ids} items)`;
    }).join(", ");

    if (toolSummary) {
      console.log(`    ${c("dim", "Tools:")} ${toolSummary}`);
    } else {
      console.log(`    ${c("yellow", "⚠ No tool calls")}`);
    }

    // Run algorithmic checks
    const checks = runAlgorithmicChecks(tr.trace, tr.turn.rubric);
    const failedChecks = checks.filter((ch) => !ch.pass);
    const turnPassed = failedChecks.length === 0;

    if (turnPassed) turnsPassed++;
    else journeyPassed = false;

    console.log(`    ${c("magenta", "[EVAL]")}`);
    for (const ch of checks) {
      const icon = ch.pass ? c("green", "✅") : c("red", "❌");
      console.log(`      ${icon} ${ch.label}${ch.detail ? c("dim", ` — ${ch.detail}`) : ""}`);
    }
    console.log(`    ${turnPassed ? c("green", "[PASS]") : c("red", "[FAIL]")}`);

    if (verbose) {
      console.log(`    ${c("dim", "--- Assistant Text ---")}`);
      const lines = tr.trace.assistantText.split("\n");
      for (const line of lines) {
        console.log(`    ${c("dim", "│")} ${line}`);
      }
      console.log(`    ${c("dim", "--- Rubric ---")}`);
      console.log(`    ${c("dim", "│")} ${tr.turn.rubric}`);

      // Print full tool call details
      for (const tc of tr.trace.toolCalls) {
        console.log(`    ${c("dim", `--- Tool: ${tc.name} ---`)}`);
        console.log(`    ${c("dim", "│ Input:")} ${JSON.stringify(tc.input, null, 2).split("\n").join("\n    │ ")}`);
        if (tc.output) {
          const outputStr = JSON.stringify(tc.output, null, 2);
          // Truncate large outputs
          const truncated = outputStr.length > 500 ? outputStr.slice(0, 500) + "..." : outputStr;
          console.log(`    ${c("dim", "│ Output:")} ${truncated.split("\n").join("\n    │ ")}`);
        }
      }
    }
  }

  const totalTurns = result.turns.length;
  const statusIcon = journeyPassed ? c("green", "✅") : c("red", "❌");
  console.log(`  ${statusIcon} Journey ${journeyPassed ? "passed" : "FAILED"} (${turnsPassed}/${totalTurns} turns) ${c("dim", `[${(result.durationMs / 1000).toFixed(1)}s]`)}`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const noFilter = !args.some((a) => a === "--journey");
  const journeyFilter = args.includes("--journey")
    ? args[args.indexOf("--journey") + 1]?.toLowerCase()
    : undefined;
  const concurrency = args.includes("--concurrency")
    ? parseInt(args[args.indexOf("--concurrency") + 1]) || 4
    : 4;

  // Validate config
  if (!ADMIN_KEY) {
    console.error("Missing ALGOLIA_ADMIN_API_KEY in .env");
    process.exit(1);
  }

  console.log(c("bold", "\n══════════════════════════════════════════════════"));
  console.log(c("bold", " Consum Agent — Journey Tests"));
  console.log(c("bold", "══════════════════════════════════════════════════"));
  console.log(`App: ${APP_ID} | Agent: ${AGENT_ID}`);
  console.log(`Concurrency: ${concurrency} | Verbose: ${verbose}`);

  // Filter journeys
  let selectedJourneys = JOURNEYS;
  if (journeyFilter) {
    selectedJourneys = JOURNEYS.filter((j) =>
      j.name.toLowerCase().includes(journeyFilter)
    );
    console.log(`Filter: "${journeyFilter}" → ${selectedJourneys.length} journey(s)`);
  }

  if (selectedJourneys.length === 0) {
    console.error("No journeys matched the filter.");
    process.exit(1);
  }

  console.log(`Running ${selectedJourneys.length} journeys...\n`);

  // Run with concurrency limit
  const results: JourneyResult[] = [];
  for (let i = 0; i < selectedJourneys.length; i += concurrency) {
    const batch = selectedJourneys.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(runJourney));
    results.push(...batchResults);

    // Print results as they complete
    for (const r of batchResults) {
      printJourneyResult(r, verbose);
    }
  }

  // Summary
  const passed = results.filter((r) => !r.error && r.turns.every((t) => {
    const checks = runAlgorithmicChecks(t.trace, t.turn.rubric);
    return checks.every((ch) => ch.pass);
  }));
  const failed = results.filter((r) => r.error || !r.turns.every((t) => {
    const checks = runAlgorithmicChecks(t.trace, t.turn.rubric);
    return checks.every((ch) => ch.pass);
  }));
  const totalTurns = results.reduce((s, r) => s + r.turns.length, 0);
  const passedTurns = results.reduce((s, r) => s + r.turns.filter((t) => {
    const checks = runAlgorithmicChecks(t.trace, t.turn.rubric);
    return checks.every((ch) => ch.pass);
  }).length, 0);

  console.log(`\n${c("bold", "══════════════════════════════════════════════════")}`);
  console.log(`${c("bold", "SUMMARY:")} ${passed.length}/${results.length} journeys passed | ${passedTurns}/${totalTurns} turns passed`);
  if (failed.length > 0) {
    console.log(`${c("red", "Failed:")} ${failed.map((r) => r.journey.name).join(", ")}`);
  }
  console.log(c("bold", "══════════════════════════════════════════════════\n"));

  // Write results to JSON for agent analysis
  const outputPath = "scripts/test-agent-journeys-results.json";
  const jsonResults = results.map((r) => ({
    journey: r.journey.name,
    group: r.journey.group,
    error: r.error,
    durationMs: r.durationMs,
    turns: r.turns.map((t) => ({
      userMessage: t.turn.userMessage,
      rubric: t.turn.rubric,
      assistantText: t.trace.assistantText,
      toolCalls: t.trace.toolCalls.map((tc) => ({
        name: tc.name,
        input: tc.input,
        output: tc.output,
      })),
      checks: runAlgorithmicChecks(t.trace, t.turn.rubric),
      durationMs: t.durationMs,
    })),
  }));

  const fs = await import("fs");
  fs.writeFileSync(outputPath, JSON.stringify(jsonResults, null, 2));
  console.log(`Results written to ${outputPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
