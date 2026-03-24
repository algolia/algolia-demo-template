"""
Web page fetcher with auto-detection, structured data extraction, and HTML cleaning.

This is the data-fetching layer — it handles the hard parts (method detection, stealth,
JS rendering, structured data) and returns clean output for the intelligence layer (Claude)
to analyze.

Usage:
  python fetcher.py <url> [--method auto|static|browser|stealth] [--output result.json]

Output JSON structure:
  {
    "url": "...",
    "method_used": "static|browser|stealth",
    "structured_data": { ... },      # JSON-LD, OpenGraph, microdata (if found)
    "api_endpoints": [ ... ],        # discovered JSON API endpoints (for SPAs)
    "clean_html": "...",             # stripped-down HTML of main content
    "raw_text": "...",               # visible text only (fallback)
    "links": [...]                   # all links found on the page
  }
"""

import argparse
import json
import re
import time
from urllib.parse import urljoin, urlparse

import httpx
from selectolax.parser import HTMLParser


# ---------------------------------------------------------------------------
# Shared user-agent
# ---------------------------------------------------------------------------

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


# ---------------------------------------------------------------------------
# Sitemap analyzer — discover data types and URL counts
# ---------------------------------------------------------------------------

def analyze_sitemap(base_url: str) -> dict | None:
    """
    Fetch and analyze the site's sitemap to discover available data types.

    Returns a dict with:
      - sitemap_url: URL of the sitemap index
      - data_types: list of discovered types, each with:
          - type: inferred type name (e.g. "product", "recipe", "category")
          - sitemap_url: URL of the sub-sitemap
          - count: number of URLs in this sitemap
          - sample_urls: first 3 URLs as examples
          - url_pattern: the common URL pattern
    Returns None if no sitemap found.
    """
    parsed = urlparse(base_url)
    origin = f"{parsed.scheme}://{parsed.netloc}"

    # Try common sitemap locations
    sitemap_urls = [
        f"{origin}/sitemap.xml",
        f"{origin}/sitemap_index.xml",
        f"{origin}/sitemaps/sitemap.xml",
    ]

    # Also check robots.txt for sitemap directives
    try:
        robots = httpx.get(
            f"{origin}/robots.txt",
            headers={"User-Agent": USER_AGENT},
            timeout=10,
            follow_redirects=True,
        )
        if robots.status_code == 200:
            for line in robots.text.splitlines():
                line = line.strip()
                if line.lower().startswith("sitemap:"):
                    sm_url = line.split(":", 1)[1].strip()
                    if sm_url not in sitemap_urls:
                        sitemap_urls.insert(0, sm_url)
    except httpx.HTTPError:
        pass

    # Try each sitemap URL
    sitemap_xml = None
    sitemap_url = None
    for url in sitemap_urls:
        try:
            resp = httpx.get(
                url,
                headers={"User-Agent": USER_AGENT},
                timeout=15,
                follow_redirects=True,
            )
            if resp.status_code == 200 and ("</sitemap" in resp.text or "</urlset" in resp.text):
                sitemap_xml = resp.text
                sitemap_url = url
                break
        except httpx.HTTPError:
            continue

    if sitemap_xml is None:
        return None

    # Parse sitemap index or single sitemap
    data_types = []

    if "<sitemapindex" in sitemap_xml:
        # It's a sitemap index — extract sub-sitemaps
        sub_sitemaps = re.findall(r"<loc>\s*(.*?)\s*</loc>", sitemap_xml)
        for sub_url in sub_sitemaps:
            try:
                sub_resp = httpx.get(
                    sub_url,
                    headers={"User-Agent": USER_AGENT},
                    timeout=15,
                    follow_redirects=True,
                )
                if sub_resp.status_code != 200:
                    continue
                urls = re.findall(r"<loc>\s*(.*?)\s*</loc>", sub_resp.text)
                if not urls:
                    continue

                # Infer type from sitemap filename
                filename = sub_url.split("/")[-1].replace(".xml", "")
                # Strip common prefixes like "sitemap_" and suffixes like "_es", "_en"
                type_name = re.sub(r"^sitemap_?", "", filename)
                type_name = re.sub(r"_[a-z]{2}$", "", type_name)
                if not type_name:
                    type_name = "pages"

                # Detect URL pattern from samples
                pattern = _detect_url_pattern(urls[:10])

                data_types.append({
                    "type": type_name,
                    "sitemap_url": sub_url,
                    "count": len(urls),
                    "sample_urls": urls[:3],
                    "url_pattern": pattern,
                })
            except httpx.HTTPError:
                continue
    else:
        # Single sitemap — group URLs by path pattern
        urls = re.findall(r"<loc>\s*(.*?)\s*</loc>", sitemap_xml)
        if urls:
            groups = _group_urls_by_pattern(urls)
            for type_name, group_urls in groups.items():
                data_types.append({
                    "type": type_name,
                    "sitemap_url": sitemap_url,
                    "count": len(group_urls),
                    "sample_urls": group_urls[:3],
                    "url_pattern": _detect_url_pattern(group_urls[:10]),
                })

    # Sort by count descending
    data_types.sort(key=lambda x: x["count"], reverse=True)

    return {
        "sitemap_url": sitemap_url,
        "data_types": data_types,
    }


