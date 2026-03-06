# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Algolia Demo Template — A configurable e-commerce demo built with Next.js 16, React 19, and Algolia's Composition API with Agent Studio integration. The application features AI-powered product discovery, personalized user profiles, and intelligent shopping assistance. All demo-specific values (brand, categories, users, agent instructions) are centralized in `lib/demo-config/`.

See `SETUP.md` for step-by-step new demo setup instructions.

## Key Technologies

- **Next.js 16**: App Router, Server Components, React 19
- **Algolia**: Composition API, Agent Studio (AI agents), InstantSearch
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
| `lib/demo-config/agents.ts` | AI agent instructions and index descriptions (`AGENT_CONFIG`) |

### Price Formatting

All prices go through `lib/utils/format.ts` → `formatPrice()`, which reads `DEMO_CONFIG.locale.currencySymbol`.

### Image Domains

`next.config.ts` reads `DEMO_CONFIG.imageDomains` for Next.js `<Image>` remote patterns.

## Algolia Configuration

All non-sensitive Algolia settings live in `lib/algolia-config.ts` (committed to the repo). This includes the APP_ID, search-only API key, index names, composition ID, and agent IDs. Environment variables can override any value when set.

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

1. **CartProvider** - Global shopping cart state
2. **UserProvider** - Current user profile selection (for personalization)
3. **ClickCollectProvider** - Store pickup location and shop selection
4. **SidepanelProvider** - Controls AI assistant sidepanel visibility
5. **InstantSearch** - Algolia search/composition state with routing

### AI Agent System

Three specialized AI agents powered by Algolia Agent Studio. Instructions are configured in `lib/demo-config/agents.ts`.

**1. Sidepanel Agent** (`components/sidepanel-agent-studio/`)
- Context-aware assistant for search and product pages
- Uses `context-snapshot.ts` to resolve page context before each message
- Tools: `addToCart`, `showItems`

**2. Product Page Agent** (`components/sidepanel-agent-studio/components/product-page-agent.tsx`)
- Specialized agent for product detail pages
- Generates contextual follow-up questions via `useFollowUpQuestions()`

**3. Checkout Agent** (`components/checkout-agent/`)
- Provides complementary product recommendations during checkout

**Context Injection Pattern:**
All agents use `[CONTEXT]{...}[/CONTEXT]` message format to inject structured data.

**Single Instance Architecture:**
Only ONE `SidepanelExperience` component is rendered in the navbar. Multiple trigger buttons communicate via `SidepanelContext`.

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
- Three agents configured via `scripts/setup-agent.ts` (reads from `lib/demo-config/agents.ts`)
- Custom transport layer injects context via `prepareSendMessagesRequest`
- Client-side tool execution for cart operations

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/index-data.ts` | Parse XML feed, index products, configure settings, create composition |
| `scripts/setup-agent.ts` | Configure Agent Studio agents (reads `lib/demo-config/agents.ts`) |
| `scripts/setup-query-suggestions.ts` | Set up Algolia Query Suggestions |
| `scripts/test-relevance.ts` | Test search relevance — queries with expected objectIDs in order |

## Relevance Tests

`scripts/test-relevance.ts` tests search relevance via the Composition API. The `TEST_CASES` array contains queries with expected objectIDs that must appear in a specific order.

**When setting up a new demo**, ask the user if they have specific search queries and expected products they'd like to validate. If so, populate the `TEST_CASES` array in `scripts/test-relevance.ts` with their test cases. Run with `pnpm tsx scripts/test-relevance.ts`.

## Important Notes

- Always use `pnpm` as the package manager (not npm/yarn)
- Product images: configure domains in `lib/demo-config/index.ts` → `imageDomains`
- InstantSearch state persists via URL routing with `preserveSharedStateOnUnmount`
- Agent tool calls execute client-side for cart operations (no API routes needed)
- Context snapshots cache product data to avoid redundant fetches (500ms timeout)

## Type Safety

Key interfaces:
- `Product` (`lib/types/product.ts`) - Product record from Algolia
- `User` (`lib/types/user.ts`) - User profile type with preference weights
- `CartItem` - Shopping cart item structure
- `ContextSnapshot` - Page context for AI agents
