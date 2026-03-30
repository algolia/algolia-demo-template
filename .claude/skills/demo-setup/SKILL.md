---
name: demo-setup
description: 'Run the full demo setup — discovery, branding, data indexing, users, categories, and agent — all at once. Use when setting up a new demo from scratch within this repo, or when the user says "set up the demo" or "configure everything".'
---

# Demo Setup (Orchestrator)

Run all repo-scoped skills in the right order for a full demo setup. This is the "do everything" skill for when the repo already exists and `.env` is configured.

## Prerequisites

Before starting, verify:
- Dependencies installed: `pnpm install`
- `.env` file exists with `ALGOLIA_ADMIN_API_KEY`
- If not, run: `bash ~/.claude/skills/algolia-demo-setup/scripts/setup-env.sh .`

## Phase 1: Gather Information + Discovery

This phase combines initial user input with use-case discovery. The discovery brief feeds ALL downstream skills.

### Step 1: Gather basics

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

6. **Who is the audience?** (e.g., "AE showing to VP of Digital", "SE doing a technical deep-dive")

7. **Key pain points or use cases** the demo should highlight:
   - [ ] Search relevance / merchandising
   - [ ] AI-powered discovery (NeuralSearch, recommendations)
   - [ ] Personalization
   - [ ] AI shopping assistant (agent)
   - [ ] Faceted navigation / filtering
   - [ ] Other: ___

8. **Any specific scenarios** to demo? (e.g., "show how 'red dress' search gets better results")

9. **Anything to preserve** from the customer's current site UX?
```

**WAIT for the user to respond before proceeding.**

### Step 2: Run `/demo-discovery`

Invoke `/demo-discovery` with the gathered context (customer name, website URL, vertical, audience, use cases, preservation notes).

This produces a **Discovery Brief** containing:
- Suggested features and interactions (priority order)
- Data requirements (required fields, facets, enrichments, ranking signals)
- Visual direction (what to preserve, what to improve, mockups, references)
- Reference demos from similar git branches

Present the brief to the user for confirmation before proceeding.

**WAIT for confirmation/adjustments.**

### Step 3: Enter Plan Mode

Once the Discovery Brief is confirmed, **enter plan mode** to present the execution plan. The plan should lay out:

1. What each downstream skill will do, informed by the brief
2. The order of execution and what runs in parallel
3. Key decisions already made (data source, enrichments, personalization strategy)
4. What files will be created/modified

Present the plan for user approval before executing anything.

**WAIT for plan approval.**

## Phase 2: Execute Skills

Run the skills in order, parallelizing where possible. The discovery brief informs every skill.

### Step 1: Branding (first — sets up config files other skills depend on)

Invoke `/demo-branding` with the customer name, vertical, website URL, credentials, locale, and visual direction from the discovery brief.

This configures `lib/demo-config/index.ts` and `lib/algolia-config.ts` (INDEX_NAME, COMPOSITION_ID, etc.) which the data indexing scripts need.

### Step 2: Data + Users (in parallel)

Launch two agents:

**Background agent** — Data pipeline:
- If user chose web scraping: invoke `/demo-scrape` first
- Invoke `/demo-data-indexing` to analyze data against the discovery brief's data requirements, generate transform/enrich code, index, train Recommend, and set up QS
- Report back: record count, image domains, category facet values

**Foreground agent** — User profiles:
- Invoke `/demo-user-profiles` with the vertical, known product attributes, and personalization strategy from the discovery brief

### Step 3: Post-data setup (after data indexing completes)

Once the data agent reports back:

1. **Update image domains** — add reported domains to `DEMO_CONFIG.imageDomains` in `lib/demo-config/index.ts`
2. **Categories** — invoke `/demo-categories` with the reported facet values
3. **Agent setup** — invoke `/demo-agent-setup` with the customer info, product attributes, and agent feature suggestions from the discovery brief

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
  - /demo-discovery       — use-case exploration, demo vision brief
  - /demo-branding        — brand, locale, Algolia config, favicon/logo
  - /demo-data-indexing   — data analysis, transform/enrich, <N> products indexed
  - /demo-user-profiles   — <N> user profiles created
  - /demo-categories      — <N> top-level categories configured
  - /demo-agent-setup     — agent deployed (AGENT_ID: <id>)

Next steps:
  - Browse the demo at http://localhost:3000
  - Review categories in lib/demo-config/categories.ts
  - Review user profiles in lib/demo-config/users.ts
  - Test search relevance with: pnpm tsx scripts/test-relevance.ts
```