def _detect_url_pattern(urls: list[str]) -> str:
    """Detect the common URL pattern from a list of sample URLs."""
    if not urls:
        return ""
    paths = [urlparse(u).path for u in urls]
    # Find common prefix
    parts_list = [p.strip("/").split("/") for p in paths]
    if not parts_list:
        return ""
    min_len = min(len(p) for p in parts_list)
    common_parts = []
    for i in range(min_len):
        values = set(p[i] for p in parts_list)
        if len(values) == 1:
            common_parts.append(values.pop())
        else:
            common_parts.append("*")
            break
    return "/" + "/".join(common_parts)


def _group_urls_by_pattern(urls: list[str]) -> dict[str, list[str]]:
    """Group URLs by their path prefix to identify data types."""
    groups: dict[str, list[str]] = {}
    for url in urls:
        path = urlparse(url).path.strip("/")
        parts = path.split("/")
        # Use first 1-2 path segments as the group key
        if len(parts) >= 2:
            key = parts[0] if not parts[0].isdigit() else "pages"
        elif len(parts) == 1:
            key = "pages"
        else:
            key = "root"
        groups.setdefault(key, []).append(url)
    return groups


# ---------------------------------------------------------------------------
# Fetchers (static / browser / stealth)
# ---------------------------------------------------------------------------

def fetch_static(url: str) -> str:
    resp = httpx.get(
        url,
        headers={"User-Agent": USER_AGENT},
        timeout=30,
        follow_redirects=True,
    )
    resp.raise_for_status()
    return resp.text


def fetch_browser(url: str, wait_selector: str | None = None) -> str:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")
        if wait_selector:
            page.wait_for_selector(wait_selector, timeout=15_000)
        html = page.content()
        browser.close()
    return html


def fetch_stealth(url: str, wait_selector: str | None = None) -> str:
    from playwright.sync_api import sync_playwright
    from playwright_stealth import Stealth

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York",
        )
        page = context.new_page()
        Stealth().apply(page)
        page.goto(url, wait_until="networkidle")
        if wait_selector:
            page.wait_for_selector(wait_selector, timeout=15_000)
        html = page.content()
        browser.close()
    return html


# ---------------------------------------------------------------------------
# API interception — discover JSON endpoints from JS SPAs
# ---------------------------------------------------------------------------

def intercept_api_calls(url: str, stealth: bool = False) -> tuple[str, list[dict]]:
    """
    Load the page in a browser and capture all JSON API responses.
    Returns (rendered_html, list_of_api_endpoints).

    Each endpoint dict contains:
      - url: full URL of the API call
      - method: HTTP method (GET/POST)
      - status: response status code
      - item_count: number of items if response is a list or has common list keys
      - sample: first 500 chars of the JSON response
    """
    from playwright.sync_api import sync_playwright

    api_calls = []
    base_domain = urlparse(url).netloc

    def on_response(response):
        resp_url = response.url
        ct = response.headers.get("content-type", "")
        if "json" not in ct:
            return
        # Only capture same-domain or subdomain API calls
        resp_domain = urlparse(resp_url).netloc
        if base_domain not in resp_domain and resp_domain not in base_domain:
            return
        # Skip tiny config/tracking calls
        try:
            body = response.json()
        except Exception:
            return

        # Estimate item count
        item_count = 0
        if isinstance(body, list):
            item_count = len(body)
        elif isinstance(body, dict):
            for key in ("products", "items", "results", "data", "records", "hits", "entries"):
                if key in body and isinstance(body[key], list):
                    item_count = len(body[key])
                    break
            if not item_count and "totalCount" in body:
                item_count = body["totalCount"]

        api_calls.append({
            "url": resp_url,
            "method": response.request.method,
            "status": response.status,
            "item_count": item_count,
            "sample": json.dumps(body, ensure_ascii=False)[:500],
        })

    with sync_playwright() as pw:
        if stealth:
            from playwright_stealth import Stealth
            browser = pw.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
            )
            context = browser.new_context(
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
                timezone_id="America/New_York",
            )
            page = context.new_page()
            Stealth().apply(page)
        else:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page()

        page.on("response", on_response)
        page.goto(url, wait_until="networkidle", timeout=30_000)
        # Scroll to trigger lazy-loaded API calls
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)
        html = page.content()
        browser.close()

    # Sort by item_count descending — most interesting endpoints first
    api_calls.sort(key=lambda x: x["item_count"], reverse=True)
    return html, api_calls


