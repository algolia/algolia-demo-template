# Generalitat de Catalunya Demo

> AI-powered citizen search portal for the Government of Catalonia — demonstrating Agent Studio with structured inline AI summaries, NeuralSearch over 152K government web pages, and bilingual Catalan/Spanish support.

**Live:** https://alg-gencat-demo.netlify.app

## Screenshots

| Homepage | Search Results |
|----------|---------------|
| ![Homepage](data/showcase/homepage.lowres.png) | ![Search Results](data/showcase/search-results.lowres.png) |

## Use Case

- **Customer:** Generalitat de Catalunya (Government of Catalonia)
- **Vertical:** Government / Public Sector
- **Audience:** AE showing to Head of Digital Experience at GenCat — they're evaluating Agent Studio vs Google Vertex AI for citizen-facing search
- **Key scenarios:** Natural language citizen queries in Catalan ("Necessito ajuda per pagar el lloguer") returning structured AI summaries with source citations, plus traditional search results with NeuralSearch semantic matching

## What Makes This Demo Different

This is a government content portal, not e-commerce. The entire UI has been restyled to match the real web.gencat.cat website — 3-layer navbar with "Ciutadania | La Generalitat" tabs, "Cercador" hero banner, and clean list-style search results with underlined titles and domain labels. The data is 152K crawled web pages (not products), so every component was adapted: cards show titles/snippets/domains instead of prices/images, filters use topic areas (Ensenyament, Salut, Treball) instead of product categories, and the agent answers citizen questions about government services.

The standout feature is the **structured `showSummary` client-side tool**: the agent searches the index, then calls `showSummary` with typed fields (summary text + source URLs), which renders as a polished "Resum amb IA" card with numbered source citations — matching the real GenCat site's AI summary feature. The tool call streams progressively so the summary appears word-by-word. Follow-up suggestions from the agent SSE stream appear as clickable pills that open the conversational sidepanel with context.

NeuralSearch is active on the index with tuned attribute weights (title: 1.0, h1: 0.9, snippet: 0.8, h2: 0.5) — this was critical because keyword search returned 0 results for 7 out of 10 of GenCat's test queries, while NeuralSearch recovered all of them.

## Features Highlighted

- **Agent Studio `showSummary` tool** — Structured client-side tool with progressive streaming, numbered source citations, and follow-up suggestions
- **NeuralSearch** — Semantic search over government content in Catalan; recovers queries that keyword search completely misses
- **Bilingual UI** — Full Catalan/Spanish language switcher affecting all UI text, agent prompts, and search queries
- **GenCat-matching design** — 3-layer navbar, "Cercador" hero, clean list results matching web.gencat.cat
- **Personalization** — 4 citizen personas (family, entrepreneur, job seeker, visitor) with topic preference weights
- **Context handoff** — Summary suggestions pass context to the conversational sidepanel agent via `[CONTEXT]` injection

## Customizations vs Template

### Data & Relevance
- **Record count:** 152,475 pages (gencat_content index)
- **Data source:** Crawled from web.gencat.cat and subdomains (habitatge, educacio, tramits, etc.)
- **Key facets:** ambito (topic), domain, lang, mimeType, hierarchical_categories
- **NeuralSearch:** Active with tuned weights — title (1.0), h1 (0.89), snippet (0.8), h2 (0.5)
- **Languages:** Catalan + Spanish with stop words, plurals, and query language detection

### Personalization
- **Familia escolar** — Education-focused parent (Ensenyament weighted high)
- **Emprenedor** — Entrepreneur seeking grants (Empresa, Economia weighted)
- **Buscant feina** — Job seeker (Treball, Administració Pública weighted)
- **Visitant nou** — New visitor with no preferences (baseline)

### AI Agent
- **Two agents:** Main conversational agent + dedicated summary agent
- **showSummary tool** — Client-side tool returning `{summary, sources[]}` for structured rendering
- **showItems tool** — Displays relevant pages with title and explanation
- **Instructions:** Catalan-first, searches index before responding, includes source URLs
- **Suggestions:** SSE `data-suggestions` events captured and displayed as pills

### Branding
- **Locale:** Catalan (ca) / EUR
- **Category depth:** 2 levels (topic > site)
- **Visual identity:** Matches web.gencat.cat — red coat of arms logo, 3-layer header, gray hero sections, government portal aesthetic

## Running This Demo

```bash
git checkout demo/government-portal-gencat
pnpm install
pnpm dev
```

Requires `.env` with `ALGOLIA_ADMIN_API_KEY` for indexing scripts. Search works with the committed search-only key.

## Tech Stack

Next.js 16, React 19, Algolia Composition API, Agent Studio, NeuralSearch, AI SDK v5, Tailwind CSS 4, shadcn/ui.
