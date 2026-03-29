---
name: demo-showcase
description: "Document what makes a completed demo unique — takes screenshots, analyzes customizations vs the template, and rewrites the README.md as a structured demo card. Use after the demo is fully built and working, as the final step of the pipeline. Also use when the user says 'showcase this demo', 'document this demo', 'create a demo card', or wants to capture what was built on a branch."
---

# Demo Showcase

Capture and document a completed demo so future discovery can instantly understand what this branch does, why it's different, and what it looks like — without inspecting config files one by one.

This skill runs AFTER the demo is fully built and working. It's the final step of the pipeline.

## Prerequisites

- Demo is functional (all config, data, and agent setup complete)
- On a demo branch (not main)
- `pnpm install` has been run

## Phase 1: Analyze Customizations

Understand what changed on this branch compared to the template.

### 1a. Diff summary

```bash
git diff main...HEAD --stat
```

This gives you the full picture of what files were touched. Note the scope — was this a data-only demo? Did it customize components? Add new features?

### 1b. Read the config files

Read these files to understand the demo's identity:

- `lib/demo-config/index.ts` — brand name, tagline, locale, image domains
- `lib/demo-config/categories.ts` — category tree structure and depth
- `lib/demo-config/users.ts` — user personas and preference weights
- `lib/demo-config/agents.ts` — agent instructions, tools, product attributes
- `lib/algolia-config.ts` — index name, composition ID, agent ID
- `scripts/index-data.ts` — transform/enrich functions (how raw data was shaped)

### 1c. Identify the story

Don't just list what changed — understand WHY. Connect the customizations to a narrative:

- What vertical is this? What's the customer's business?
- What pain points does this demo address?
- What Algolia capabilities does it highlight?
- What makes the data interesting (enrichments, facets, hierarchy)?
- What's the agent good at in this context?

If you're unsure about the "why" behind any choices, ask the user — they built this and know the story.

## Phase 2: Screenshot the Live Demo

Start the dev server and capture key pages.

```bash
# Start the dev server in background
pnpm dev &
DEV_PID=$!

# Wait for it to be ready
sleep 8

mkdir -p data/showcase
```

Capture these pages using `screenshot.py`:

```bash
# Homepage
python .claude/skills/demo-showcase/scripts/screenshot.py \
  --url "http://localhost:3000" \
  --output "data/showcase/homepage.png"

# Search results — pick a query that shows off the demo's strengths
# (e.g., a query that demonstrates good relevance, NeuralSearch, or faceting)
python .claude/skills/demo-showcase/scripts/screenshot.py \
  --url "http://localhost:3000?q=REPRESENTATIVE_QUERY" \
  --output "data/showcase/search-results.png"

# Product detail — pick a representative product
python .claude/skills/demo-showcase/scripts/screenshot.py \
  --url "http://localhost:3000/products/PRODUCT_ID" \
  --output "data/showcase/product-detail.png"

# Category page — pick a main category
python .claude/skills/demo-showcase/scripts/screenshot.py \
  --url "http://localhost:3000/category/CATEGORY_SLUG" \
  --output "data/showcase/category-page.png"
```

**Choosing what to screenshot:**
- For the search query, pick something that shows the demo's best relevance story (ask the user if unsure)
- For the product, pick one with rich data (images, attributes, recommendations)
- For the category, pick the deepest or most populated one
- If the agent has a standout interaction, open the sidepanel and capture that too:
  ```bash
  python .claude/skills/demo-showcase/scripts/screenshot.py \
    --url "http://localhost:3000?agent=open" \
    --output "data/showcase/agent.png"
  ```

After capturing, kill the dev server:

```bash
kill $DEV_PID 2>/dev/null
```

Read the `.lowres.png` versions to verify the captures look good. Retake any that are blank, broken, or don't represent the demo well.

## Phase 3: Write the README

Replace the template README.md with a demo-specific version. This is the "demo card" that future `/demo-discovery` runs will consume.

Read the current README.md first, then rewrite it using this structure:

```markdown
# [Brand Name] Demo

> [One-line description: what this demo showcases and why it matters]

## Screenshots

| Homepage | Search Results |
|----------|---------------|
| ![Homepage](data/showcase/homepage.lowres.png) | ![Search Results](data/showcase/search-results.lowres.png) |

| Product Detail | Category Page |
|---------------|---------------|
| ![Product Detail](data/showcase/product-detail.lowres.png) | ![Category Page](data/showcase/category-page.lowres.png) |

## Use Case

- **Customer:** [name]
- **Vertical:** [vertical]
- **Audience:** [who this was built for — e.g., "AE showing to VP of Digital at [company]"]
- **Key scenarios:** [what to demonstrate — e.g., "NeuralSearch handling natural language queries for furniture"]

## What Makes This Demo Different

[A narrative paragraph — not a bullet list — explaining the unique value of this demo. What story does it tell? What Algolia capabilities does it highlight that the template doesn't? What's special about the data, the personalization, or the agent? This should read like a pitch to someone deciding which demo branch to use for a similar prospect.]

## Features Highlighted

- **[Feature]** — [brief explanation of what it shows and why it matters]
- **[Feature]** — [brief explanation]
...

## Customizations vs Template

### Data & Relevance
- **Product count:** [N] products
- **Data source:** [scraped from X / provided by customer / Algolia index Y]
- **Key facets:** [list the filterable attributes]
- **Enrichments:** [what was AI-generated — e.g., semantic_attributes, keywords]
- **Transform/enrich logic:** [brief summary of what scripts/index-data.ts does differently]

### Personalization
- **User personas:** [list each persona with a one-line description]
- **Preference strategy:** [what attributes are weighted and why]

### AI Agent
- **Agent name:** [name]
- **Key capabilities:** [what it can do — highlight anything beyond default search + cart]
- **Custom tools:** [any additions beyond addToCart and showItems]
- **Notable instructions:** [what makes the agent's personality or knowledge unique]

### Branding
- **Locale:** [language / currency]
- **Category depth:** [N levels — e.g., "3 levels: Department > Category > Subcategory"]
- **Visual identity:** [any notable branding choices — colors, logo treatment]

## Running This Demo

```bash
pnpm install
pnpm dev
```

Requires `.env` with `ALGOLIA_ADMIN_API_KEY` for indexing scripts. Search works with the committed search-only key.

## Tech Stack

Next.js 16, React 19, Algolia Composition API, Agent Studio, AI SDK v5, Tailwind CSS 4, shadcn/ui.
```

**Important guidance for writing the README:**
- The "What Makes This Demo Different" section is the most important part. Future discovery will scan this to decide if this branch is relevant. Make it descriptive and specific.
- Use concrete details, not generic descriptions. "NeuralSearch handles 'cozy reading nook' → returns armchairs and floor lamps" is better than "NeuralSearch improves search relevance."
- The screenshots table uses `.lowres.png` versions so they render in GitHub and are readable by AI during discovery.
- Keep the running instructions simple — someone checking out this branch should be able to `pnpm install && pnpm dev` and see it work.

## Phase 4: Verify

1. Read the finished README.md and make sure it accurately represents the demo
2. Check that all screenshot files exist in `data/showcase/`
3. Present the README to the user for final approval before considering the showcase complete

Ask:
> "Here's the demo card I've written for this branch. Does this accurately capture what makes this demo special? Anything to add or change?"