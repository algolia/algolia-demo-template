# Algolia E-Commerce Demo Template

A configurable e-commerce demo built with Next.js 16, React 19, and Algolia's Composition API with Agent Studio integration. Features AI-powered product discovery, personalized user profiles, and an intelligent shopping assistant.

## Demo Creation Flow

The fastest way to set up a new demo is with `/demo-setup`, which orchestrates all steps automatically. Here's the full pipeline:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        /demo-setup                                  │
│                     (orchestrator)                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1: Discovery                                                 │
│  /demo-discovery                                                    │
│                                                                     │
│  ┌───────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ Gather context │→ │ Screenshot site   │→ │ Review similar demos │ │
│  │ from user      │  │ or references     │  │ in git branches      │ │
│  └───────────────┘  │ → data/discovery/ │  └──────────────────────┘ │
│                      └──────────────────┘                           │
│                              │                                      │
│                              ▼                                      │
│                   ┌─────────────────────┐                           │
│                   │ Suggest demo vision │                           │
│                   │ → Discovery Brief    │                           │
│                   └─────────────────────┘                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 2: Branding (must run first — other scripts depend on it)    │
│  /demo-branding                                                     │
│                                                                     │
│  • lib/demo-config/index.ts  → brand name, tagline, logo, locale   │
│  • lib/algolia-config.ts     → APP_ID, INDEX_NAME, COMPOSITION_ID  │
│  • app/favicon.ico           → downloaded from customer site        │
│  • public/logo.svg           → downloaded from customer site        │
│  • app/globals.css           → brand colors (--primary)             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌──────────────────────────┐  ┌──────────────────────────────────────┐
│  Data Pipeline            │  │  User Profiles (parallel)            │
│                           │  │  /demo-user-profiles                 │
│  ┌──────────────────────┐ │  │                                      │
│  │ /demo-scrape          │ │  │  • lib/demo-config/users.ts         │
│  │ (optional)            │ │  │  • Persona definitions              │
│  │ → data/products.json  │ │  │  • Preference weights for           │
│  └──────────┬───────────┘ │  │    personalization & "For You"       │
│             │             │  └──────────────────────────────────────┘
│             ▼             │
│  ┌──────────────────────┐ │
│  │ /data-structure       │ │
│  │                       │ │
│  │ Analyze raw data      │ │
│  │ against Product type  │ │
│  │ → transform/enrich    │ │
│  │   in index-data.ts    │ │
│  └──────────┬───────────┘ │
│             │             │
│             ▼             │
│  ┌──────────────────────┐ │
│  │ /demo-data-indexing   │ │
│  │                       │ │
│  │ Index products        │ │
│  │ Train Recommend       │ │
│  │ Set up Query          │ │
│  │ Suggestions           │ │
│  │                       │ │
│  │ Reports:              │ │
│  │ • image domains       │ │
│  │ • category values     │ │
│  │ • facet attributes    │ │
│  └──────────┬───────────┘ │
└─────────────┼─────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 4: Post-Indexing Setup (after data pipeline completes)       │
│                                                                     │
│  ┌─────────────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │ Update imageDomains │  │ /demo-         │  │ /demo-agent-     │  │
│  │ in demo-config      │  │ categories     │  │ setup            │  │
│  │                     │  │                │  │                  │  │
│  │                     │  │ Category tree  │  │ Agent Studio     │  │
│  │                     │  │ from facet     │  │ instructions,    │  │
│  │                     │  │ values         │  │ tools, deploy    │  │
│  └─────────────────────┘  └───────────────┘  │ → AGENT_ID       │  │
│                                               └──────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   pnpm dev      │
                    │   localhost:3000 │
                    └─────────────────┘
```

### Skills Reference

| Skill | Purpose | Key outputs |
|-------|---------|-------------|
| `/demo-setup` | Orchestrate the full pipeline | Runs everything in order |
| `/demo-discovery` | Explore use cases, screenshot site, review past demos | Discovery Brief, `data/discovery/*.png` |
| `/demo-branding` | Visual identity, locale, Algolia connection | `lib/demo-config/index.ts`, `lib/algolia-config.ts` |
| `/demo-scrape` | Scrape product data from a website | `data/products.json` |
| `/data-structure` | Analyze data, generate transform/enrich code | `scripts/index-data.ts` |
| `/demo-data-indexing` | Index products, train Recommend, set up QS | Algolia index, Composition |
| `/demo-categories` | Category navigation from indexed data | `lib/demo-config/categories.ts` |
| `/demo-user-profiles` | User personas with preference weights | `lib/demo-config/users.ts` |
| `/demo-agent-setup` | AI shopping assistant config and deploy | `lib/demo-config/agents.ts`, AGENT_ID |

Each skill can be run independently (e.g. `/demo-categories` to update just the category nav after re-indexing).

## Quick Start

```bash
pnpm install
pnpm dev
```

See [SETUP.md](SETUP.md) for detailed manual setup instructions.

## Tech Stack

- **Next.js 16** — App Router, Server Components, React 19
- **Algolia** — Composition API, Agent Studio, InstantSearch, Recommend
- **AI SDK v5** — Vercel's AI SDK for agent chat
- **Tailwind CSS 4** + shadcn/ui + Radix UI
- **pnpm** — Package manager

## Project Structure

```
app/                    Pages and layouts (Next.js App Router)
components/             React components by feature
lib/
  demo-config/          All demo-specific config (brand, categories, users, agents)
  algolia-config.ts     Algolia connection (APP_ID, keys, index name)
  types/                TypeScript interfaces (Product, User, etc.)
  utils/                Utilities (price formatting, etc.)
scripts/                Indexing, agent setup, relevance tests
data/                   Product data and discovery screenshots
```
