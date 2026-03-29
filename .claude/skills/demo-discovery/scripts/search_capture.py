#!/usr/bin/env python3
"""
Search Capture Tool — CDP/headless=new edition.

Audits search functionality on websites by typing queries, capturing autocomplete
and results, and extracting structured data. Uses Chrome's --headless=new mode
with raw CDP (Chrome DevTools Protocol) instead of Selenium/undetected-chromedriver.

Dependencies: Pillow (for screenshot compression). Everything else is stdlib.
"""

import argparse
import base64
import hashlib
import http.client
import json
import logging
import os
import platform
import re
import shutil
import signal
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    Image = None

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("search_capture")

# ---------------------------------------------------------------------------
# Chrome binary detection
# ---------------------------------------------------------------------------

def _find_chrome() -> str:
    """Return the path to the Chrome binary on this system."""
    system = platform.system()
    if system == "Darwin":
        candidates = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ]
    elif system == "Linux":
        candidates = [
            "google-chrome-stable",
            "google-chrome",
            "chromium-browser",
            "chromium",
        ]
    else:
        candidates = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        ]

    for c in candidates:
        if os.path.isfile(c):
            return c
        found = shutil.which(c)
        if found:
            return found

    raise FileNotFoundError(
        "Could not find a Chrome/Chromium binary. "
        "Please install Chrome or set the CHROME_PATH environment variable."
    )


CHROME_PATH = os.environ.get("CHROME_PATH") or _find_chrome()

# ---------------------------------------------------------------------------
# Selector banks (identical to original)
# ---------------------------------------------------------------------------

INPUT_SELECTORS = [
    "input[type='search']", "input[name='q']", "input[name='query']", "input[name='keyword']",
    "input[placeholder*='search' i]", "input[aria-label*='search' i]", "input[id*='search' i]",
    "input[aria-label*='cerca' i]", "input[aria-label*='recherch' i]", "input[aria-label*='such' i]",
    "input[aria-label*='buscar' i]", "input[placeholder*='cerca' i]", "input[placeholder*='recherch' i]",
    "input[class*='search' i]",
]

ICON_SELECTORS = [
    "button[aria-label*='search' i]", "a[aria-label*='search' i]", "[data-testid*='search' i]",
    "[role='button'][aria-label*='search' i]", "button[class*='search-button']",
    "button[class*='search_button']", "button[class*='js-search']", "button[class*='search-trigger']",
    "button[class*='search' i]", "[class*='header'] button[class*='search' i]",
]

AUTOCOMPLETE_SELECTORS = [
    "[role='listbox'] [role='option']", "[role='listbox'] li",
    "[class*='suggest'] li", "[class*='suggest'] a",
    "[class*='autocomplete'] li", "[class*='autocomplete'] a", "[class*='Autocomplete'] li",
    "[class*='typeahead'] li", "[class*='predictive'] a", "[class*='Predictive'] a",
    "[class*='dropdown'] [class*='product']",
    "[class*='search'] [class*='product']", "[class*='search-overlay'] [class*='product']",
    "[class*='search-results'] [class*='product']", "[class*='search-modal'] [class*='product']",
    "[class*='search-drawer'] [class*='product']", "[class*='instant'] [class*='product']",
    "[class*='SearchOverlay'] [class*='product']", "[class*='SearchModal'] [class*='product']",
    "[class*='SearchResults'] [class*='product']", "[class*='search'] article",
    "[class*='search'] [class*='card']", "[class*='quick-search'] [class*='product']",
    "[class*='live-search'] [class*='product']",
]

PRODUCT_SELECTORS = [
    "[class*='product-card'] [class*='title']", "[class*='product-card'] a[class*='name']",
    "[class*='product-card'] h2", "[class*='product-card'] h3",
    "[class*='ProductCard'] [class*='name']", "[class*='ProductCard'] h2", "[class*='ProductCard'] h3",
    "[data-testid*='product'] [class*='name']", "[data-testid*='product'] h2", "[data-testid*='product'] h3",
    "[class*='product-tile'] [class*='name']", "[class*='product-tile'] h2",
    "[class*='product-item'] h2", "[class*='product-item'] h3",
    "[class*='grid'] [class*='product'] [class*='name']",
    "[class*='result'] [class*='name']", "[class*='result'] h3",
    "[class*='search'] article a", "[class*='plp'] article a", "article a[href*='product']",
]

DISMISS_SELECTORS = [
    "#onetrust-accept-btn-handler", "button[id*='accept' i]", "button[class*='accept' i]",
    "[aria-label='Close']", "[aria-label='close']",
    "[class*='cookie'] button[class*='close']", "[class*='cookie'] [class*='dismiss']",
    "[class*='modal'] button[class*='close']", "button[class*='modal-close']", "button[class*='dismiss']",
    "[class*='country'] button[class*='close']", "[class*='locale'] button[class*='close']",
    "[class*='geo'] button[class*='close']",
]

