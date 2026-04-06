# SE Demo Platform — Flow & Architecture

This is the single source of truth for how the SE bot builds and deploys custom demos.
Keep this document updated as the system evolves. When in doubt, this file wins.

---

## Overview

```
AE asks for a demo in Telegram
        ↓
SE bot gathers info (customer, website, slug)
        ↓
SE bot invokes Claude Code on the host
        ↓
Claude Code follows CLAUDE.md end-to-end
  (clone → configure → index → agent → push)
        ↓
SE bot deploys via Demo Manager API
        ↓
SE bot shares token-gated URL with AE
```

The SE bot is the **interface** and **orchestrator**. Claude Code is the **executor** for all repo work.

---

## Roles

| Who | Responsibility |
|-----|----------------|
| **SE bot (OpenClaw agent)** | Talks to AE, gathers requirements, invokes Claude Code, deploys, shares URL |
| **Claude Code** | Does all the actual work inside the repo: configure, scrape, index, commit, push |
| **Demo Manager API** | Builds Docker image, assigns port, generates token URL, manages container lifecycle |
| **GitHub** | Stores demo branches (`bot/demo/*`). Manager builds from these. |
| **Algolia** | Hosts the search index, Composition, AI agent |

---

## Prerequisites (already set up)

- **`/workspace/.github-bot-token.env`** — Bot PAT for pushing to `bot/demo/*` branches
- **`/workspace/.demo-manager-api-key`** — Manager API key
- **`/workspace/.anthropic-api-key`** — Anthropic API key for Claude Code
- **`/workspace/skills/algolia-demo-setup/.env`** — Contains `ALGOLIA_ADMIN_API_KEY`
- Demo Manager running on `172.17.0.1:3150` (from sandbox) / `127.0.0.1:3150` (from host)
- GitHub repo: `algolia/algolia-demo-template`, branch `bot/main` is the working trunk

---

## Step-by-Step Flow

### 1. Gather Info (SE bot, in Telegram)

Before starting, the bot must have:
- **Customer name** (e.g. "Gymshark")
- **Website URL** (e.g. `https://www.gymshark.com`)
- **Demo slug** — short, URL-safe, no spaces (e.g. `gymshark`). AE can suggest or bot generates.
- **Algolia credentials** — use defaults (`3FKQCCIUWO` / admin key from `.env`) or ask AE for custom App ID + Admin key

If any info is missing, ask before proceeding.

---

### 2. Invoke Claude Code (SE bot → Claude Code)

The bot invokes Claude Code via `exec` on the host. The workspace is mounted at `/workspace` in the sandbox, which maps to `/root/.openclaw/workspace-algolia-se/` on the host.

```bash
ANTHROPIC_API_KEY=$(cat /workspace/.anthropic-api-key)
cd /workspace
claude -p "<task prompt>" --allowedTools "Bash,Read,Write,Edit"
```

**The task prompt must include:**
- Customer name, website, slug
- Algolia App ID + search-only key (from `lib/algolia-config.ts` defaults or custom)
- Instruction to read and follow `/workspace/skills/algolia-demo-setup/SKILL.md`
- All file paths relative to the cloned repo (not the workspace root)
- The deploy command using `172.17.0.1:3150` (Docker bridge, accessible from the exec context)

**Why Claude Code, not the bot directly?**
- Claude Code can run arbitrary bash, edit files, and make decisions iteratively
- It handles errors, retries, and dynamic decisions (e.g. "site blocks scraping → use Algolia API instead")
- The bot would burn too many tokens and context managing a multi-step file editing task
- Claude Code's `--allowedTools` flag keeps it focused

---

### 3. Claude Code Executes (following SKILL.md + CLAUDE.md)

Claude Code reads `/workspace/skills/algolia-demo-setup/SKILL.md` first, then follows these phases:

#### Phase A: Clone + Branch
```bash
source /workspace/.github-bot-token.env
cd /workspace
git clone https://x-access-token:${GITHUB_BOT_TOKEN}@github.com/algolia/algolia-demo-template.git <slug>-demo
cd <slug>-demo
git checkout bot/main
git checkout -b bot/demo/<slug>
pnpm install
echo "ALGOLIA_ADMIN_API_KEY=<key>" > .env
```

#### Phase B: Configure (parallel with data indexing)
Edit these files in order:
1. `lib/algolia-config.ts` — App ID, search key, index name (`<slug>_ecommerce`), composition ID (`<slug>_ecommerce_composition`)
2. `lib/demo-config/index.ts` — brand name, tagline, logo path, currency, image domains
3. `lib/demo-config/users.ts` — demo personas with preference weights
4. `lib/demo-config/agents.ts` — agent instructions, filterable attributes, index description
5. `public/logo.png` + `app/favicon.ico` — download from customer site

**Skip `categories.ts`** — must wait for indexed data.

