# Demo Setup Instructions for Claude Code

You are setting up a branded Algolia demo. Follow these phases in order. Do the work — don't describe what you would do.

---

## Phase A: Clone + Branch

```bash
source /workspace/.github-bot-token.env
cd /workspace
rm -rf <slug>-demo
git clone https://x-access-token:${GITHUB_BOT_TOKEN}@github.com/algolia/algolia-demo-template.git <slug>-demo
cd <slug>-demo
git checkout bot/main
git checkout -b bot/demo/<slug>
pnpm install
echo "ALGOLIA_ADMIN_API_KEY=$(grep ALGOLIA_ADMIN_API_KEY /workspace/skills/algolia-demo-setup/.env | cut -d= -f2)" > .env
```

---

## Phase B: Configure (do this while data is indexing)

Edit these files. All live in `lib/`:

### `lib/algolia-config.ts`
```ts
export const ALGOLIA_CONFIG = {
  APP_ID: "<App ID from prompt>",
  SEARCH_API_KEY: "<Search Key from prompt>",
  INDEX_NAME: "<slug>_ecommerce",
  COMPOSITION_ID: "<slug>_ecommerce_composition",
  AGENT_ID: "",  // filled in after setup-agent.ts runs
};
```

### `lib/demo-config/index.ts`
- Brand name = Customer name
- Tagline = short motivating phrase appropriate for the vertical
- `agentName` = `"<Customer> AI"`
- `imageDomains` = leave empty for now (fill in after you know the image CDN)
- Currency = USD unless the site is clearly non-US

### `lib/demo-config/users.ts`
Create 3-4 demo personas appropriate for the vertical (e.g. for fitness: Gym Enthusiast, Runner, Weightlifter, New Visitor). Use `hierarchical_categories.lvl0` and `lvl1` preference weights (0-20).

**Leave preference values empty for now** — fill in after you know the actual category names from the index.

### `lib/demo-config/agents.ts`
- Agent name and instructions tailored to the customer vertical
- `enhancedDescription` should document the exact filterable attributes and category values
- **Leave category values in enhancedDescription blank for now** — fill in after indexing

### Logo + Favicon
Fetch from the customer's actual website:
```bash
# Try to find and download the logo
curl -sL -o public/logo.png "<logo URL from site>"
# Favicon
curl -sL -o app/favicon.ico "<favicon URL from site>"
```
Verify with `file public/logo.png` — warn if < 1KB.

### **Skip `lib/demo-config/categories.ts`** until after indexing.

---

## Phase C: Get Product Data

Try in this order:

### Option 1: Customer already uses Algolia (best)
Check if the site makes XHR calls to `*.algolia.net` or `*.algolia.io`. If yes:
```bash
# Probe their index
python3 -c "
import httpx, json
# Inspect network calls from the website to find App ID + search key
# Then pull from their index
"
```
Use `scripts/download-index.ts` if their index is accessible, or write a custom fetcher using their search-only key.

### Option 2: Scrapable website
Use the web-scraper skill:
```bash
# The scraper needs Playwright + Chromium — available in this environment
cd /workspace
python3 skills/web-scraper/scrape.py --url "<website>" --output <slug>-demo/data/products.json
```
Then verify: `wc -l <slug>-demo/data/products.json`

### Option 3: No accessible data
Use placeholder fitness/fashion/retail products appropriate to the vertical. Create at least 30 products with realistic names, prices, images (use Unsplash URLs), and hierarchical categories.

---

## Phase D: Index + Setup

```bash
cd /workspace/<slug>-demo

# Index products — this also creates the Composition automatically
pnpm tsx scripts/index-data.ts data/products.json

# Create/update the AI agent — writes AGENT_ID back to lib/algolia-config.ts
pnpm tsx scripts/setup-agent.ts

# Query suggestions (recommended)
pnpm tsx scripts/setup-query-suggestions.ts
```

---

## Phase E: Post-Index Config (categories + agents)

After indexing, query the actual facet values:

```bash
curl -s "https://<APP_ID>-dsn.algolia.net/1/indexes/<slug>_ecommerce/query" \
  -H "X-Algolia-Application-Id: <APP_ID>" \
  -H "X-Algolia-API-Key: <ADMIN_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"query":"","hitsPerPage":0,"facets":["hierarchical_categories.lvl0","hierarchical_categories.lvl1"]}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); [print(k,':',v) for k,v in d.get('facets',{}).items()]"
```

Then:

### `lib/demo-config/categories.ts`
Build the category tree using **exact** facet values (case-sensitive). Pick the 3-6 most important top-level categories. Example:
```ts
export const HIERARCHICAL_CATEGORIES = {
  women: {
    name: "Women",   // MUST match Algolia facet value exactly
    slug: "Women",   // Use the name as the slug — app uses name for URL construction
    count: 842,
    icon: ShoppingBag,
    children: {
      leggings: { name: "Leggings", slug: "Leggings", count: 170 },
      // etc.
    },
  },
  // etc.
};
```

### Update `lib/demo-config/agents.ts`
Fill in the actual category values in `enhancedDescription`.

### Update `lib/demo-config/users.ts`
Fill in preference weights using the actual category names.

### Update `lib/demo-config/index.ts`
Add actual image domains found in the product data.

---

## Phase F: Commit + Push

```bash
cd /workspace/<slug>-demo
git add -A
git commit -m "Setup demo for <Customer> — <N> products indexed"
git push origin bot/demo/<slug>
```

---

## Phase G: Report Back

Output a summary:
```
✅ Demo branch pushed: bot/demo/<slug>

Products: <N>
Categories: <list top-level>
Image domains: <list>
Agent ID: <agent-id>
Composition: <slug>_ecommerce_composition

Ready to deploy.
```

The SE bot will handle the actual `POST /demos` deploy call.

---

## Important Rules

- **Always use pnpm** (not npm or yarn)
- **Category names must exactly match Algolia facet values** — query the index, don't guess
- **Use `127.0.0.1:3150`** for the Demo Manager API (you're on the host, not in Docker)
- **`index-data.ts` creates the Composition** — never skip it even if you indexed data another way
- **Never push to `main` or `bot/main`** — only `bot/demo/*`
- **The `.env` file is gitignored** — never commit it