# ---------------------------------------------------------------------------
# Minimal WebSocket CDP Client (stdlib only)
# ---------------------------------------------------------------------------

class CDPClient:
    """Minimal RFC-6455 WebSocket client for Chrome DevTools Protocol."""

    def __init__(self, ws_url: str, timeout: float = 30):
        parsed = urllib.parse.urlparse(ws_url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 80
        path = parsed.path or "/"

        self._sock = socket.create_connection((host, port), timeout=timeout)
        self._sock.settimeout(timeout)

        # WebSocket handshake
        key = base64.b64encode(os.urandom(16)).decode()
        request = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n"
            f"\r\n"
        )
        self._sock.sendall(request.encode())

        # Read handshake response
        response = b""
        while b"\r\n\r\n" not in response:
            chunk = self._sock.recv(4096)
            if not chunk:
                raise ConnectionError("WebSocket handshake failed: connection closed")
            response += chunk

        if b"101" not in response.split(b"\r\n")[0]:
            raise ConnectionError(f"WebSocket handshake failed: {response[:200]}")

        self._id = 0
        self._events = []  # Buffer for events received while waiting for responses
        self._leftover = response.split(b"\r\n\r\n", 1)[1]  # Any data after headers

    def send(self, method: str, params: dict | None = None, timeout: float = 30) -> dict:
        """Send a CDP command and wait for the matching response."""
        self._id += 1
        msg_id = self._id
        payload = {"id": msg_id, "method": method}
        if params:
            payload["params"] = params

        self._ws_send_text(json.dumps(payload))

        deadline = time.monotonic() + timeout
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError(f"CDP command {method} timed out after {timeout}s")
            msg = self._ws_recv(timeout=remaining)
            data = json.loads(msg)
            if data.get("id") == msg_id:
                if "error" in data:
                    err = data["error"]
                    log.warning("CDP error %s: %s", method, err.get("message", err))
                return data
            # It's an event — buffer it
            self._events.append(data)

    def recv_event(self, timeout: float = 5) -> dict | None:
        """Receive a single CDP event (non-blocking-ish)."""
        if self._events:
            return self._events.pop(0)
        try:
            msg = self._ws_recv(timeout=timeout)
            data = json.loads(msg)
            if "id" in data:
                # Unexpected response — discard
                return None
            return data
        except (TimeoutError, socket.timeout):
            return None

    def _ws_send_text(self, text: str):
        """Send a WebSocket text frame (masked, as required by client)."""
        payload = text.encode("utf-8")
        header = bytearray()
        header.append(0x81)  # FIN + text opcode

        length = len(payload)
        if length < 126:
            header.append(0x80 | length)  # Mask bit set
        elif length < 65536:
            header.append(0x80 | 126)
            header.extend(struct.pack("!H", length))
        else:
            header.append(0x80 | 127)
            header.extend(struct.pack("!Q", length))

        mask = os.urandom(4)
        header.extend(mask)
        masked = bytearray(b ^ mask[i % 4] for i, b in enumerate(payload))
        self._sock.sendall(bytes(header) + bytes(masked))

    def _ws_recv(self, timeout: float = 30) -> str:
        """Receive a complete WebSocket text message, handling fragmentation."""
        self._sock.settimeout(timeout)
        fragments = []
        while True:
            opcode, data, fin = self._read_frame()
            if opcode == 0x8:  # Close
                raise ConnectionError("WebSocket closed by server")
            if opcode == 0x9:  # Ping
                self._send_pong(data)
                continue
            if opcode == 0xA:  # Pong
                continue
            fragments.append(data)
            if fin:
                return b"".join(fragments).decode("utf-8")

    def _read_frame(self):
        """Read a single WebSocket frame."""
        header = self._recv_exact(2)
        fin = bool(header[0] & 0x80)
        opcode = header[0] & 0x0F
        masked = bool(header[1] & 0x80)
        length = header[1] & 0x7F

        if length == 126:
            length = struct.unpack("!H", self._recv_exact(2))[0]
        elif length == 127:
            length = struct.unpack("!Q", self._recv_exact(8))[0]

        if masked:
            mask = self._recv_exact(4)
            data = bytearray(self._recv_exact(length))
            for i in range(len(data)):
                data[i] ^= mask[i % 4]
            data = bytes(data)
        else:
            data = self._recv_exact(length)

        return opcode, data, fin

    def _send_pong(self, data: bytes):
        """Send a pong frame."""
        header = bytearray()
        header.append(0x8A)  # FIN + pong
        length = len(data)
        header.append(0x80 | length)
        mask = os.urandom(4)
        header.extend(mask)
        masked = bytearray(b ^ mask[i % 4] for i, b in enumerate(data))
        self._sock.sendall(bytes(header) + bytes(masked))

    def _recv_exact(self, n: int) -> bytes:
        """Receive exactly n bytes, using any leftover data first."""
        buf = bytearray()
        if self._leftover:
            take = min(n, len(self._leftover))
            buf.extend(self._leftover[:take])
            self._leftover = self._leftover[take:]
        while len(buf) < n:
            chunk = self._sock.recv(n - len(buf))
            if not chunk:
                raise ConnectionError("WebSocket connection closed")
            buf.extend(chunk)
        return bytes(buf)

    def close(self):
        """Close the WebSocket connection."""
        try:
            # Send close frame
            header = bytearray([0x88, 0x80])  # FIN + close, masked, 0 length
            header.extend(os.urandom(4))  # mask key
            self._sock.sendall(bytes(header))
        except Exception:
            pass
        try:
            self._sock.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Chrome Browser Wrapper