#### Phase C: Get Product Data
In order of preference:
1. **Customer already uses Algolia?** → pull from their index directly
2. **JSON/CSV feed available?** → use it
3. **Website scrapable?** → use `/workspace/skills/web-scraper/` skill
4. **None of the above** → use generic e-commerce placeholder data and tell AE

Data goes to `data/products.json` in the repo.

#### Phase D: Index + Setup
```bash
pnpm tsx scripts/index-data.ts data/products.json    # creates Composition automatically
pnpm tsx scripts/setup-agent.ts                       # creates/updates agent, writes AGENT_ID to config
pnpm tsx scripts/setup-query-suggestions.ts           # optional but recommended
```

After indexing, query the facets and populate `lib/demo-config/categories.ts`:
- Category `name` values must **exactly match** Algolia facet values (case-sensitive)
- Use the `slug` field for URL routing — also use the category name as the slug value (the app uses `name` not `slug` for URL construction)

#### Phase E: Commit + Push
```bash
git add -A
git commit -m "Setup demo for <Customer> — <N> products"
git push origin bot/demo/<slug>
```

---

### 4. Deploy (SE bot)

After Claude Code confirms the push, the bot deploys:

```bash
curl -X POST http://172.17.0.1:3150/demos \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $(cat /workspace/.demo-manager-api-key)" \
  -d '{"name": "<slug>", "branch": "bot/demo/<slug>"}'
```

Poll until `status: "running"` (builds take 1-3 min):

```bash
curl -s http://172.17.0.1:3150/demos/<slug> \
  -H "X-API-Key: $(cat /workspace/.demo-manager-api-key)"
```

---

### 5. Share URL (SE bot → AE)

When running, share the token-gated URL from the API response:
```
http://72.61.197.38:3100/demos/<slug>?token=<token>
```

Include a brief summary of what was built (product count, categories, AI agent status).

---

## Demo Manager API Reference

**Base:** `http://172.17.0.1:3150` (from sandbox) / `http://127.0.0.1:3150` (from host)
**Auth:** `X-API-Key: <key from .demo-manager-api-key>`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/demos` | Create + deploy. Body: `{"name": "slug", "branch": "bot/demo/slug"}` |
| `GET` | `/demos` | List all demos |
| `GET` | `/demos/<slug>` | Status + URL |
| `POST` | `/demos/<slug>/redeploy` | Rebuild after pushing changes |
| `DELETE` | `/demos/<slug>` | Tear down container |

Max 8 concurrent demos. Branch must start with `bot/demo/`.

---

## Branch Model

```
main              ← Protected. Template source. Never touch.
bot/main          ← Bot's working trunk. Tracks main.
bot/demo/<slug>   ← Per-customer demo branches.
```

---

## Known Issues + Lessons Learned

### Categories must match facet values exactly
After indexing, always query `hierarchical_categories.lvl0` and `lvl1` facets from Algolia to get the exact strings. Do not guess or normalize them. If they don't match `categories.ts`, category pages return empty results.

### `172.17.0.1` vs `127.0.0.1`
- From **inside a Docker sandbox** (SE bot's exec environment): use `172.17.0.1:3150`
- From **host** (Claude Code running directly on the VPS): use `127.0.0.1:3150`
- Claude Code runs on the **host**, so it must use `127.0.0.1`. The SKILL.md prompt to Claude Code should specify this.

### Demo URLs have no trailing slash
URLs must be `...?token=xxx` not `.../?token=xxx`. Nginx sends a 308 redirect on trailing slash which strips the token before auth runs.

### The bot should not do repo work directly
Every time the bot tried to orchestrate the repo setup manually (writing files, running scripts in subagents), it produced inconsistent results, burned tokens, and still needed manual intervention. Claude Code is the right tool. The bot's job ends at "fire Claude Code and wait."

### Claude Code needs `--allowedTools "Bash,Read,Write,Edit"`
`--permission-mode bypassPermissions` is blocked for root users. `--print` alone silently blocks bash in non-interactive mode. The correct invocation is:
```bash
ANTHROPIC_API_KEY=$(cat /workspace/.anthropic-api-key) claude -p "<prompt>" --allowedTools "Bash,Read,Write,Edit"
```

### `index-data.ts` creates the Composition — don't skip it
The Algolia Composition is created as a side effect of `index-data.ts`. If you index products any other way (direct API, etc.), the Composition won't exist and the frontend will 404 on every search.

### Product data quality matters
300 real scraped products >> 15 hardcoded products for a demo. AEs notice immediately. Always try to get real data. If the customer uses Algolia already, pull from their index directly.

---

## What Good Looks Like (Gymshark test, 2026-04-06)

- **3,030 products** pulled directly from Gymshark's own Algolia index
- Full category tree (Men, Women, Accessories + subcategories)
- AI Shopping Assistant configured with exact filterable attributes
- Query suggestions index live
- 4 demo personas (Gym Enthusiast, Runner, Weightlifter, New Visitor)
- Deployed at `http://72.61.197.38:3100/demos/gymshark?token=...`
- Total time: ~15 min end-to-end (most of it Claude Code + Docker build)
