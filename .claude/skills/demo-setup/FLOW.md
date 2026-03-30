# Demo Setup Flow

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          /demo-setup (Orchestrator)                         ║
╚══════════════════════════════════════════════════════════════════════════════╝


 PHASE 1: GATHER INFORMATION + DISCOVERY
 ════════════════════════════════════════

  ⏸ USER INPUT ───────────────────────────────────────────────────────────────
  │ Customer name, website URL, vertical, Algolia credentials,               │
  │ data source, audience, use cases, scenarios, preservation notes          │
  └───────────────────────────────────────────────────────────────────────────
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │ /demo-discovery                                                           │
  │                                                                           │
  │  🤖 AGENT:                                                                │
  │  • Screenshots customer website (home, search, PDP, category)             │
  │  • Browses git branches for similar past demos                            │
  │  • Finds external references and example URLs                             │
  │  • Produces Discovery Brief:                                              │
  │    - Suggested features & interactions (priority order)                    │
  │    - Visual direction (ASCII mockups, component refs, URLs)               │
  │    - Data requirements (fields, facets, enrichments, ranking signals)     │
  │    - Personalization strategy                                             │
  │    - Agent feature suggestions                                            │
  └──────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
  ⏸ USER INPUT ───────────────────────────────────────────────────────────────
  │ Confirm or adjust the Discovery Brief                                     │
  │ (features, visual direction, data requirements)                           │
  └───────────────────────────────────────────────────────────────────────────
                                     │
                                     ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │ 📋 PLAN MODE                                                              │
  │                                                                           │
  │  🤖 AGENT presents execution plan based on Discovery Brief:               │
  │  • What each skill will do (branding, data, users, categories, agent)     │
  │  • Execution order + what runs in parallel                                │
  │  • Key decisions: data source, enrichments, personalization approach       │
  │  • Files that will be created/modified                                    │
  └──────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
  ⏸ USER INPUT ───────────────────────────────────────────────────────────────
  │ Approve or adjust the execution plan                                      │
  └───────────────────────────────────────────────────────────────────────────
                                     │
                                     │
 PHASE 2: EXECUTE SKILLS
 ════════════════════════

  ┌───────────────────────────────────────────────────────────────────────────┐
  │ STEP 1: /demo-branding  (runs first — config files other skills need)     │
  │                                                                           │
  │  🤖 AGENT:                                                                │
  │  • Fetches favicon + logo from customer website                           │
  │  • Sets brand name, tagline, locale, currency                             │
  │  • Configures Algolia connection (APP_ID, keys, INDEX_NAME)               │
  │  • Applies visual direction from Discovery Brief                          │
  │                                                                           │
  │  📝 WRITES: lib/demo-config/index.ts, lib/algolia-config.ts              │
  └──────────────────────────────────┬────────────────────────────────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             │                  IN PARALLEL                   │
             ▼                                               ▼
  ┌──────────────────────────────────────┐    ┌──────────────────────────────┐
  │ STEP 2A: DATA PIPELINE               │    │ STEP 2B: /demo-user-profiles │
  │ (background agent)                    │    │ (foreground agent)           │
  │                                       │    │                              │
  │  ┌──────────────────────────────────┐ │    │  🤖 AGENT:                   │
  │  │ [if scraping needed]             │ │    │  • Generates user personas   │
  │  │                                  │ │    │    with preference weights   │
  │  │  /demo-scrape                    │ │    │  • Uses personalization      │
  │  │                                  │ │    │    strategy from Brief       │
  │  │  🤖 Discovers sitemap, scrapes   │ │    │  • Configures "For You"      │
  │  │  site → data/products.json       │ │    │    attribute mappings        │
  │  └───────────────┬──────────────────┘ │    │                              │
  │                  ▼                     │    │  📝 WRITES:                  │
  │  ┌──────────────────────────────────┐ │    │  lib/demo-config/users.ts    │
  │  │ /demo-data-indexing              │ │    └──────────────────────────────┘
  │  │                                  │ │
  │  │  🤖 AGENT (analyze):            │ │
  │  │  • Samples products.json         │ │
  │  │  • Analyzes fields vs Product    │ │
  │  │    interface + Brief's data      │ │
  │  │    requirements                  │ │
  │  │  • Produces 4-section report:    │ │
  │  │    A. Critical fields            │ │
  │  │    B. Secondary fields           │ │
  │  │    C. Business/ranking fields    │ │
  │  │    D. Enrichment opportunities   │ │
  │  │                                  │ │
  │  │  ⏸ USER INPUT ────────────────  │ │
  │  │  │ Confirm mappings, choose     │ │
  │  │  │ enrichments (keywords,       │ │
  │  │  │ semantic_attributes, etc),   │ │
  │  │  │ select source (OpenAI, etc)  │ │
  │  │  └─────────────────────────────  │ │
  │  │                                  │ │
  │  │  🤖 AGENT (transform/enrich):   │ │
  │  │  • Generates transformRecords()  │ │
  │  │    in scripts/index-data.ts      │ │
  │  │  • Generates enrichRecords()     │ │
  │  │    (OpenAI structured outputs)   │ │
  │  │  • Updates index settings        │ │
  │  │  • Shows sample records          │ │
  │  │                                  │ │
  │  │  📝 WRITES: scripts/index-data.ts│ │
  │  │                                  │ │
  │  │  🤖 AGENT (index):              │ │
  │  │  • Runs scripts/index-data.ts    │ │
  │  │    (transform → enrich → index   │ │
  │  │     → settings → composition)    │ │
  │  │  • Runs setup-recommend.ts       │ │
  │  │    (Related Products +           │ │
  │  │     Looking Similar)             │ │
  │  │  • Runs setup-query-suggestions  │ │
  │  │                                  │ │
  │  │  📄 REPORTS: record count,       │ │
  │  │  image domains, category facets  │ │
  │  └───────────────┬──────────────────┘ │
  │                  │                     │
  └──────────────────┼─────────────────────┘
                     │
                     ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │ STEP 3: POST-DATA SETUP  (after data pipeline completes)                  │
  │                                                                           │
  │  🤖 AGENT: Updates image domains in lib/demo-config/index.ts              │
  │                                                                           │
  │  ┌──────────────────────────┐       ┌────────────────────────────────┐   │
  │  │ /demo-categories         │       │ /demo-agent-setup              │   │
  │  │                          │       │                                │   │
  │  │  🤖 Parses hierarchy     │       │  🤖 Configures agent           │   │
  │  │  into category tree,     │       │  instructions, tools,          │   │
  │  │  assigns sidebar icons   │       │  product attributes            │   │
  │  │                          │       │  Uses agent suggestions        │   │
  │  │  📝 WRITES:              │       │  from Discovery Brief          │   │
  │  │  lib/demo-config/        │       │                                │   │
  │  │    categories.ts         │       │  📝 WRITES:                    │   │
  │  │                          │       │  lib/demo-config/agents.ts     │   │
  │  │                          │       │  lib/algolia-config.ts         │   │
  │  └──────────────────────────┘       └────────────────────────────────┘   │
  └──────────────────────────────────────┬────────────────────────────────────┘
                                         │
                                         │
 PHASE 3: LAUNCH
 ═══════════════

  ┌───────────────────────────────────────────────────────────────────────────┐
  │  🤖 AGENT: pnpm dev                                                       │
  │                                                                           │
  │  📄 Summary: all skills executed, index stats, http://localhost:3000      │
  └───────────────────────────────────────────────────────────────────────────┘


 LEGEND
 ══════
   ⏸ USER INPUT  = Flow pauses — agent asks questions, waits for response
   📋 PLAN MODE   = Agent presents execution plan, waits for approval
   🤖 AGENT       = Autonomous work (no user input needed)
   📝 WRITES      = Files modified by this skill
   📄 REPORTS     = Data passed to downstream skills
```
