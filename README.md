# Algolia Demo Template

E-commerce demo template for Algolia Solutions Engineering. Fork this into a demo branch per customer.

## Quick Start

```bash
pnpm install
pnpm dev
```

See [SETUP.md](SETUP.md) for full configuration guide.

## Creating a Demo

Use `/demo-setup` to configure a new demo. This creates a branch (`demo/<customer-slug>`) and runs all setup skills automatically.

## Features

- **Product search** with Algolia Composition API and NeuralSearch
- **AI shopping assistant** (Agent Studio) with guided purchase flow
- **Retail media pipeline** — sponsored carousels, inline ads, cross-sell banners via composition rules
- **Click & Collect** — store finder, per-product availability, cart-aware proximity boost
- **Personalization** with user profiles and preference-weighted boosting
- **Rich autocomplete** with product previews, query suggestions, and recent searches
- **Category navigation** with hierarchical facets and dynamic facet ordering
- **Article/content indexing** with dedup for educational content alongside products

## Architecture

See [CLAUDE.md](CLAUDE.md) for full architecture documentation.

## Tech Stack

Next.js 16, React 19, Algolia Composition API, Agent Studio, AI SDK v5, Tailwind CSS 4, shadcn/ui.
