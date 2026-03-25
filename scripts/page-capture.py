"""
Page screenshot tool for discovery and general-purpose captures.

Navigates to a URL, dismisses overlays, and saves a full-page screenshot.
Uses the same Chrome setup as search_capture.py (undetected-chromedriver).

Usage:
  python page_capture.py --url URL --output PATH [--wait SECONDS]
  python page_capture.py --urls-file FILE --output-dir DIR [--wait SECONDS]

Single URL mode:
  --url       URL to screenshot
  --output    Output file path (e.g. data/discovery/homepage.png)

Batch mode:
  --urls-file JSON file: [{"url": "...", "name": "homepage"}, ...]
  --output-dir Directory for screenshots (named {name}.png)

Options:
  --wait      Seconds to wait after page load (default: 4)
"""

import argparse
import json
import os
import re
import sys
import tempfile
import time

from PIL import Image
import undetected_chromedriver as uc
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# ---------------------------------------------------------------------------
# Screenshot compression (same as search_capture.py)
# ---------------------------------------------------------------------------

MAX_SCREENSHOT_WIDTH = 1000


def compress_screenshot(png_path: str) -> str:
    """Create a low-res PNG copy for AI analysis. Returns the .lowres.png path."""
    lowres_path = png_path.rsplit(".", 1)[0] + ".lowres.png"
    with Image.open(png_path) as img:
        if img.width > MAX_SCREENSHOT_WIDTH:
            ratio = MAX_SCREENSHOT_WIDTH / img.width
            new_size = (MAX_SCREENSHOT_WIDTH, int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        img.save(lowres_path, "PNG", optimize=True)
    return lowres_path


# ---------------------------------------------------------------------------
# Overlay dismissal (same as search_capture.py)
# ---------------------------------------------------------------------------

DISMISS_SELECTORS = [
    "#onetrust-accept-btn-handler",
    "button[id*='accept' i]",
    "button[class*='accept' i]",
    "[aria-label='Close']",
    "[aria-label='close']",
    "[class*='cookie'] button[class*='close']",
    "[class*='cookie'] [class*='dismiss']",
    "[class*='modal'] button[class*='close']",
    "button[class*='modal-close']",
    "button[class*='dismiss']",
    "[class*='country'] button[class*='close']",
    "[class*='locale'] button[class*='close']",
    "[class*='geo'] button[class*='close']",
]


def dismiss_overlays(driver):
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    time.sleep(0.3)
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    time.sleep(0.3)

    for sel in DISMISS_SELECTORS:
        try:
            els = driver.find_elements(By.CSS_SELECTOR, sel)
            for el in els:
                if el.is_displayed():
                    el.click()
                    time.sleep(0.3)
                    break
        except Exception:
            pass

    try:
        driver.execute_script("""
            document.querySelectorAll('*').forEach(el => {
                const s = window.getComputedStyle(el);
                const z = parseInt(s.zIndex) || 0;
                if ((s.position === 'fixed' || s.position === 'absolute') && z > 500) {
                    if (!el.querySelector('nav') && !el.matches('nav') &&
                        !el.matches('header') && !el.querySelector('header') &&
                        !el.closest('header') && !el.querySelector('input[type="search"]')) {
                        el.remove();
                    }
                }
            });
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        """)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Chrome driver setup (same as search_capture.py)
# ---------------------------------------------------------------------------


def get_chrome_version():
    import subprocess

    paths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "google-chrome",
        "google-chrome-stable",
    ]
    for p in paths:
        try:
            out = subprocess.check_output(
                [p, "--version"], stderr=subprocess.DEVNULL, text=True
            )
            ver = int(out.strip().split()[-1].split(".")[0])
            return ver
        except Exception:
            continue
    return None


def create_driver():
    options = uc.ChromeOptions()
    options.add_argument("--window-size=1440,900")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-popup-blocking")
    options.add_argument("--disable-component-extensions-with-background-pages")
    options.add_argument("--disable-default-apps")
    tmpdir = tempfile.mkdtemp(prefix="page-capture-")
    options.add_argument(f"--user-data-dir={tmpdir}")
    ver = get_chrome_version()
    return uc.Chrome(options=options, version_main=ver)


# ---------------------------------------------------------------------------
# Capture
# ---------------------------------------------------------------------------


def capture_page(driver, url, output_path, wait=4):
    """Navigate to URL, dismiss overlays, take screenshot. Returns output paths."""
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    driver.get(url)
    time.sleep(wait)

    # Switch to last tab if extras opened
    if len(driver.window_handles) > 1:
        driver.switch_to.window(driver.window_handles[-1])

    dismiss_overlays(driver)
    time.sleep(1)
    dismiss_overlays(driver)

    driver.save_screenshot(output_path)
    lowres_path = compress_screenshot(output_path)

    print(f"Captured: {output_path}")
    return {"screenshot": output_path, "screenshot_lowres": lowres_path, "url": url}


def main():
    parser = argparse.ArgumentParser(description="Capture page screenshots")
    parser.add_argument("--url", help="Single URL to screenshot")
    parser.add_argument("--output", help="Output file path (for single URL mode)")
    parser.add_argument("--urls-file", help="JSON file with URLs to screenshot")
    parser.add_argument("--output-dir", help="Output directory (for batch mode)")
    parser.add_argument(
        "--wait", type=int, default=4, help="Seconds to wait after page load"
    )

    args = parser.parse_args()

    if not args.url and not args.urls_file:
        parser.error("Provide either --url or --urls-file")
    if args.url and not args.output:
        parser.error("--output is required with --url")
    if args.urls_file and not args.output_dir:
        parser.error("--output-dir is required with --urls-file")

    driver = create_driver()
    results = []

    try:
        if args.url:
            result = capture_page(driver, args.url, args.output, args.wait)
            results.append(result)
        else:
            with open(args.urls_file) as f:
                urls = json.load(f)
            os.makedirs(args.output_dir, exist_ok=True)
            for entry in urls:
                url = entry["url"]
                name = entry.get("name", re.sub(r"[^a-z0-9]+", "-", url.lower())[:40])
                output_path = os.path.join(args.output_dir, f"{name}.png")
                try:
                    result = capture_page(driver, url, output_path, args.wait)
                    result["name"] = name
                    results.append(result)
                except Exception as e:
                    print(f"Error capturing {url}: {e}", file=sys.stderr)
                    results.append({"url": url, "name": name, "error": str(e)})

        # Write summary
        summary_dir = args.output_dir or os.path.dirname(args.output)
        summary_path = os.path.join(summary_dir, "capture-summary.json")
        with open(summary_path, "w") as f:
            json.dump(results, f, indent=2)
        print(f"Summary: {summary_path}")

    finally:
        driver.quit()


if __name__ == "__main__":
    main()
