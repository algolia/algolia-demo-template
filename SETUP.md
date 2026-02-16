# New Demo Setup Guide

Follow these steps to configure this template for a new demo or customer.

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Configure Brand & Locale

Edit `lib/demo-config/index.ts`:

- **brand.name** — Store name shown in title bar and metadata
- **brand.tagline** — Subtitle / meta description
- **brand.logoUrl** — Path to logo (place in `public/` or use external URL)
- **brand.logoWidth / logoHeight** — Logo dimensions
- **brand.agentName** — Name shown in AI assistant header
- **locale.language** — HTML lang attribute (e.g. `"en"`, `"es"`, `"it"`)
- **locale.currency / currencySymbol** — Currency code and symbol for price formatting
- **imageDomains** — Remote image domains for Next.js `<Image>` (protocol + hostname)

## 3. Configure Categories

Edit `lib/demo-config/categories.ts`:

- Define your category tree in `HIERARCHICAL_CATEGORIES`
- Each root category needs: `name`, `slug`, `icon` (Lucide icon component), and optional `children`
- Map category icons in `CATEGORY_ICONS` for the filters sidebar

## 4. Configure Demo Users

Edit `lib/demo-config/users.ts`:

- Define user profiles in `users` array with preference scores
- Update `PREFERENCE_METADATA` to map your facet names to display labels

## 5. Configure Agent Instructions

Edit `lib/demo-config/agents.ts`:

- Customize agent instructions for main, suggestion, and checkout agents
- Update `indexDescription` with your actual category values and filterable fields

## 6. Add Product Feed

Place your product feed XML in `data/` (e.g. `data/feed.xml`).

The XML should follow the structure expected by `scripts/index-data.ts`. Modify the script if your feed format differs.

## 7. Set Environment Variables

Create a `.env` file:

```bash
# Algolia Core
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=your_search_api_key
ALGOLIA_ADMIN_API_KEY=your_admin_api_key

# Index and Composition
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=your_index_name
NEXT_PUBLIC_ALGOLIA_COMPOSITION_ID=your_composition_id

# Agent Studio (optional - for AI features)
NEXT_PUBLIC_AGENT_API_KEY=your_agent_api_key
NEXT_PUBLIC_ALGOLIA_AGENT_ID=your_agent_id
NEXT_PUBLIC_ALGOLIA_SUGGESTION_AGENT_ID=your_suggestion_agent_id
NEXT_PUBLIC_ALGOLIA_CHECKOUT_AGENT_ID=your_checkout_agent_id

NODE_ENV=development
```

## 8. Index Products

```bash
pnpm tsx scripts/index-data.ts [path/to/feed.xml]
```

If no path is given, defaults to `data/feed.xml`. You can also set `DATA_FEED_PATH` env var.

## 9. Set Up Agents

```bash
pnpm tsx scripts/setup-agent.ts
```

## 10. Add Branding Assets

- Place your logo at the path configured in `lib/demo-config/index.ts` (default: `public/logo.svg`)
- Add `public/icon.png` and `public/favicon.ico`

## 11. Set Up Query Suggestions (optional)

```bash
pnpm setup:suggestions
```

## 12. Run Development Server

```bash
pnpm dev
```

Visit http://localhost:3000 to see the demo.

## Quick Reference: Config Files

| File | Purpose |
|------|---------|
| `lib/demo-config/index.ts` | Brand, locale, image domains |
| `lib/demo-config/categories.ts` | Category tree and icons |
| `lib/demo-config/users.ts` | Demo user profiles and preference metadata |
| `lib/demo-config/agents.ts` | AI agent instructions |
| `.env` | Algolia credentials and IDs |
