import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import base64
import os
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer

EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
CDP_PORT = 9255
HTTP_PORT = 8095
ROOT_DIR = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
USER_DATA = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders\scratch\temp_edge_py"

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    server = HTTPServer(('127.0.0.1', HTTP_PORT), QuietHandler)
    server.serve_forever()

async def run():
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    proc = subprocess.Popen([
        EDGE_EXE,
        f"--remote-debugging-port={CDP_PORT}",
        f"--user-data-dir={USER_DATA}",
        "--headless=new",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-gpu",
        "--window-size=1400,900",
        f"http://127.0.0.1:{HTTP_PORT}/projects.html"
    ])
    try:
        await asyncio.sleep(3)
        req = urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json")
        tabs = json.loads(req.read().decode())
        tab = [t for t in tabs if t.get("type") == "page"][0]
        ws_url = tab["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
            msg_id = 1
            async def send(method, params=None):
                nonlocal msg_id
                cid = msg_id
                msg_id += 1
                payload = {"id": cid, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get("id") == cid:
                        return resp.get("result", {})

            await send("Page.enable")
            await send("Runtime.enable")
            await asyncio.sleep(1)

            # Check readyState and title
            info = await send("Runtime.evaluate", {
                "expression": "document.title + ' | readyState: ' + document.readyState",
                "returnByValue": True
            })
            print("Page info:", info)

            # remove any intro/preloader
            await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const pre = document.getElementById('preloader');
                    if (pre) pre.remove();
                    const intro = document.getElementById('avenue-intro');
                    if (intro) intro.remove();
                    document.body.style.opacity = '1';
                    document.body.style.visibility = 'visible';
                })()
                """
            })

            rect = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const el = document.getElementById('commercial');
                    if (!el) return { error: 'not found', totalCards: document.querySelectorAll('.delivered-card').length };
                    el.scrollIntoView({ behavior: 'instant', block: 'center' });
                    const r = el.getBoundingClientRect();
                    return { x: r.x, y: r.y, width: r.width, height: r.height };
                })()
                """,
                "returnByValue": True
            })
            print("Commercial card rect:", rect)
            await asyncio.sleep(1)

            # Full viewport screenshot
            full_shot = await send("Page.captureScreenshot", {"format": "png"})
            out_path = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders\scratch\py_full_shot.png"
            with open(out_path, "wb") as f:
                f.write(base64.b64decode(full_shot["data"]))
            print("Saved full screenshot to", out_path)

            r_val = rect["result"].get("value", {})
            if "x" in r_val:
                shot = await send("Page.captureScreenshot", {
                    "format": "png",
                    "clip": {
                        "x": max(0, r_val["x"] - 20),
                        "y": max(0, r_val["y"] - 20),
                        "width": r_val["width"] + 40,
                        "height": r_val["height"] + 40,
                        "scale": 1
                    }
                })
                card_out = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders\scratch\py_card_shot.png"
                with open(card_out, "wb") as f:
                    f.write(base64.b64decode(shot["data"]))
                print("Saved card screenshot to", card_out)
    finally:
        proc.terminate()

asyncio.run(run())