# ---------------------------------------------------------------------------

class ChromeBrowser:
    """Manages a headless Chrome instance controlled via CDP."""

    def __init__(self):
        self.port = self._find_free_port()
        self.datadir = tempfile.mkdtemp(prefix="search-audit-new-")
        self.process = None
        self.cdp: CDPClient | None = None
        self._start()

    @staticmethod
    def _find_free_port() -> int:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("", 0))
            return s.getsockname()[1]

    def _start(self):
        args = [
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
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-ipc-flooding-protection",
            "--disable-hang-monitor",
            "--disable-gpu",
            "about:blank",
        ]
        self.process = subprocess.Popen(
            args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        log.info("Chrome launched (pid=%d, port=%d)", self.process.pid, self.port)

        # Wait for CDP endpoint
        ws_url = self._wait_for_cdp()
        self.cdp = CDPClient(ws_url)
        log.info("CDP connected: %s", ws_url)

        # Enable domains
        self.cdp.send("Page.enable")
        self.cdp.send("Network.enable")
        self.cdp.send("DOM.enable")
        self.cdp.send("Runtime.enable")

        # Stealth patches
        self.cdp.send("Network.setUserAgentOverride", {
            "userAgent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/146.0.0.0 Safari/537.36"
            )
        })
        self.cdp.send("Page.addScriptToEvaluateOnNewDocument", {
            "source": "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
        })

    def _wait_for_cdp(self, timeout: float = 15) -> str:
        """Poll the Chrome /json endpoint until a page target appears."""
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            try:
                conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=2)
                conn.request("GET", "/json")
                resp = conn.getresponse()
                tabs = json.loads(resp.read())
                conn.close()
                for tab in tabs:
                    if tab.get("type") == "page":
                        return tab["webSocketDebuggerUrl"]
                # No page target yet, retry
            except Exception:
                pass
            time.sleep(0.3)
        raise TimeoutError("Chrome did not expose CDP within timeout")

    # --- Navigation ---

    def navigate(self, url: str, timeout: float = 30):
        """Navigate to url and wait for load."""
        self.cdp.send("Page.navigate", {"url": url})
        self._wait_for_load(timeout)

    def _wait_for_load(self, timeout: float = 30):
        """Wait for Page.loadEventFired or Page.frameStoppedLoading."""
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            evt = self.cdp.recv_event(timeout=min(2, deadline - time.monotonic()))
            if evt and evt.get("method") in (
                "Page.loadEventFired",
                "Page.frameStoppedLoading",
                "Page.domContentEventFired",
            ):
                # Give a moment for JS to settle
                time.sleep(0.5)
                return
        # Timeout is non-fatal — page may still be usable
        log.warning("Page load wait timed out after %.0fs", timeout)

    def wait(self, seconds: float):
        """Wait, draining events."""
        deadline = time.monotonic() + seconds
        while time.monotonic() < deadline:
            self.cdp.recv_event(timeout=min(0.5, deadline - time.monotonic()))

    # --- Screenshot ---

    def screenshot(self, path: str):
        """Take a full-page screenshot and save as PNG."""
        result = self.cdp.send("Page.captureScreenshot", {
            "format": "png",
            "captureBeyondViewport": False,
        })
        data = result.get("result", {}).get("data", "")
        with open(path, "wb") as f:
            f.write(base64.b64decode(data))

    # --- JavaScript execution ---

    def execute_script(self, js: str, await_promise: bool = True):
        """Execute JS in the page context and return the result value."""
        result = self.cdp.send("Runtime.evaluate", {
            "expression": js,
            "returnByValue": True,
            "awaitPromise": await_promise,
        }, timeout=30)
        inner = result.get("result", {}).get("result", {})
        if inner.get("subtype") == "error":
            log.debug("JS error: %s", inner.get("description", ""))
            return None
        return inner.get("value")

    # --- Current URL / Title ---

    @property
    def current_url(self) -> str:
        return self.execute_script("window.location.href") or ""

    @property
    def title(self) -> str:
        return self.execute_script("document.title") or ""

    # --- Cleanup ---

    def quit(self):
        """Terminate Chrome and clean up."""
        if self.cdp:
            try:
                self.cdp.close()
            except Exception:
                pass
        if self.process:
            try:
                self.process.kill()
                self.process.wait(timeout=5)
            except Exception:
                pass
        try:
            shutil.rmtree(self.datadir, ignore_errors=True)
        except Exception:
            pass
        log.info("Chrome shut down")


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def slugify(text: str) -> str:
    """Turn a query string into a filename-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text[:80] or "query"


def compress_screenshot(src: str, dest: str, quality: int = 40, max_width: int = 800):
    """Create a low-res JPEG version of a screenshot."""
    if Image is None:
        log.warning("Pillow not installed — skipping compression for %s", src)
        shutil.copy(src, dest)
        return
    try:
        img = Image.open(src)
        ratio = max_width / img.width if img.width > max_width else 1
        if ratio < 1:
            new_size = (max_width, int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        img = img.convert("RGB")
        img.save(dest, "JPEG", quality=quality, optimize=True)
    except Exception as exc:
        log.warning("Screenshot compression failed: %s", exc)
        shutil.copy(src, dest)


def _js_selector_list(selectors: list[str]) -> str:
    """Return a JS array literal from a Python list of CSS selectors."""
    escaped = [s.replace("\\", "\\\\").replace("'", "\\'") for s in selectors]
    return "[" + ", ".join(f"'{s}'" for s in escaped) + "]"


# ---------------------------------------------------------------------------
# JS snippets used via Runtime.evaluate
# ---------------------------------------------------------------------------

JS_FIND_VISIBLE_INPUT = """
(() => {
    const selectors = %s;
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
            if (el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0) {
                return true;
            }
        }
    }
    return false;
})()
""" % _js_selector_list(INPUT_SELECTORS)

JS_CLICK_SEARCH_ICON = """
(() => {
    const selectors = %s;
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
            if (el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0) {
                el.click();
                return true;
            }
        }
    }
    return false;
})()
""" % _js_selector_list(ICON_SELECTORS)

JS_FOCUS_SEARCH_INPUT = """
(() => {
    const selectors = %s;
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
            if (el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0) {
                el.focus();
                el.click();
                el.value = '';
                el.dispatchEvent(new Event('focus', { bubbles: true }));
                return true;
            }
        }
    }
    return false;
})()
""" % _js_selector_list(INPUT_SELECTORS)

JS_DISMISS_OVERLAYS = """
(() => {
    const selectors = %s;
    let dismissed = 0;
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
            if (el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0) {
                try { el.click(); dismissed++; } catch(e) {}
            }
        }
    }
    return dismissed;
})()
""" % _js_selector_list(DISMISS_SELECTORS)


def js_type_query(query: str) -> str:
    """Return JS that types a query character by character into the focused search input."""
    safe = query.replace("\\", "\\\\").replace("`", "\\`").replace("$", "\\$")
    return """