# ---------------------------------------------------------------------------
# Method detection (probe)
# ---------------------------------------------------------------------------

_ANTIBOT_MARKERS = [
    "cf-browser-verification", "challenge-platform", "just a moment",
    "captcha", "recaptcha", "hcaptcha", "access denied", "blocked",
    "security check", "pardon our interruption", "attention required", "ray id",
]

_JS_RENDER_MARKERS = [
    '<div id="root"></div>', '<div id="app"></div>',
    '<div id="__next"></div>', '<div id="__nuxt"></div>',
    "<app-root>", "<app-root></app-root>",  # Angular
    "window.__INITIAL_STATE__", "window.__NEXT_DATA__", "window.__NUXT__",
    "noscript>you need to enable javascript",
    "noscript>please enable javascript",
    "this app works best with javascript enabled",
]


def detect_method(url: str) -> tuple[str, str | None]:
    """
    Probe the URL and decide the best fetch method.
    Returns (method, prefetched_html_or_none).
    We return the HTML from the probe GET so we don't fetch twice for static pages.
    """
    try:
        head = httpx.head(
            url, headers={"User-Agent": USER_AGENT}, timeout=10, follow_redirects=True,
        )
        if "application/json" in head.headers.get("content-type", ""):
            return "api", None

        if head.status_code in (403, 503):
            server = head.headers.get("server", "").lower()
            if any(s in server for s in ("cloudflare", "ddos-guard", "sucuri")):
                return "stealth", None
    except httpx.HTTPError:
        return "stealth", None

    # GET to inspect body
    try:
        resp = httpx.get(
            url, headers={"User-Agent": USER_AGENT}, timeout=15, follow_redirects=True,
        )
    except httpx.HTTPError:
        return "stealth", None

    # Check JSON
    try:
        resp.json()
        return "api", None
    except (json.JSONDecodeError, ValueError):
        pass

    html = resp.text
    html_lower = html.lower()

    if resp.status_code in (403, 503) or any(m in html_lower for m in _ANTIBOT_MARKERS):
        return "stealth", None

    body = HTMLParser(html).css_first("body")
    body_text = body.text(strip=True) if body else ""

    if len(body_text) < 50 or any(m in html for m in _JS_RENDER_MARKERS):
        return "browser", None

    # Static works — return the already-fetched HTML to avoid a second request
    return "static", html


# ---------------------------------------------------------------------------
# Structured data extraction (free, no LLM needed)
# ---------------------------------------------------------------------------

def extract_json_ld(tree: HTMLParser) -> list[dict]:
    """Extract all JSON-LD blocks from the page."""
    results = []
    for node in tree.css('script[type="application/ld+json"]'):
        try:
            data = json.loads(node.text())
            if isinstance(data, list):
                results.extend(data)
            else:
                results.append(data)
        except (json.JSONDecodeError, TypeError):
            continue
    return results


def extract_opengraph(tree: HTMLParser) -> dict:
    """Extract OpenGraph meta tags."""
    og = {}
    for node in tree.css('meta[property^="og:"]'):
        prop = node.attributes.get("property", "").removeprefix("og:")
        content = node.attributes.get("content", "")
        if prop and content:
            og[prop] = content
    return og


def extract_meta_tags(tree: HTMLParser) -> dict:
    """Extract common meta tags (description, keywords, author, etc.)."""
    meta = {}
    for name in ("description", "keywords", "author", "robots"):
        node = tree.css_first(f'meta[name="{name}"]')
        if node:
            content = node.attributes.get("content", "")
            if content:
                meta[name] = content
    return meta


def extract_microdata(tree: HTMLParser) -> list[dict]:
    """Extract itemscope/itemprop microdata (simplified)."""
    items = []
    for scope in tree.css("[itemscope]"):
        item = {}
        item_type = scope.attributes.get("itemtype", "")
        if item_type:
            item["@type"] = item_type
        for prop in scope.css("[itemprop]"):
            name = prop.attributes.get("itemprop", "")
            value = (
                prop.attributes.get("content")
                or prop.attributes.get("href")
                or prop.attributes.get("src")
                or prop.text(strip=True)
            )
            if name and value:
                item[name] = value
        if item:
            items.append(item)
    return items


