#!/usr/bin/env python3
"""
Minimal screenshot tool for localhost demos.

Navigates to a URL, takes a screenshot, and creates a lowres copy.
Uses Chrome --headless=new with raw CDP. No stealth, no overlay dismissal.

Usage:
  python screenshot.py --url http://localhost:3000 --output path/to/output.png [--wait SECONDS]
"""

import argparse
import base64
import json
import os
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
                self._recv_exact(4)
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
        self.datadir = tempfile.mkdtemp(prefix="screenshot-")
        self.process = subprocess.Popen(
            [
                CHROME_PATH,
                f"--remote-debugging-port={self.port}",
                f"--user-data-dir={self.datadir}",
                "--headless=new",
                "--no-first-run",
                "--disable-default-apps",
                "--window-size=1440,900",
                "about:blank",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        self._wait_for_cdp()
        ws_url = self._get_page_ws_url()
        self.cdp = CDPClient(ws_url)
        self.cdp.send("Page.enable")

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

    def screenshot(self, path):
        result = self.cdp.send("Page.captureScreenshot", {"format": "png"})
        data = result.get("result", {}).get("data", "")
        if data:
            with open(path, "wb") as f:
                f.write(base64.b64decode(data))

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
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(
        description="Capture localhost demo screenshots"
    )
    parser.add_argument("--url", required=True, help="URL to screenshot")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument(
        "--wait", type=int, default=2, help="Seconds to wait after page load (default: 2)"
    )

    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)

    browser = ChromeBrowser()
    try:
        browser.navigate(args.url)
        time.sleep(args.wait)
        browser.screenshot(args.output)
        compress_screenshot(args.output)
        print(f"Captured: {args.output}")
    finally:
        browser.quit()


if __name__ == "__main__":
    main()
