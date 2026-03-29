#!/usr/bin/env python3
"""
Page screenshot tool for discovery and general-purpose captures.

Navigates to a URL, dismisses overlays, and saves a full-page screenshot.
Uses Chrome --headless=new with raw CDP (no selenium, no undetected-chromedriver).

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
  --wait          Seconds to wait after page load (default: 4)
  --full-page     Capture the full scrollable page, not just the viewport
  --remove-navbar Remove navigation bar/header before capturing
"""

import argparse
import base64
import json
import os
import re
import socket
import struct
import subprocess
import sys
import tempfile
import time
from urllib.parse import urlparse

from PIL import Image


# ---------------------------------------------------------------------------
# Minimal WebSocket CDP client (Python stdlib only)
# ---------------------------------------------------------------------------

class CDPClient:
    def __init__(self, ws_url):
        parsed = urlparse(ws_url)
        self.sock = socket.create_connection((parsed.hostname, parsed.port), timeout=60)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 4 * 1024 * 1024)
        key = base64.b64encode(os.urandom(16)).decode()
        req = (
            f"GET {parsed.path} HTTP/1.1\r\n"
            f"Host: {parsed.hostname}:{parsed.port}\r\n"
            f"Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode())
        resp = b""
        while b"\r\n\r\n" not in resp:
            resp += self.sock.recv(4096)
        self.cmd_id = 0

    def send(self, method, params=None):
        self.cmd_id += 1
        msg = json.dumps({"id": self.cmd_id, "method": method, "params": params or {}})
        payload = msg.encode()
        frame = bytearray([0x81])
        mask = os.urandom(4)
        L = len(payload)
        if L < 126:
            frame.append(0x80 | L)
        elif L < 65536:
            frame.append(0x80 | 126)
            frame += struct.pack(">H", L)
        else:
            frame.append(0x80 | 127)
            frame += struct.pack(">Q", L)
        frame += mask
        frame += bytearray(b ^ mask[i % 4] for i, b in enumerate(payload))
        self.sock.sendall(frame)
        while True:
            data = self._recv_frame()
            parsed = json.loads(data)
            if parsed.get("id") == self.cmd_id:
                return parsed

    def _recv_exact(self, n):
        buf = b""
        while len(buf) < n:
            chunk = self.sock.recv(min(n - len(buf), 262144))
            if not chunk:
                raise ConnectionError("WebSocket connection closed")
            buf += chunk
        return buf

    def _recv_frame(self):
        while True:
            hdr = self._recv_exact(2)
            opcode = hdr[0] & 0x0F
            length = hdr[1] & 0x7F
            if length == 126:
                length = struct.unpack(">H", self._recv_exact(2))[0]
            elif length == 127:
                length = struct.unpack(">Q", self._recv_exact(8))[0]
            if hdr[1] & 0x80:
                self._recv_exact(4)  # mask key (server shouldn't mask, but handle it)
            data = self._recv_exact(length)
            if opcode == 9:  # ping
                continue
            if opcode == 8:  # close
                raise ConnectionError("WebSocket closed by server")
            return data.decode()

    def close(self):
        try:
            self.sock.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Chrome browser wrapper
# ---------------------------------------------------------------------------

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


class ChromeBrowser:
    def __init__(self):
        self.port = self._find_free_port()
        self.datadir = tempfile.mkdtemp(prefix="page-capture-new-")
        self.process = subprocess.Popen(
            [
                CHROME_PATH,
                f"--remote-debugging-port={self.port}",
                f"--user-data-dir={self.datadir}",
                "--headless=new",
                "--no-first-run",
                "--no-default-browser-check",
                "--disable-default-apps",
                "--disable-extensions",
                "--disable-component-extensions-with-background-pages",
                "--window-size=1440,900",
                "about:blank",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        # Wait for CDP endpoint to be ready
        self._wait_for_cdp()

        # Get WebSocket URL for the page target
        ws_url = self._get_page_ws_url()
        self.cdp = CDPClient(ws_url)

        # Enable required domains
        self.cdp.send("Page.enable")
        self.cdp.send("Network.enable")

        # Stealth patches
        self.cdp.send(
            "Page.addScriptToEvaluateOnNewDocument",
            {
                "source": "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
            },
        )
        self.cdp.send(
            "Network.setUserAgentOverride",
            {
                "userAgent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/146.0.0.0 Safari/537.36"
                )
            },
        )

    def _find_free_port(self):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("", 0))
            return s.getsockname()[1]

    def _wait_for_cdp(self):
        import urllib.request

        for _ in range(30):
            try:
                urllib.request.urlopen(
                    f"http://localhost:{self.port}/json/version", timeout=1
                )
                return
            except Exception:
                time.sleep(0.5)
        raise RuntimeError("Chrome CDP did not start within 15 seconds")

    def _get_page_ws_url(self):
        import urllib.request

        data = urllib.request.urlopen(f"http://localhost:{self.port}/json").read()
        tabs = json.loads(data)
        for t in tabs:
            if t.get("type") == "page":
                return t["webSocketDebuggerUrl"]
        raise RuntimeError("No page target found in Chrome CDP")

    def navigate(self, url):
        self.cdp.send("Page.navigate", {"url": url})

    def screenshot(self, path, full_page=False):
        params = {"format": "png"}
        if full_page:
            # Get full page dimensions
            metrics = self.cdp.send("Page.getLayoutMetrics")
            content = metrics.get("result", {}).get("contentSize", {})
            width = content.get("width", 1440)
            height = content.get("height", 900)
            # Resize viewport to full page so Chrome renders all content
            self.cdp.send(
                "Emulation.setDeviceMetricsOverride",
                {
                    "width": int(width),
                    "height": int(height),
                    "deviceScaleFactor": 1,
                    "mobile": False,
                },
            )
            time.sleep(0.5)
            params["clip"] = {
                "x": 0, "y": 0,
                "width": width, "height": height,
                "scale": 1,
            }
        result = self.cdp.send("Page.captureScreenshot", params)
        if full_page:
            # Reset viewport
            self.cdp.send("Emulation.clearDeviceMetricsOverride")
        data = result.get("result", {}).get("data", "")
        if data:
            with open(path, "wb") as f:
                f.write(base64.b64decode(data))

    def execute_script(self, js):
        result = self.cdp.send(
            "Runtime.evaluate",
            {"expression": js, "returnByValue": True, "awaitPromise": False},
        )
        return result.get("result", {}).get("result", {}).get("value")

    def scroll_to_load(self, step=600, pause=0.5):
        """Scroll down the page incrementally to trigger lazy loading."""
        total_height = self.execute_script("document.body.scrollHeight") or 900
        current = 0
        while current < total_height:
            current += step
            self.execute_script(f"window.scrollTo(0, {current})")
            time.sleep(pause)
            # Re-check height as lazy content may extend the page
            total_height = self.execute_script("document.body.scrollHeight") or total_height
        # Force-load all lazy images and iframes
        self.execute_script("""
            document.querySelectorAll('img[loading="lazy"], iframe[loading="lazy"]').forEach(el => {
                el.loading = 'eager';
            });
            document.querySelectorAll('img[data-src]').forEach(el => {
                if (el.dataset.src) el.src = el.dataset.src;
            });
            document.querySelectorAll('img[data-srcset]').forEach(el => {
                if (el.dataset.srcset) el.srcset = el.dataset.srcset;
            });
            document.querySelectorAll('[data-background-image]').forEach(el => {
                el.style.backgroundImage = 'url(' + el.dataset.backgroundImage + ')';
            });
        """)
        # Second scroll pass to catch content that expanded after first pass
        time.sleep(1)
        total_height = self.execute_script("document.body.scrollHeight") or total_height
        current = 0
        while current < total_height:
            current += step
            self.execute_script(f"window.scrollTo(0, {current})")
            time.sleep(0.2)
        # Scroll back to top and let final images settle
        self.execute_script("window.scrollTo(0, 0)")
        time.sleep(1)

    def quit(self):
        self.cdp.close()
        self.process.kill()
        self.process.wait()
        import shutil

        shutil.rmtree(self.datadir, ignore_errors=True)


# ---------------------------------------------------------------------------
# Screenshot compression
# ---------------------------------------------------------------------------

MAX_SCREENSHOT_WIDTH = 1000


def compress_screenshot(png_path):
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
# Overlay dismissal
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


def dismiss_overlays(browser):
    """Attempt to dismiss cookie banners, modals, and other overlays."""
    # Dispatch ESC key
    browser.execute_script(
        "document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));"
    )
    time.sleep(0.3)

    # Click dismiss buttons
    sels_json = json.dumps(DISMISS_SELECTORS)
    browser.execute_script(
        f"""
        const sels = {sels_json};
        for (const sel of sels) {{
            try {{
                const els = document.querySelectorAll(sel);
                for (const el of els) {{
                    if (el.offsetParent !== null) {{
                        el.click();
                        break;
                    }}
                }}
            }} catch(e) {{}}
        }}
    """
    )
    time.sleep(0.3)

    # Remove high-z-index fixed/absolute overlays (but preserve nav/header)
    browser.execute_script(
        """
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
    """
    )


# ---------------------------------------------------------------------------
# Capture
# ---------------------------------------------------------------------------


def remove_navbar(browser):
    """Remove nav/header elements from the page before screenshotting."""
    browser.execute_script(
        """
        // Remove fixed/sticky navbars and headers
        for (const tag of ['nav', 'header']) {
            document.querySelectorAll(tag).forEach(el => el.remove());
        }
        // Remove elements with common navbar roles/classes
        document.querySelectorAll(
            '[role="navigation"], [role="banner"], ' +
            '[class*="navbar" i], [class*="nav-bar" i], [class*="top-bar" i], ' +
            '[class*="header" i][class*="site" i], [class*="header" i][class*="main" i], ' +
            '[id*="navbar" i], [id*="header" i]'
        ).forEach(el => el.remove());
        // Remove any remaining fixed/sticky elements at the top
        document.querySelectorAll('*').forEach(el => {
            const s = window.getComputedStyle(el);
            if ((s.position === 'fixed' || s.position === 'sticky') &&
                el.getBoundingClientRect().top < 100) {
                el.remove();
            }
        });
        // Scroll to top after removal
        window.scrollTo(0, 0);
    """
    )
    time.sleep(0.3)


def capture_page(browser, url, output_path, wait=4, full_page=False, strip_navbar=False):
    """Navigate to URL, dismiss overlays, take screenshot. Returns output paths."""
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    browser.navigate(url)
    time.sleep(wait)

    dismiss_overlays(browser)
    time.sleep(1)
    dismiss_overlays(browser)

    if full_page:
        browser.scroll_to_load()

    if strip_navbar:
        remove_navbar(browser)

    browser.screenshot(output_path, full_page=full_page)
    lowres_path = compress_screenshot(output_path)

    print(f"Captured: {output_path}")
    return {"screenshot": output_path, "screenshot_lowres": lowres_path, "url": url}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Capture page screenshots")
    parser.add_argument("--url", help="Single URL to screenshot")
    parser.add_argument("--output", help="Output file path (for single URL mode)")
    parser.add_argument("--urls-file", help="JSON file with URLs to screenshot")
    parser.add_argument("--output-dir", help="Output directory (for batch mode)")
    parser.add_argument(
        "--wait", type=int, default=4, help="Seconds to wait after page load"
    )
    parser.add_argument(
        "--full-page", action="store_true",
        help="Capture the full scrollable page, not just the viewport"
    )
    parser.add_argument(
        "--remove-navbar", action="store_true",
        help="Remove navigation bar/header before capturing"
    )

    args = parser.parse_args()

    if not args.url and not args.urls_file:
        parser.error("Provide either --url or --urls-file")
    if args.url and not args.output:
        parser.error("--output is required with --url")
    if args.urls_file and not args.output_dir:
        parser.error("--output-dir is required with --urls-file")

    browser = ChromeBrowser()
    results = []

    try:
        if args.url:
            result = capture_page(
                browser, args.url, args.output, args.wait,
                full_page=args.full_page, strip_navbar=args.remove_navbar,
            )
            results.append(result)
        else:
            with open(args.urls_file) as f:
                urls = json.load(f)
            os.makedirs(args.output_dir, exist_ok=True)
            for entry in urls:
                url = entry["url"]
                name = entry.get(
                    "name", re.sub(r"[^a-z0-9]+", "-", url.lower())[:40]
                )
                output_path = os.path.join(args.output_dir, f"{name}.png")
                try:
                    result = capture_page(
                        browser, url, output_path, args.wait,
                        full_page=args.full_page, strip_navbar=args.remove_navbar,
                    )
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
        browser.quit()


if __name__ == "__main__":
    main()