def extract_structured_data(tree: HTMLParser) -> dict:
    """Run all structured data extractors and return combined result."""
    result = {}

    json_ld = extract_json_ld(tree)
    if json_ld:
        result["json_ld"] = json_ld

    og = extract_opengraph(tree)
    if og:
        result["opengraph"] = og

    meta = extract_meta_tags(tree)
    if meta:
        result["meta"] = meta

    microdata = extract_microdata(tree)
    if microdata:
        result["microdata"] = microdata

    return result


# ---------------------------------------------------------------------------
# HTML cleaning — strip noise, keep content
# ---------------------------------------------------------------------------

# Tags to remove entirely (including their children)
_STRIP_TAGS = [
    "script", "style", "noscript", "iframe", "svg", "path",
    "nav", "footer", "header",
    "link", "meta",
]

# Attributes to keep (drop everything else to reduce size)
_KEEP_ATTRS = {"href", "src", "alt", "title", "class", "id", "type", "value", "name"}


def clean_html(html: str, url: str) -> str:
    """
    Strip the HTML down to a minimal, readable sample.
    Removes scripts, styles, nav, footer, SVGs, comments, and noisy attributes.
    """
    tree = HTMLParser(html)

    # Remove unwanted tags
    for tag in _STRIP_TAGS:
        for node in tree.css(tag):
            node.decompose()

    # Try to isolate main content area
    main = (
        tree.css_first("main")
        or tree.css_first('[role="main"]')
        or tree.css_first("#content")
        or tree.css_first(".content")
        or tree.css_first("article")
        or tree.css_first("body")
    )

    if main is None:
        return ""

    html_out = main.html or ""

    # Strip HTML comments
    html_out = re.sub(r"<!--.*?-->", "", html_out, flags=re.DOTALL)

    # Strip data-* attributes and other noise attributes to reduce size
    html_out = re.sub(r'\s+data-[\w-]+="[^"]*"', "", html_out)
    html_out = re.sub(r"\s+aria-[\w-]+=\"[^\"]*\"", "", html_out)

    # Collapse whitespace
    html_out = re.sub(r"\n\s*\n+", "\n", html_out)
    html_out = re.sub(r"  +", " ", html_out)

    return html_out.strip()


def extract_links(tree: HTMLParser, url: str) -> list[dict]:
    """Extract all links with their text."""
    links = []
    seen = set()
    for node in tree.css("a[href]"):
        href = node.attributes.get("href", "")
        text = node.text(strip=True)
        full_url = urljoin(url, href)
        if full_url not in seen and text:
            links.append({"text": text, "url": full_url})
            seen.add(full_url)
    return links


