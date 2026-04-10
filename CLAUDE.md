# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Algolia Demo Template — A configurable e-commerce demo built with Next.js 16, React 19, and Algolia's Composition API with Agent Studio integration. The application features AI-powered product discovery, personalized user profiles, retail media, click & collect, and intelligent shopping assistance. All demo-specific values (brand, categories, users, agent instructions, retail media rules) are centralized in `lib/demo-config/`.

See `SETUP.md` for step-by-step new demo setup instructions.

## Key Technologies

- **Next.js 16**: App Router, Server Components, React 19
- **Algolia**: Composition API, Agent Studio (AI agents), InstantSearch, NeuralSearch
- **AI SDK v5**: Vercel's AI SDK for agent chat interfaces
- **UI**: Tailwind CSS 4, shadcn/ui components, Radix UI primitives
- **Package Manager**: pnpm

## Development Commands

```bash
pnpm dev          # Development server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Lint codebase
```

## Demo Configuration (`lib/demo-config/`)

All demo-specific values are centralized here. To set up a new demo, edit these files:

| File | Contents |
|------|----------|
| `lib/demo-config/index.ts` | Brand name, tagline, logo, locale (language, currency), image domains |
| `lib/demo-config/categories.ts` | Category tree (`HIERARCHICAL_CATEGORIES`), sidebar icons (`CATEGORY_ICONS`) |
| `lib/demo-config/users.ts` | Demo user profiles (`users`), preference display metadata (`PREFERENCE_METADATA`) |
| `lib/demo-config/agents.ts` | AI agent instructions, index descriptions, client-side tools, product attributes for agent API key (`AGENT_CONFIG`, `AGENT_PRODUCT_ATTRIBUTES`) |
| `lib/demo-config/retail-media.ts` | Retail media rule definitions (`RETAIL_MEDIA_RULES`) — sponsored placements, trigger conditions, product lists |

### Price Formatting

All prices go through `lib/utils/format.ts` -> `formatPrice()`, which reads `DEMO_CONFIG.locale.currencySymbol`.

### Image Domains

`next.config.ts` reads `DEMO_CONFIG.imageDomains` for Next.js `<Image>` remote patterns.

## Algolia Configuration

All non-sensitive Algolia settings live in `lib/algolia-config.ts` (committed to the repo). This includes the APP_ID, search-only API key, index name, composition ID, and agent ID. Values are hardcoded — update the file directly when configuring a new demo.

**Default app:** `3FKQCCIUWO` with search key `cf3b54fbfea633fb12808c8b2f59b990`.

**`.env` (secret only):**
- `ALGOLIA_ADMIN_API_KEY`: Algolia admin API key (for indexing scripts, never exposed to client)

## Architecture

### App Structure

**Pages:**
- `/` - Home/search page with product listing
- `/products/[id]` - Product detail page (SSR with Algolia data fetch)
- `/category/[...slug]` - Category browsing page
- `/checkout` - Checkout page
- `/user/[id]` - User profile selection page

**Key Directories:**
- `app/` - Next.js App Router pages and layouts
- `components/` - React components organized by feature
- `lib/` - Utilities and type definitions
- `lib/demo-config/` - All demo-specific configuration
- `lib/types/` - TypeScript interfaces (Product, User, etc.)
- `lib/utils/` - Utility functions (price formatting, etc.)
- `scripts/` - Indexing and agent setup scripts

### Context Providers

Nested provider structure in `components/providers.tsx`:

1. **CartProvider** - Global shopping cart state (add/remove items, quantities, totals)
2. **ClickCollectProvider** - Store pickup location and shop selection for click & collect
3. **UserProvider** - Current user profile selection (for personalization)
4. **SelectionProvider** - Product selection state for multi-select operations
5. **SidepanelProvider** - Controls AI assistant sidepanel visibility
6. **InstantSearch** - Algolia search/composition state with routing

### AI Agent System

One AI agent powered by Algolia Agent Studio. Instructions and tools are configured in `lib/demo-config/agents.ts`, deployed via `scripts/setup-agent.ts`.

**Sidepanel Agent** (`components/sidepanel-agent-studio/`)
- Context-aware shopping assistant for search and product pages
- Uses `context-snapshot.ts` to resolve page context before each message
- Built-in suggestions enabled (`config.suggestions.enabled: true`) — every response includes contextual follow-up suggestions via `data-suggestions` SSE events
- Fallback suggestions defined in `AGENT_CONFIG.fallbackSuggestions` for when no SSE suggestions are available
- Tools: `addToCart`, `showItems`, `showArticles` (client-side), `algolia_search_index` (server-side)

**Agent Trigger Button:**
Gradient sparkle button in the navbar opens the AI assistant sidepanel. Single instance architecture — only ONE `SidepanelExperience` component is rendered in the navbar, with multiple trigger buttons communicating via `SidepanelContext`.

**Context Injection Pattern:**
The agent uses `[CONTEXT]{...}[/CONTEXT]` message format to inject structured data (page context, user preferences, selected products).

### Retail Media System

Retail media injects sponsored content into search results via Algolia composition rules.

