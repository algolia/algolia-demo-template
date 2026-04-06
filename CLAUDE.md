# CLAUDE.md

Algolia Demo Template — configurable e-commerce demo with AI-powered product discovery. Built with Next.js 16, React 19, Algolia Composition API + Agent Studio.

All demo-specific values live in `lib/demo-config/`. Changing a demo = editing 4-5 config files + indexing data.

## Quick Reference

```bash
pnpm install          # Install deps
pnpm dev              # Dev server (localhost:3000)
pnpm build            # Production build
pnpm start            # Start production
pnpm tsx scripts/index-data.ts           # Index products
pnpm tsx scripts/setup-agent.ts          # Configure AI agent
pnpm tsx scripts/setup-recommend.ts      # Train recommendations
pnpm tsx scripts/setup-query-suggestions.ts  # Query suggestions
pnpm tsx scripts/test-relevance.ts       # Test search relevance
```

## Demo Setup Flow

Given a customer name and website, here's the full sequence. Works for both local development and bot-driven setup.

### Phase 1: Gather Info

Before starting, you need:
1. **Customer name** (e.g. "Arcaplanet")
2. **Vertical** (e.g. e-commerce petstore)
3. **Algolia credentials** — use defaults or custom App ID + Admin API Key
4. **Product data source** — JSON file, existing Algolia index, website to scrape, or skip

### Phase 2: Bootstrap

```bash
# Create a demo branch (bot/* prefix required for automated deploys)
git checkout -b bot/demo/<vertical>-<customer-slug>

# Install
pnpm install

# Set admin key (only secret — everything else is in lib/algolia-config.ts)
echo "ALGOLIA_ADMIN_API_KEY=<key>" > .env
```

### Phase 3: Configure (can run in parallel with data indexing)

Edit these files — this is where all demo customization happens:

| File | What to change |
|------|---------------|
| `lib/demo-config/index.ts` | Brand name, tagline, logo path, locale (language, currency), image domains |
| `lib/algolia-config.ts` | APP_ID, SEARCH_API_KEY, INDEX_NAME, COMPOSITION_ID, AGENT_ID |
| `lib/demo-config/users.ts` | Demo user profiles with preference weights |
| `lib/demo-config/agents.ts` | AI agent instructions, index description, filterable fields |
| `public/logo.svg` or `public/logo.png` | Customer logo (update `brand.logoUrl` to match) |
| `app/favicon.ico` | Customer favicon |

**Skip `lib/demo-config/categories.ts`** until data is indexed — categories must match actual Algolia facet values exactly.

### Phase 4: Index Data

```bash
# Index products (auto-configures settings + creates Composition)
pnpm tsx scripts/index-data.ts [path/to/products.json]

# Set up AI agent (writes AGENT_ID back to lib/algolia-config.ts)
pnpm tsx scripts/setup-agent.ts

# Optional
pnpm tsx scripts/setup-recommend.ts
pnpm tsx scripts/setup-query-suggestions.ts
```

After indexing, configure categories from actual facet values:
- Read `hierarchical_categories` facet values from the index
- Build the category tree in `lib/demo-config/categories.ts`
- Category `name` values must be **exact case-sensitive matches** to Algolia facet values
- Add image domains to `lib/demo-config/index.ts` → `imageDomains`
- Update AGENT_ID in `lib/algolia-config.ts` if `setup-agent.ts` wrote a new one

See `SETUP.md` for detailed step-by-step instructions.

### Phase 5: Verify

```bash
pnpm dev  # Check at localhost:3000
```

### Phase 6: Deploy (automated environments only)

For deployments behind the Demo Manager (e.g. via the SE bot or manual API call):

```bash
# Commit and push
git add -A && git commit -m "Setup demo for <customer>" && git push origin bot/demo/<branch>

# Deploy via Manager API (from environments with API access)
curl -X POST http://<manager-host>:3150/demos \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <api-key>" \
  -d '{"name": "<slug>", "branch": "bot/demo/<branch>"}'
```

The Manager builds a Docker container, assigns a port, generates a token-gated URL, and configures nginx. Response includes the shareable URL.

**Managing deployed demos:**
- `GET /demos` — list all
- `GET /demos/<slug>` — status + logs
- `POST /demos/<slug>/redeploy` — rebuild from branch after pushing changes
- `DELETE /demos/<slug>` — tear down

Demos are Docker containers with basePath set automatically. Max 8 concurrent.

---

## Architecture

### Config Files (what you edit for each demo)

```
lib/demo-config/
├── index.ts        # Brand, locale, image domains
├── categories.ts   # Category tree + icons
├── users.ts        # Demo user profiles + preferences
└── agents.ts       # AI agent instructions + tools
lib/algolia-config.ts   # App ID, API keys, index/composition/agent IDs
.env                    # ALGOLIA_ADMIN_API_KEY (secret, gitignored)
```