def extract_visible_text(tree: HTMLParser) -> str:
    """Extract visible text from the page body."""
    body = tree.css_first("body")
    if not body:
        return ""
    # Remove script/style first
    for tag in ("script", "style", "noscript"):
        for node in body.css(tag):
            node.decompose()
    text = body.text(separator="\n", strip=True)
    # Collapse blank lines
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    return text.strip()


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def fetch_and_process(url: str, method: str = "auto", wait_selector: str | None = None) -> dict:
    """
    Fetch a URL and return structured output with:
    - structured_data (JSON-LD, OG, microdata — free, no LLM)
    - api_endpoints (discovered JSON APIs for SPAs)
    - clean_html (trimmed HTML for LLM analysis)
    - raw_text (visible text fallback)
    - links (all page links)
    """
    prefetched_html = None
    api_endpoints = []

    # Detect method
    if method == "auto":
        method, prefetched_html = detect_method(url)
        print(f"[detect] Best method: {method}")

    # Handle API response
    if method == "api":
        try:
            resp = httpx.get(
                url,
                headers={"Accept": "application/json", "User-Agent": USER_AGENT},
                timeout=15,
                follow_redirects=True,
            )
            resp.raise_for_status()
            return {
                "url": url,
                "method_used": "api",
                "structured_data": {"api_response": resp.json()},
                "api_endpoints": [],
                "clean_html": "",
                "raw_text": "",
                "links": [],
            }
        except (httpx.HTTPError, json.JSONDecodeError):
            print("[detect] API fetch failed, falling back to static.")
            method = "static"

    # For SPA pages (browser/stealth), intercept API calls while rendering
    html = prefetched_html
    if html is None and method in ("browser", "stealth"):
        use_stealth = method == "stealth"
        try:
            print(f"[fetch] Loading page with {'stealth ' if use_stealth else ''}browser + API interception...")
            html, api_endpoints = intercept_api_calls(url, stealth=use_stealth)
            if api_endpoints:
                print(f"[fetch] Discovered {len(api_endpoints)} API endpoints:")
                for ep in api_endpoints[:5]:
                    print(f"  {ep['method']} {ep['url'][:100]}  ({ep['item_count']} items)")
        except Exception as e:
            print(f"[fetch] Browser interception failed: {e}")
            # If browser failed, try stealth; if stealth failed, we're done
            if not use_stealth:
                try:
                    print("[fetch] Retrying with stealth + API interception...")
                    html, api_endpoints = intercept_api_calls(url, stealth=True)
                except Exception as e2:
                    print(f"[fetch] Stealth interception also failed: {e2}")

    # Fallback: static fetch (for static pages, or if browser failed above)
    if html is None:
        if method == "static" or prefetched_html is None:
            try:
                print("[fetch] Trying static...")
                html = fetch_static(url)
                method = "static"
            except Exception as e:
                print(f"[fetch] Static failed: {e}")

    if html is None:
        return {
            "url": url,
            "method_used": "failed",
            "structured_data": {},
            "api_endpoints": [],
            "clean_html": "",
            "raw_text": "",
            "links": [],
        }

    # Process the HTML
    tree = HTMLParser(html)

    return {
        "url": url,
        "method_used": method,
        "structured_data": extract_structured_data(tree),
        "api_endpoints": api_endpoints,
        "clean_html": clean_html(html, url),
        "raw_text": extract_visible_text(tree),
        "links": extract_links(tree, url),
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Fetch and clean a web page for scraping")
    parser.add_argument("url", help="URL to fetch")
    parser.add_argument(
        "--method", choices=["auto", "static", "browser", "stealth"],
        default="auto", help="Fetch method (default: auto-detect)",
    )
    parser.add_argument("--output", "-o", default=None, help="Output JSON file path")
    parser.add_argument("--wait-selector", default=None, help="CSS selector to wait for (browser/stealth)")
    parser.add_argument("--sitemap", action="store_true", help="Analyze sitemap to discover data types")
    args = parser.parse_args()

    # Sitemap analysis mode
    if args.sitemap:
        start = time.time()
        result = analyze_sitemap(args.url)
        elapsed = time.time() - start

        if result is None:
            print("No sitemap found.")
            return

        print(f"\n--- Sitemap analysis complete in {elapsed:.2f}s ---")
        print(f"Sitemap: {result['sitemap_url']}\n")
        print(f"{'Type':<20} {'Count':>8}  {'URL pattern':<40}  Sample")
        print("-" * 110)
        for dt in result["data_types"]:
            sample = dt["sample_urls"][0] if dt["sample_urls"] else ""
            print(f"{dt['type']:<20} {dt['count']:>8}  {dt['url_pattern']:<40}  {sample[:50]}")

        if args.output:
            with open(args.output, "w") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"\nSaved to {args.output}")
        return

    start = time.time()
    result = fetch_and_process(args.url, method=args.method, wait_selector=args.wait_selector)
    elapsed = time.time() - start

    # Summary
    sd = result["structured_data"]
    sd_types = [k for k in sd if sd[k]]
    clean_len = len(result["clean_html"])
    text_len = len(result["raw_text"])
    n_links = len(result["links"])

    api_endpoints = result.get("api_endpoints", [])

    print(f"\n--- Fetch complete in {elapsed:.2f}s ---")
    print(f"Method used:     {result['method_used']}")
    print(f"Structured data: {', '.join(sd_types) if sd_types else 'none found'}")
    print(f"API endpoints:   {len(api_endpoints)} discovered")
    print(f"Clean HTML:      {clean_len:,} chars")
    print(f"Raw text:        {text_len:,} chars")
    print(f"Links found:     {n_links}")

    if args.output:
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"Saved to {args.output}")
    else:
        if api_endpoints:
            print(f"\n--- Discovered API endpoints ---")
            for ep in api_endpoints[:10]:
                print(f"  {ep['method']} {ep['url'][:120]}")
                print(f"    Status: {ep['status']}  Items: {ep['item_count']}")
                print(f"    Sample: {ep['sample'][:200]}")
                print()
        if sd_types:
            print(f"\n--- Structured data preview ---")
            print(json.dumps(sd, indent=2, ensure_ascii=False)[:2000])
        if clean_len:
            print(f"\n--- Clean HTML preview (first 1000 chars) ---")
            print(result["clean_html"][:1000])


if __name__ == "__main__":
    main()
