---
name: demo-agent-setup
description: 'Configure and deploy the AI shopping assistant — instructions, tools, product attributes, and AGENT_ID. Also documents the frontend agent architecture (sidepanel, context injection, transport). Use when setting up or updating the AI agent for the demo.'
---

# Demo Agent Setup

Configure the AI shopping assistant end-to-end: backend config, Algolia deployment, and understanding the frontend integration.

## Prerequisites

- `.env` file has `ALGOLIA_ADMIN_API_KEY`
- Data is indexed in Algolia (the agent needs products to search)
- `lib/algolia-config.ts` has correct `APP_ID` and `INDEX_NAME`

## Inputs Needed

Ask the user for:
1. **Customer name** and **vertical** (shapes agent persona and instructions)
2. **Product attributes** available in the index (needed for `AGENT_PRODUCT_ATTRIBUTES` and `indexDescription`)
3. **Any special behavior requirements** (e.g. dietary restrictions for food, size guidance for fashion)

## Step 1: Configure `lib/demo-config/agents.ts`

This file defines the agent's persona, instructions, tools, and product attributes.

### `AGENT_PRODUCT_ATTRIBUTES`

Array of attribute names exposed to the agent's API key. Keep minimal — only what the agent needs to answer questions:

```typescript
export const AGENT_PRODUCT_ATTRIBUTES = [
  "objectID",
  "title",
  "brand",
  "price",
  "shortDescription",
  // Add attributes relevant to the vertical
];
```

### `AGENT_CONFIG.main`

```typescript
export const AGENT_CONFIG = {
  main: {
    name: `${DEMO_CONFIG.brand.name} Shopping Assistant`,
    instructions: `...`,      // Full system prompt (see below)
    indexDescription: `...`,   // Describes index to the agent (see below)
    tools: [...],              // Client-side tools (rarely need changing)
  },
  fallbackSuggestions: [...],  // 5 suggestion strings for when SSE suggestions unavailable
};
```

### Writing `instructions`

The instructions string is the agent's system prompt. Key sections to include:

- **AGENT ROLE** — Who the agent is (e.g. "Shopping Assistant for {brand}")
- **RESPONSE STYLE** — Concise, helpful. When context has `"isFirstMessage": true`, respond with a single short sentence (max 15 words) — no searches, just a greeting.
- **Tools** — List available tools: `algolia_search_index`, `addToCart`, `showItems`
- **Behavior** — Steps: understand needs → search → use showItems to present 2-4 options → offer next steps
- **Language** — Respond in the customer's language, default to English

### Writing `indexDescription`

Describes the index schema to the agent so it can build correct filters. List filterable fields with types:

```
Product catalog for {Brand}.

**Key filterable fields:**
- price: Product price (numeric)
- brand: Brand name
- hierarchical_categories.lvl0, hierarchical_categories.lvl1: Category hierarchy
- inStock: Boolean, true if available
```

**Attribute naming:** Always use snake_case (e.g. `hierarchical_categories.lvl0`, NOT `hierarchicalCategories.lvl0`). This matches the Product type and index settings.

### `tools` array

Two client-side tools are pre-configured and rarely need changes:

- **addToCart** — `{ objectIDs: string[] }` — adds products to cart
- **showItems** — `{ objectIDs: string[], title: string, explanation: string }` — displays product recommendations with context

### `fallbackSuggestions`

Array of 5 suggestion strings shown when no SSE suggestions are available from Agent Studio. Customize for the vertical:

```typescript
fallbackSuggestions: [
  "Show me today's best deals",
  "Find popular products",
  "Browse new arrivals",
  "Compare top-rated items",
  "Explore trending categories",
],
```

## Step 2: Deploy Agent

```bash
pnpm tsx scripts/setup-agent.ts
```

This script:
1. Reads `AGENT_CONFIG` and `AGENT_PRODUCT_ATTRIBUTES` from `lib/demo-config/agents.ts`
2. Calls Algolia Agent Studio API to create or update the agent
3. Publishes the agent if in draft status
4. **Writes the `AGENT_ID` back to `lib/algolia-config.ts`** — this is the only skill that sets AGENT_ID

## Frontend Architecture (Reference)

Understanding how the agent works in the frontend helps when customizing instructions. These files rarely need editing — they consume the config you set above.

### Context Injection Pattern

`components/sidepanel-agent-studio/lib/context-snapshot.ts`

Before each message, the transport layer captures page context and injects it as `[CONTEXT]{...}[/CONTEXT]`:
- Detects page type from URL (search, product, category, home)
- On product pages: fetches product data from Algolia (500ms timeout, cached)
- Includes user profile and preferences if a user is selected
- Includes current search state (query, filters, selected products)

### Custom Transport

`components/sidepanel-agent-studio/lib/create-agent-transport.ts`

Creates a `DefaultChatTransport` that intercepts requests via `prepareSendMessagesRequest` to inject the context snapshot before each message.

### Client-Side Tool Execution

`components/sidepanel-agent-studio/hooks/use-agent-studio.ts`

The `useAgentStudio()` hook:
- Initializes `useChat()` from AI SDK v5
- Handles client-side tool calls: `addToCart` (calls cart context), `showItems` (renders product cards)
- Listens for `data-suggestions` SSE events from Agent Studio
- Falls back to `AGENT_CONFIG.fallbackSuggestions`

### UI Components

- `components/sidepanel-agent-studio/components/sidepanel-agent.tsx` — Main sidepanel UI: chat messages, tool output cards, markdown rendering, suggestion chips
- `components/sidepanel-agent-studio/components/product-page-agent.tsx` — "Ask about this product" CTA button on product pages
- `components/sidepanel-agent-studio/context/sidepanel-context.tsx` — `SidepanelProvider` manages open/close state. Single instance rendered in navbar; multiple trigger buttons communicate via context.

## Idempotency

Safe to re-run. `setup-agent.ts` updates the existing agent if one exists, or creates a new one. AGENT_ID is always written back to `lib/algolia-config.ts`.