**Pipeline:**
1. **Rule definitions** (`lib/demo-config/retail-media.ts`) — Define campaigns with trigger conditions (query patterns, categories, user segments) and sponsored product lists
2. **Composition rules** (`scripts/setup-composition-rules.ts`) — Converts rule definitions into Algolia composition rules with tagged metadata
3. **Frontend parsing** (`lib/retail-media.ts`) — Parses composition rule tags to determine placement type
4. **Visualization components** — Three placement types:
   - **Carousel** — Sponsored product carousel at the top of results
   - **Inline** — Sponsored products injected into the result grid
   - **Banner** — Cross-sell or promotional banners between result rows

### Click & Collect System

Click & collect allows users to select a pickup store and see product availability.

**Components:**
- **ClickCollectProvider** (`components/click-collect/click-collect-context.tsx`) — Manages selected store state
- **Store finder** — Location-based store search with proximity sorting
- **Availability badges** — Per-product stock status at the selected store
- **Proximity boost** — When a store is selected, search results are boosted by geographic proximity via `aroundLatLng`

**Store data** is indexed via `scripts/index-stores.ts` with `_geoloc` coordinates.

### NeuralSearch

NeuralSearch (semantic search) is configured during product indexing by `scripts/index-data.ts`. The script calls the Algolia REST API to set:

- `neuralSearchMode: "active"` — Enables semantic understanding
- `neuralSearchAttributes` — Attributes used for semantic matching (name, brand, categories, description)
- `neuralSearchPreset: "custom"` — Custom attribute weights for relevance tuning

No additional configuration needed after indexing. NeuralSearch works automatically through the Composition API.

### User Personalization

User profiles are defined in `lib/demo-config/users.ts`. Each profile has preference weights (scores 0-20) for product attributes.

**UserContext** (`components/user/user-context.tsx`) generates `personalizationFilters` in format `"facetName:value<score=N>"` for Algolia boosting.

**Usage:**
1. **"For You" Filter** in sidebar — shows personalized suggestions
2. **Search Result Boosting** via Composition API
3. **AI Agent Context** — preferences injected into agent conversations
4. **Preference Metadata** from `lib/demo-config/users.ts` — maps facets to display labels

### State Management

- **Global State**: React Context (Cart, User, Sidepanel, ClickCollect)
- **Search State**: Algolia InstantSearch with URL routing
- **AI Chat State**: AI SDK v5 `useChat` hook

### Algolia Integration

**Composition API:**
- Client initialized in `providers.tsx` using `compositionClient()`
- InstantSearch components use composition for search

**Agent Studio:**
- Single agent configured via `scripts/setup-agent.ts` (reads from `lib/demo-config/agents.ts`)
- Custom transport layer in `create-agent-transport.ts` injects context via `prepareSendMessagesRequest`
- Client-side tool execution for cart, product display, and article display operations
- Suggestions delivered via `data-suggestions` SSE events from Agent Studio

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/index-data.ts` | Index products, configure settings, enable NeuralSearch, create composition |
| `scripts/index-articles.ts` | Index article/content records with dedup into a separate articles index |
| `scripts/index-stores.ts` | Index store locations with `_geoloc` for click & collect |
| `scripts/enrich-stores.ts` | Geocode store addresses into lat/lng coordinates |
| `scripts/download-index.ts` | Browse an existing Algolia index and save records to JSON |
| `scripts/setup-agent.ts` | Configure Agent Studio agent, writes AGENT_ID back to `lib/algolia-config.ts` |
| `scripts/setup-composition-rules.ts` | Create composition rules for retail media placements |
| `scripts/setup-recommend.ts` | Train Recommend models (Related Products, Looking Similar) |
| `scripts/setup-query-suggestions.ts` | Set up Algolia Query Suggestions |
| `scripts/test-relevance.ts` | Test search relevance — queries with expected objectIDs in order |

## Relevance Tests

`scripts/test-relevance.ts` tests search relevance via the Composition API. The `TEST_CASES` array contains queries with expected objectIDs that must appear in a specific order.

**When setting up a new demo**, ask the user if they have specific search queries and expected products they'd like to validate. If so, populate the `TEST_CASES` array in `scripts/test-relevance.ts` with their test cases. Run with `pnpm tsx scripts/test-relevance.ts`.

## Important Notes

- Always use `pnpm` as the package manager (not npm/yarn)
- Product images: configure domains in `lib/demo-config/index.ts` -> `imageDomains`
- InstantSearch state persists via URL routing with `preserveSharedStateOnUnmount`
- Agent tool calls execute client-side for cart and display operations (no API routes needed)
- Context snapshots cache product data to avoid redundant fetches (500ms timeout)

## Type Safety

Key interfaces:
- `Product` (`lib/types/product.ts`) - Product record from Algolia (name, price, brand, images, reviews, availability)
- `User` (`lib/types/user.ts`) - User profile type with preference weights
- `CartItem` - Shopping cart item structure
- `ContextSnapshot` - Page context for AI agents
- `RetailMediaRule` (`lib/demo-config/retail-media.ts`) - Retail media campaign definition
