---
name: demo-setup
description: 'Run the full demo setup — branding, data indexing, users, categories, and agent — all at once. Use when setting up a new demo from scratch within this repo, or when the user says "set up the demo" or "configure everything".'
---

# Demo Setup (Orchestrator)

Run all repo-scoped skills in the right order for a full demo setup. This is the "do everything" skill for when the repo already exists and `.env` is configured.

## Prerequisites

Before starting, verify:
- Dependencies installed: `pnpm install`
- `.env` file exists with `ALGOLIA_ADMIN_API_KEY`
- If not, run: `bash ~/.claude/skills/algolia-demo-setup/scripts/setup-env.sh .`

## Phase 1: Gather Information

Present ALL questions to the user at once:

```
Let's set up the demo. I need a few details:

1. **Customer name**: (e.g. "Acme Corp")

2. **Vertical + sub-vertical** (e.g. "e-commerce furniture", "media streaming"):
   - [ ] E-commerce / Retail — sub-vertical: ___
   - [ ] Media / Content — sub-vertical: ___
   - [ ] Marketplace — sub-vertical: ___
   - [ ] B2B / Industrial — sub-vertical: ___
   - [ ] Other: ___

3. **Website URL** (for favicon/logo): ___

4. **Algolia credentials**:
   - [ ] Use defaults (already in .env / algolia-config.ts)
   - [ ] Custom — provide App ID, Search API Key, and Admin API Key

5. **Product data**:
   - [ ] I have a JSON/CSV file (provide path)
   - [ ] Pull from an existing Algolia index (provide app ID + index name)
   - [ ] Scrape a website (provide URL)
   - [ ] No data yet — skip indexing for now
```

**WAIT for the user to respond before proceeding.**

## Phase 2: Execute Skills

Run the skills in order, parallelizing where possible.

### Step 1: Branding (first — sets up config files other skills depend on)

Invoke `/demo-branding` with the customer name, vertical, website URL, credentials, and locale.

This configures `lib/demo-config/index.ts` and `lib/algolia-config.ts` (INDEX_NAME, COMPOSITION_ID, etc.) which the data indexing scripts need.

### Step 2: Data + Users (in parallel)

Launch two agents:

**Background agent** — Data indexing:
- If user chose web scraping: invoke `/demo-scrape` first, then `/demo-data-indexing`
- Otherwise: invoke `/demo-data-indexing` with the chosen data source
- Report back: record count, image domains, category facet values

**Foreground agent** — User profiles:
- Invoke `/demo-user-profiles` with the vertical and known product attributes

### Step 3: Post-data setup (after data indexing completes)

Once the data agent reports back:

1. **Update image domains** — add reported domains to `DEMO_CONFIG.imageDomains` in `lib/demo-config/index.ts`
2. **Categories** — invoke `/demo-categories` with the reported facet values
3. **Agent setup** — invoke `/demo-agent-setup` with the customer info and product attributes

### Step 4: Launch

Start the dev server:

```bash
pnpm dev
```

## Summary

Print when done:

```
Demo setup complete!

  Directory: <current dir>
  Branch:    <current branch>
  Index:     <INDEX_NAME>
  App ID:    <APP_ID>
  Local:     http://localhost:3000

Skills executed:
  - /demo-branding        — brand, locale, Algolia config, favicon/logo
  - /demo-data-indexing   — <N> products indexed
  - /demo-user-profiles   — <N> user profiles created
  - /demo-categories      — <N> top-level categories configured
  - /demo-agent-setup     — agent deployed (AGENT_ID: <id>)

Next steps:
  - Browse the demo at http://localhost:3000
  - Review categories in lib/demo-config/categories.ts
  - Review user profiles in lib/demo-config/users.ts
  - Test search relevance with: pnpm tsx scripts/test-relevance.ts
```