(async () => {
    const selectors = %s;
    let input = null;
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
            if (el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0) {
                input = el;
                break;
            }
        }
        if (input) break;
    }
    if (!input) return false;

    input.focus();
    input.click();
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const query = `%s`;
    for (let i = 0; i < query.length; i++) {
        const char = query[i];
        input.value += char;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: 'Key' + char.toUpperCase(), bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keypress', { key: char, code: 'Key' + char.toUpperCase(), bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { key: char, code: 'Key' + char.toUpperCase(), bubbles: true }));
        await new Promise(r => setTimeout(r, 50 + Math.random() * 80));
    }
    return true;
})()
""" % (_js_selector_list(INPUT_SELECTORS), safe)


JS_SUBMIT_SEARCH = """
(() => {
    const selectors = %s;
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
            if (el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0) {
                el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                el.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));

                // Also try form submission
                const form = el.closest('form');
                if (form) {
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    try { form.submit(); } catch(e) {}
                }
                return true;
            }
        }
    }
    return false;
})()
""" % _js_selector_list(INPUT_SELECTORS)


def js_collect_autocomplete() -> str:
    """Return JS that collects visible autocomplete suggestion texts."""
    return """
(() => {
    const selectors = %s;
    const results = [];
    const seen = new Set();
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
            if (el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0) {
                const text = (el.textContent || '').trim();
                if (text && !seen.has(text) && text.length < 500) {
                    seen.add(text);
                    results.push(text);
                }
            }
        }
        if (results.length > 0) break;
    }
    return results;
})()
""" % _js_selector_list(AUTOCOMPLETE_SELECTORS)


def js_collect_results() -> str:
    """Return JS that collects visible product/result texts from the results page."""
    return """