### App Routes

| Route | Page | Component |
|-------|------|-----------|
| `/` | Home / search | `components/SearchPage.tsx` |
| `/products/[id]` | Product detail (SSR) | `components/ProductPage.tsx` |
| `/category/[...slug]` | Category browsing | `components/category-page.tsx` |
| `/checkout` | Checkout | `app/checkout/page.tsx` |
| `/user/[id]` | User profile selection | `components/UserPage.tsx` |

### Key Components

```
components/
├── providers.tsx              # All context providers + InstantSearch
├── SearchPage.tsx             # Home/search with product grid
├── ProductCard.tsx            # Product display variants
├── ProductPage.tsx            # Product detail page
├── category-page.tsx          # Category browsing
├── filters-sidebar.tsx        # Search filters
├── navbar/                    # Navigation bar + search + cart
└── sidepanel-agent-studio/    # AI assistant
    ├── components/
    │   ├── sidepanel-agent.tsx      # Main sidepanel UI
    │   └── product-page-agent.tsx   # "Ask about this product" widget
    ├── hooks/
    │   └── use-agent-studio.ts      # Chat hook + tool handling
    ├── context/
    │   └── sidepanel-context.tsx     # Cross-component communication
    └── lib/
        ├── context-snapshot.ts       # Page context for agent
        └── create-agent-transport.ts # Agent Studio API transport
```

### Context Providers (in `providers.tsx`)

Nested in this order:
1. **CartProvider** — shopping cart state
2. **UserProvider** — current demo user profile + personalization filters
3. **SelectionProvider** — product multi-select for comparisons
4. **SidepanelProvider** — AI assistant open/close + suggestions
5. **InstantSearch** — Algolia search state with URL routing

### AI Agent System

Single agent powered by Algolia Agent Studio. Configured in `lib/demo-config/agents.ts`, deployed via `scripts/setup-agent.ts`.

**How it works:**
1. `create-agent-transport.ts` wraps every chat message with `[CONTEXT]{...}[/CONTEXT]`
2. Context includes: page type, search state, product details (if on product page), user preferences, selected products
3. `context-snapshot.ts` detects the current page type and builds the context
4. Agent has client-side tools: `addToCart`, `showItems` (executed in browser, not server)
5. Suggestions come via `data-suggestions` SSE events from Agent Studio

**Hidden greeting flow:** When the sidepanel opens with no conversation, it sends a hidden "What can you help me with?" to get contextual suggestions, then clears the messages. User only sees the suggestions.

### User Personalization

Profiles in `lib/demo-config/users.ts` have preference weights (0-20) per facet value. `UserContext` converts these to `personalizationFilters` format (`"facetName:value<score=N>"`) for Algolia boosting.

### Algolia Integration

- **Composition API** — `compositionClient()` in `providers.tsx`, used by InstantSearch
- **Agent Studio** — external API, `create-agent-transport.ts` handles auth + context injection
- **Recommend** — Related Products + Looking Similar models, trained via `scripts/setup-recommend.ts`

## Deployment

The template supports two deployment modes:

### Local Development
```bash
pnpm dev
```
No basePath, runs at `localhost:3000`.

### Docker (production / Demo Manager)
```bash
docker build --build-arg NEXT_PUBLIC_BASE_PATH=/demos/<slug> -t demo-<slug> .
docker run -d -p 3201:3000 demo-<slug>
```
The `Dockerfile` uses multi-stage build with standalone Next.js output (~30MB runtime). `NEXT_PUBLIC_BASE_PATH` is injected at build time for subpath routing behind nginx.

`next.config.ts` reads `NEXT_PUBLIC_BASE_PATH` and sets `basePath` accordingly. `context-snapshot.ts` strips basePath before page detection so the agent system works regardless of deployment path.

## Branch Model

```
main                    ← Protected. Template source of truth.
bot/main                ← Bot's working trunk. Tracks main.
bot/demo/<name>         ← Per-demo branches, created from bot/main.
```

- `main` changes are merged into `bot/main` periodically
- Demos branch from `bot/main` and customize config + data
- Useful demo improvements can be cherry-picked back to `main`

## Important Notes

- Always use `pnpm` (not npm/yarn)
- Image domains must be configured in `lib/demo-config/index.ts` → `imageDomains` for Next.js `<Image>` to work
- Category names in `categories.ts` must exactly match Algolia facet values
- Attribute naming: use snake_case (`hierarchical_categories.lvl0`, not camelCase)
- InstantSearch URL routing: `routing={true}` with default config in `providers.tsx`
- Agent tool calls execute client-side (no API routes needed)
- `ALGOLIA_ADMIN_API_KEY` is the only secret — everything else is in committed config files
