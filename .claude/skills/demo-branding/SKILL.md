---
name: demo-branding
description: 'Configure visual identity, brand settings, locale, and Algolia connection for the demo. Use when setting up a new demo brand, changing customer name/logo/favicon, updating currency/locale, or connecting to a different Algolia app.'
---

# Demo Branding

Configure the demo's visual identity, locale settings, and Algolia connection details.

## Prerequisites

Before starting, verify:
- Dependencies installed (`node_modules/` exists — run `pnpm install` if not)
- `.env` file exists with `ALGOLIA_ADMIN_API_KEY`

## Inputs Needed

Ask the user for:
1. **Customer name** (e.g. "Acme Corp")
2. **Vertical** (e.g. "ecommerce", "media") — used to derive index name
3. **Website URL** (for favicon/logo download)
4. **Algolia credentials** — use defaults in `lib/algolia-config.ts` or provide custom APP_ID + Search API Key
5. **Locale** — language, currency code, currency symbol (default: en, USD, $)

## Step 1: Update `lib/demo-config/index.ts`

This file exports `DEMO_CONFIG`, used throughout the app for brand display and price formatting.

```typescript
export const DEMO_CONFIG = {
  brand: {
    name: "Customer Name",        // Appears in navbar, page titles, agent instructions
    tagline: "Short tagline",     // Homepage hero text
    logoUrl: "/logo.svg",         // Path in public/ — update if using .png
    logoWidth: 120,               // Adjust to logo aspect ratio
    logoHeight: 40,
    agentName: "Customer AI",     // Shown in agent-related UI
  },
  locale: {
    language: "en",               // Response language default
    currency: "USD",              // ISO currency code
    currencySymbol: "$",          // Used by formatPrice() in lib/utils/format.ts
  },
  imageDomains: [
    // Add CDN hostnames where product images are hosted
    // Required for Next.js <Image> optimization (read by next.config.ts)
    { protocol: "https" as const, hostname: "example.cdn.com" },
  ],
};
```

Generate a tagline appropriate for the customer's vertical and brand.

**Image domains** may not be known yet if data hasn't been indexed. Set an empty array and update after running `/demo-data-indexing`, which reports discovered image domains.

## Step 2: Update `lib/algolia-config.ts`

This file exports `ALGOLIA_CONFIG` with non-sensitive connection values (safe to commit).

```typescript
export const ALGOLIA_CONFIG = {
  APP_ID: "YOUR_APP_ID",
  SEARCH_API_KEY: "your_search_only_key",
  INDEX_NAME: "<customer_slug>_<vertical>",         // e.g. "acme_ecommerce"
  COMPOSITION_ID: "<index_name>_composition",       // e.g. "acme_ecommerce_composition"
  AGENT_ID: "",  // DO NOT set — managed by /demo-agent-setup
};
```

- `INDEX_NAME`: derive from customer slug + vertical (e.g. `acme_ecommerce`)
- `COMPOSITION_ID`: always `<INDEX_NAME>_composition`
- `AGENT_ID`: leave as empty string `""` — only `/demo-agent-setup` writes this value

## Step 3: Download Favicon

Fetch from the customer's actual website:

1. Fetch the homepage HTML
2. Parse `<link rel="icon" ...>` and `<link rel="apple-touch-icon" ...>` tags
3. Prefer the largest available icon (apple-touch-icon is usually 180x180)
4. Download directly from the source URL (resolve relative URLs against the homepage)
5. Save to `app/favicon.ico`
6. **Verify:** Run `file app/favicon.ico` and check file size — warn if < 1KB
7. **Fallback:** If no icon tags found or download fails, use `https://www.google.com/s2/favicons?domain=DOMAIN&sz=128`

## Step 4: Download Logo

1. Fetch the customer's homepage HTML
2. Look for logo `<img>` or `<svg>` in the site header/nav area
3. Download to `public/logo.svg` (preferred) or `public/logo.png` if SVG not available
4. Update `DEMO_CONFIG.brand.logoUrl` to match the file path (e.g. `/logo.svg` or `/logo.png`)
5. Verify with `file <path>` — confirm it's a valid image

## Idempotency

This skill is safe to re-run. All values are overwritten cleanly. Re-running after data indexing is common to update `imageDomains`.