(() => {
    const selectors = %s;
    const results = [];
    const seen = new Set();
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
            if (el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0) {
                const text = (el.textContent || '').trim();
                if (text && !seen.has(text) && text.length < 500) {
                    seen.add(text);
                    results.push(text);
                }
            }
        }
        if (results.length > 0) break;
    }
    return results;
})()
""" % _js_selector_list(PRODUCT_SELECTORS)


JS_CLEAR_PERFORMANCE_BUFFER = """
(() => {
    try {
        window.__searchAuditNetworkCalls = [];
        const origFetch = window.fetch;
        window.fetch = function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
            window.__searchAuditNetworkCalls.push({
                type: 'fetch',
                url: url,
                timestamp: Date.now()
            });
            return origFetch.apply(this, args);
        };
        const origXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this.__searchAuditUrl = url;
            return origXhrOpen.apply(this, [method, url, ...rest]);
        };
        const origXhrSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(...args) {
            if (this.__searchAuditUrl) {
                window.__searchAuditNetworkCalls.push({
                    type: 'xhr',
                    url: this.__searchAuditUrl,
                    timestamp: Date.now()
                });
            }
            return origXhrSend.apply(this, args);
        };
        return true;
    } catch(e) {
        return false;
    }
})()
"""

JS_COLLECT_NETWORK_CALLS = """
(() => {
    const calls = window.__searchAuditNetworkCalls || [];
    const autocomplete = {};
    const results = {};
    let provider = 'Unknown';
    let rendering = 'unknown';

    for (const call of calls) {
        const url = call.url || '';
        const lower = url.toLowerCase();

        // Detect provider
        if (lower.includes('algolia')) provider = 'Algolia';
        else if (lower.includes('searchspring')) provider = 'SearchSpring';
        else if (lower.includes('bloomreach') || lower.includes('brtools')) provider = 'Bloomreach';
        else if (lower.includes('klevu')) provider = 'Klevu';
        else if (lower.includes('constructor.io') || lower.includes('cnstrc.com')) provider = 'Constructor';
        else if (lower.includes('searchanise')) provider = 'Searchanise';
        else if (lower.includes('doofinder')) provider = 'Doofinder';
        else if (lower.includes('coveo')) provider = 'Coveo';
        else if (lower.includes('elastic') || lower.includes('bonsai')) provider = 'Elasticsearch';
        else if (lower.includes('typesense')) provider = 'Typesense';
        else if (lower.includes('meilisearch')) provider = 'Meilisearch';
        else if (lower.includes('swiftype')) provider = 'Swiftype';
        else if (lower.includes('loop54')) provider = 'Loop54';
        else if (lower.includes('lucidworks') || lower.includes('fusion')) provider = 'Lucidworks Fusion';
        else if (lower.includes('groupby')) provider = 'GroupBy';
        else if (lower.includes('syte.ai')) provider = 'Syte';
        else if (lower.includes('nosto')) provider = 'Nosto';

        // Categorize call
        if (lower.includes('suggest') || lower.includes('autocomplete') || lower.includes('typeahead') || lower.includes('complete')) {
            const key = url.split('?')[0];
            autocomplete[key] = (autocomplete[key] || 0) + 1;
        } else if (lower.includes('search') || lower.includes('query') || lower.includes('results')) {
            const key = url.split('?')[0];
            results[key] = (results[key] || 0) + 1;
        }
    }

    // If we detected API calls, it's likely client-side rendering
    if (Object.keys(autocomplete).length > 0 || Object.keys(results).length > 0) {
        rendering = 'client-side';
    } else if (calls.length === 0) {
        rendering = 'server-side';
    }

    return {
        autocomplete_calls: autocomplete,
        results_calls: results,
        detected_provider: provider,
        rendering: rendering
    };
})()
"""

JS_CHECK_BLOCKED = """
(() => {
    const body = document.body ? document.body.innerText.toLowerCase() : '';
    const title = document.title.toLowerCase();
    const signals = ['captcha', 'robot', 'bot detected', 'access denied',
                     'blocked', 'verify you are human', 'unusual traffic',
                     'security check', 'challenge'];
    for (const s of signals) {
        if (body.includes(s) || title.includes(s)) return true;
    }
    return false;
})()
"""


# ---------------------------------------------------------------------------
# Recon mode JS
# ---------------------------------------------------------------------------

JS_RECON = """
(async () => {
    const report = {
        url: window.location.href,
        title: document.title,
        search_inputs: [],
        search_icons: [],
        meta: {},
        detected_provider: 'Unknown',
        has_autocomplete: false,
        scripts: [],
    };

    // Search inputs
    const inputSels = %s;
    for (const sel of inputSels) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
            const visible = el.offsetParent !== null || el.offsetWidth > 0;
            report.search_inputs.push({
                selector: sel,
                visible: visible,
                placeholder: el.placeholder || '',
                name: el.name || '',
                type: el.type || '',
                id: el.id || '',
            });
        }
    }

    // Search icons
    const iconSels = %s;
    for (const sel of iconSels) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
            const visible = el.offsetParent !== null || el.offsetWidth > 0;
            report.search_icons.push({
                selector: sel,
                visible: visible,
                text: (el.textContent || '').trim().substring(0, 100),
                tag: el.tagName,
            });
        }
    }

    // Detect search provider from scripts
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
        const src = s.src.toLowerCase();
        if (src.includes('algolia')) report.detected_provider = 'Algolia';
        else if (src.includes('searchspring')) report.detected_provider = 'SearchSpring';
        else if (src.includes('bloomreach') || src.includes('brtools')) report.detected_provider = 'Bloomreach';
        else if (src.includes('klevu')) report.detected_provider = 'Klevu';
        else if (src.includes('constructor') || src.includes('cnstrc')) report.detected_provider = 'Constructor';
        else if (src.includes('coveo')) report.detected_provider = 'Coveo';
        else if (src.includes('doofinder')) report.detected_provider = 'Doofinder';
        else if (src.includes('searchanise')) report.detected_provider = 'Searchanise';
        else if (src.includes('typesense')) report.detected_provider = 'Typesense';
        else if (src.includes('meilisearch')) report.detected_provider = 'Meilisearch';
        else if (src.includes('swiftype')) report.detected_provider = 'Swiftype';
        else if (src.includes('loop54')) report.detected_provider = 'Loop54';
        else if (src.includes('lucidworks') || src.includes('fusion')) report.detected_provider = 'Lucidworks Fusion';
        else if (src.includes('groupby')) report.detected_provider = 'GroupBy';
        else if (src.includes('syte.ai')) report.detected_provider = 'Syte';
        else if (src.includes('nosto')) report.detected_provider = 'Nosto';
        report.scripts.push(src);
    }

    // Meta tags
    const metaTags = document.querySelectorAll('meta');
    for (const m of metaTags) {
        const name = m.name || m.getAttribute('property') || '';
        if (name) report.meta[name] = (m.content || '').substring(0, 200);
    }

    return report;
})()
""" % (_js_selector_list(INPUT_SELECTORS), _js_selector_list(ICON_SELECTORS))


# ---------------------------------------------------------------------------
# Query file parser
# ---------------------------------------------------------------------------

def parse_queries_file(path: str) -> list[dict]:
    """
    Parse a queries file. Supports:
      - JSON array of objects with "query", optional "category", "expectation"
      - Plain text, one query per line
    """
    text = Path(path).read_text(encoding="utf-8").strip()
    if text.startswith("["):
        data = json.loads(text)
        queries = []
        for item in data:
            if isinstance(item, str):
                queries.append({"query": item, "category": "", "expectation": ""})
            elif isinstance(item, dict):
                queries.append({
                    "query": item.get("query", item.get("q", "")),
                    "category": item.get("category", ""),
                    "expectation": item.get("expectation", ""),
                })
        return queries
    else:
        return [{"query": line.strip(), "category": "", "expectation": ""}
                for line in text.splitlines() if line.strip() and not line.strip().startswith("#")]


# ---------------------------------------------------------------------------
# Core capture logic
# ---------------------------------------------------------------------------

def capture_query(browser: ChromeBrowser, url: str, query_info: dict,
                  output_dir: str) -> dict:
    """
    Run a single search query capture:
      1. Navigate to URL
      2. Dismiss overlays
      3. Find and focus search input (click icon if needed)
      4. Type query slowly
      5. Capture autocomplete
      6. Submit search
      7. Capture results page
      8. Collect network call data
    """
    query = query_info["query"]
    category = query_info.get("category", "")
    expectation = query_info.get("expectation", "")
    slug = slugify(query)

    log.info("--- Capturing query: %r ---", query)

    result = {
        "url": url,
        "query": query,
        "category": category,
        "expectation": expectation,
        "success": False,
        "blocked": False,
        "page_load_ms": 0,
        "autocomplete": {
            "results": [],
            "time_ms": 0,
            "screenshot": "",
            "screenshot_lowres": "",
        },
        "results_page": {
            "results": [],
            "time_ms": 0,
            "url": "",
            "screenshot": "",
            "screenshot_lowres": "",
        },
        "search_api": {
            "autocomplete_calls": {},
            "results_calls": {},
            "detected_provider": "Unknown",
            "rendering": "unknown",
        },
        "errors": [],
    }

    try:
        # 1. Navigate
        t0 = time.time()
        browser.navigate(url)
        result["page_load_ms"] = int((time.time() - t0) * 1000)

        # Give page time to settle
        browser.wait(2)

        # Check if blocked
        blocked = browser.execute_script(JS_CHECK_BLOCKED)
        if blocked:
            result["blocked"] = True
            result["errors"].append("Page appears to be blocked (captcha/bot detection)")
            log.warning("Page appears blocked")
            return result

        # 2. Dismiss overlays
        browser.execute_script(JS_DISMISS_OVERLAYS)
        browser.wait(0.5)

        # 3. Install network monitoring
        browser.execute_script(JS_CLEAR_PERFORMANCE_BUFFER)
        browser.wait(0.3)

        # 4. Find search input — try direct first, then click icon
        has_input = browser.execute_script(JS_FIND_VISIBLE_INPUT)
        if not has_input:
            log.info("No visible input found — trying search icon click")
            clicked = browser.execute_script(JS_CLICK_SEARCH_ICON)
            if clicked:
                browser.wait(1)
                has_input = browser.execute_script(JS_FIND_VISIBLE_INPUT)

        if not has_input:
            result["errors"].append("Could not find a visible search input")
            log.warning("No search input found on %s", url)
            return result

        # 5. Focus the search input
        browser.execute_script(JS_FOCUS_SEARCH_INPUT)
        browser.wait(0.3)

        # 6. Type the query character by character
        t_type_start = time.time()
        typed = browser.execute_script(js_type_query(query))
        if not typed:
            result["errors"].append("Failed to type query into search input")
            log.warning("Typing failed")
            return result

        # 7. Wait for autocomplete to appear
        browser.wait(1.5)

        # 8. Collect autocomplete suggestions
        autocomplete_results = browser.execute_script(js_collect_autocomplete()) or []
        autocomplete_time = int((time.time() - t_type_start) * 1000)
        result["autocomplete"]["results"] = autocomplete_results
        result["autocomplete"]["time_ms"] = autocomplete_time

        # 9. Screenshot autocomplete
        ac_screenshot = os.path.join(output_dir, f"{slug}-autocomplete.png")
        ac_lowres = os.path.join(output_dir, f"{slug}-autocomplete.lowres.png")
        browser.screenshot(ac_screenshot)
        compress_screenshot(ac_screenshot, ac_lowres)
        result["autocomplete"]["screenshot"] = ac_screenshot
        result["autocomplete"]["screenshot_lowres"] = ac_lowres

        log.info("Autocomplete: %d suggestions found", len(autocomplete_results))

        # 10. Submit search
        t_submit = time.time()
        browser.execute_script(JS_SUBMIT_SEARCH)

        # Wait for results page to load
        browser.wait(3)

        # 11. Dismiss any new overlays on results page
        browser.execute_script(JS_DISMISS_OVERLAYS)
        browser.wait(0.5)

        # 12. Collect results page data
        results_page_results = browser.execute_script(js_collect_results()) or []
        results_time = int((time.time() - t_submit) * 1000)
        result["results_page"]["results"] = results_page_results
        result["results_page"]["time_ms"] = results_time
        result["results_page"]["url"] = browser.current_url

        # 13. Screenshot results page
        rp_screenshot = os.path.join(output_dir, f"{slug}-results.png")
        rp_lowres = os.path.join(output_dir, f"{slug}-results.lowres.png")
        browser.screenshot(rp_screenshot)
        compress_screenshot(rp_screenshot, rp_lowres)
        result["results_page"]["screenshot"] = rp_screenshot
        result["results_page"]["screenshot_lowres"] = rp_lowres

        log.info("Results page: %d results found at %s",
                 len(results_page_results), result["results_page"]["url"])

        # 14. Collect network call analysis
        api_data = browser.execute_script(JS_COLLECT_NETWORK_CALLS)
        if api_data and isinstance(api_data, dict):
            result["search_api"] = api_data

        result["success"] = True

    except Exception as exc:
        result["errors"].append(str(exc))
        log.error("Error capturing query %r: %s", query, exc)

    # Save per-query JSON
    json_path = os.path.join(output_dir, f"{slug}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    return result


def run_recon(browser: ChromeBrowser, url: str, output_dir: str) -> dict:
    """Run reconnaissance on a URL to discover search infrastructure."""
    log.info("--- Recon mode: %s ---", url)

    browser.navigate(url)
    browser.wait(3)

    # Dismiss overlays
    browser.execute_script(JS_DISMISS_OVERLAYS)
    browser.wait(0.5)

    # Run recon JS
    recon_data = browser.execute_script(JS_RECON) or {}

    # Take a screenshot
    screenshot_path = os.path.join(output_dir, "recon-homepage.png")
    lowres_path = os.path.join(output_dir, "recon-homepage.lowres.png")
    browser.screenshot(screenshot_path)
    compress_screenshot(screenshot_path, lowres_path)
    recon_data["screenshot"] = screenshot_path
    recon_data["screenshot_lowres"] = lowres_path

    # Try clicking search icon to reveal hidden input
    has_input = browser.execute_script(JS_FIND_VISIBLE_INPUT)
    if not has_input:
        clicked = browser.execute_script(JS_CLICK_SEARCH_ICON)
        if clicked:
            browser.wait(1)
            has_input = browser.execute_script(JS_FIND_VISIBLE_INPUT)
            if has_input:
                recon_data["search_requires_icon_click"] = True
                # Screenshot with search open
                search_screenshot = os.path.join(output_dir, "recon-search-open.png")
                search_lowres = os.path.join(output_dir, "recon-search-open.lowres.png")
                browser.screenshot(search_screenshot)
                compress_screenshot(search_screenshot, search_lowres)
                recon_data["search_open_screenshot"] = search_screenshot
                recon_data["search_open_screenshot_lowres"] = search_lowres

    recon_data["search_input_found"] = bool(has_input)

    # Save
    json_path = os.path.join(output_dir, "recon.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(recon_data, f, indent=2, ensure_ascii=False)

    log.info("Recon complete. Provider: %s, Input found: %s",
             recon_data.get("detected_provider", "Unknown"),
             recon_data.get("search_input_found", False))

    return recon_data


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Search Capture Tool — audit search functionality on websites",
    )
    parser.add_argument("--url", required=True, help="Target website URL")
    parser.add_argument("--query", help="Single search query to test")
    parser.add_argument("--queries-file", help="Path to file with queries (JSON or text)")
    parser.add_argument("--output-dir", required=True, help="Directory to save results")
    parser.add_argument("--site-name", default="", help="Friendly site name for reports")
    parser.add_argument("--recon", action="store_true", help="Run recon mode only")
    args = parser.parse_args()

    # Validate arguments
    if not args.recon and not args.query and not args.queries_file:
        parser.error("One of --query, --queries-file, or --recon is required")

    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)

    # Build query list
    queries = []
    if args.query:
        queries = [{"query": args.query, "category": "", "expectation": ""}]
    elif args.queries_file:
        queries = parse_queries_file(args.queries_file)

    # Launch Chrome
    browser = None
    try:
        browser = ChromeBrowser()

        if args.recon:
            recon_data = run_recon(browser, args.url, args.output_dir)
            # Write summary
            summary = {
                "mode": "recon",
                "url": args.url,
                "site_name": args.site_name,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "recon": recon_data,
            }
            summary_path = os.path.join(args.output_dir, "capture-summary.json")
            with open(summary_path, "w", encoding="utf-8") as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)
            log.info("Recon summary saved to %s", summary_path)
            return

        # Run queries
        all_results = []
        for qi in queries:
            result = capture_query(browser, args.url, qi, args.output_dir)
            all_results.append(result)

        # Write capture-summary.json
        summary = {
            "mode": "capture",
            "url": args.url,
            "site_name": args.site_name,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total_queries": len(all_results),
            "successful": sum(1 for r in all_results if r["success"]),
            "blocked": sum(1 for r in all_results if r["blocked"]),
            "queries": all_results,
        }
        summary_path = os.path.join(args.output_dir, "capture-summary.json")
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)

        log.info(
            "Done. %d/%d queries successful. Summary: %s",
            summary["successful"], summary["total_queries"], summary_path,
        )

    except KeyboardInterrupt:
        log.info("Interrupted by user")
    except Exception as exc:
        log.error("Fatal error: %s", exc, exc_info=True)
        sys.exit(1)
    finally:
        if browser:
            browser.quit()


if __name__ == "__main__":
    main()
