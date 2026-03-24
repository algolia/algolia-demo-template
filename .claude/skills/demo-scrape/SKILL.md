---
name: demo-scrape
description: 'Scrape product data from a website for the demo. Handles sitemap discovery, method detection, API discovery, anti-bot bypass, and structured data extraction. Outputs to data/products.json with status logging. Use when the user wants to scrape a website for product data.'
---

# Demo Scrape

Scrape structured product data from any website. Bundles a full-featured fetcher utility for sitemap analysis, method detection, API interception, and extraction.

## Prerequisites

- Python 3.11+ installed
- Install dependencies: `pip install -r .claude/skills/demo-scrape/scripts/requirements.txt`
- Install browser: `playwright install chromium`

## Workflow

> **Authorization:** Only scrape websites you own or have explicit permission to scrape. Respect `robots.txt` Disallow rules.

```
PHASE 0: DISCOVER (sitemap analysis — fast, no browser)
  0.1  Analyze sitemap to find available data types and counts
  0.2  Present options to user if they haven't specified what to scrape

PHASE 1: GATHER INFO
  1.1  Target URL(s) or data type from sitemap
  1.2  What data to extract
  1.3  Confirm output will go to data/products.json

PHASE 2: FETCH & ANALYZE
  2.1  Run fetcher.py to probe the URL
  2.2  Check api_endpoints first — fastest path for SPAs
  2.3  Check structured data (JSON-LD, OpenGraph, microdata)
  2.4  Fall back to clean HTML if needed

PHASE 3: BUILD & RUN SCRAPER
  3.1  Generate standalone Python script with status logging
  3.2  Run the scraper

PHASE 4: VALIDATE & OUTPUT
  4.1  Validate output matches index-data.ts expectations
  4.2  Report image domains and categories for downstream skills
```

## Phase 0: Discover (Sitemap Analysis)

**ALWAYS run this first** when given a base URL. It's fast (~2s), requires no browser, and reveals the site structure.

```bash
python .claude/skills/demo-scrape/scripts/fetcher.py "<URL>" --sitemap -o /tmp/sitemap_result.json
```

Read `/tmp/sitemap_result.json`. The analyzer checks `robots.txt`, tries common sitemap locations, parses sitemap indexes, counts URLs per type, and returns sample URLs.

**If a sitemap is found**, present available data types with full clickable URLs:

```
| Type | Count | Example |
|------|-------|---------|
| product | 9,046 | https://example.com/p/example-product/12345 |
| category | 825 | https://example.com/c/category-name/1234 |
```

If the user already specified what to scrape, skip the prompt and proceed.

## Phase 1: Gather Information

Confirm with the user if anything is missing:
- **Data type**: Which URL type(s) from the sitemap?
- **Fields**: What fields to extract? (e.g. name, price, image URL, brand, categories)
- **Output**: Always `data/products.json` for this demo

If the user already provided all this, proceed without asking.

## Phase 2: Fetch & Analyze

### Run the fetcher

```bash
python .claude/skills/demo-scrape/scripts/fetcher.py "<URL>" -o /tmp/fetch_result.json
```

Returns: `method_used`, `api_endpoints`, `structured_data`, `clean_html`, `raw_text`, `links`.

For JS SPAs, the fetcher automatically launches a browser, intercepts XHR/fetch JSON responses, and returns them as `api_endpoints`.

### Priority order

1. **API endpoints** (highest priority) — check `api_endpoints` first. If the site has a REST API, use it directly with `httpx`. Check if it supports pagination.
2. **Structured data** — JSON-LD, microdata, OpenGraph
3. **Clean HTML** — last resort, generate CSS selector script

## Phase 3: Build & Run Scraper

Generate a standalone Python script. Every generated scraper script MUST include:

### Output requirements

- Save to `data/products.json`
- Each record must have an `objectID` field (use product URL slug, SKU, or generate one)
- Extract fields useful for search: name/title, description, price, image URL, brand, categories

### Status logging

Write progress to `data/products.status.json` so progress can be checked:

```json
{
  "status": "running",
  "started_at": "2026-03-08T14:30:00Z",
  "updated_at": "2026-03-08T14:32:15Z",
  "elapsed_seconds": 135,
  "eta_seconds": 432,
  "eta_formatted": "7m 12s",
  "total_expected": 9046,
  "total_scraped": 2150,
  "percent_complete": 23.8,
  "items_per_second": 15.9,
  "current_page": 22,
  "errors": 3,
  "error_log": ["Page 5: 429 Too Many Requests", "Page 12: timeout"],
  "output_file": "data/products.json"
}
```

On completion, update to `"status": "completed"` with `completed_at` and `elapsed_formatted`. On failure, set `"status": "failed"`.

### Status logging template for generated scripts

```python
import json
import time
from datetime import datetime, timezone

STATUS_FILE = "data/products.status.json"
_start_time = time.monotonic()

def fmt_duration(seconds: float) -> str:
    seconds = int(seconds)
    if seconds < 60:
        return f"{seconds}s"
    elif seconds < 3600:
        return f"{seconds // 60}m {seconds % 60}s"
    else:
        h, rem = divmod(seconds, 3600)
        return f"{h}h {rem // 60}m"

def update_status(status_data: dict):
    now = time.monotonic()
    elapsed = now - _start_time
    status_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    status_data["elapsed_seconds"] = round(elapsed, 1)

    scraped = status_data.get("total_scraped", 0)
    expected = status_data.get("total_expected", 0)

    if scraped > 0 and elapsed > 0:
        rate = scraped / elapsed
        status_data["items_per_second"] = round(rate, 1)
        if expected > scraped:
            remaining = (expected - scraped) / rate
            status_data["eta_seconds"] = round(remaining)
            status_data["eta_formatted"] = fmt_duration(remaining)
        else:
            status_data["eta_seconds"] = 0
            status_data["eta_formatted"] = "done"

    with open(STATUS_FILE, "w") as f:
        json.dump(status_data, f, indent=2)
```

### Rate limiting

- API requests: 0.3-0.5s between calls
- Browser fetches: 1-2s between calls

## Phase 4: Validate & Output

### Post-scrape validation

Before considering the scrape complete:

1. Read a sample of the scraped data to verify fields are correct
2. Check if field names match what `scripts/index-data.ts` expects
3. **Verify images actually load** — `curl -sI <image_url>` a few sample URLs and confirm HTTP 200 with image content-type
4. Note image domains — report for adding to `DEMO_CONFIG.imageDomains` via `/demo-branding`
5. Note category values — report for configuring via `/demo-categories`

### Checking progress (when asked)

Read `data/products.status.json` and report:
```
Scraping in progress:
  - 2,150 / 9,046 products scraped (23.8%)
  - Speed: 15.9 items/sec
  - Running for 2m 15s — ETA: ~7m 12s remaining
  - 3 errors (non-fatal)
```

### Summary

Print when done:
```
Scrape complete!
  Source:     <url>
  Method:     <api / structured data / html parsing>
  Items:      <count>
  Fields:     <list of fields>
  Saved to:   data/products.json
```

## Error Handling

- Missing deps: `pip install -r .claude/skills/demo-scrape/scripts/requirements.txt`
- Missing Chromium: `playwright install chromium`
- All fetch methods fail: site may need auth or manual access
- API returns 403/429: reduce rate or switch to stealth
- Page fails in bulk job: log failure, continue with rest

## Important Notes

- ALWAYS run sitemap analysis first — it's fast and reveals the full site structure
- ALWAYS check `api_endpoints` before HTML — direct API is fastest and most reliable
- NEVER send full raw HTML to the LLM — only use `clean_html`
- For bulk jobs, generate a standalone script — don't repeat LLM calls per page
