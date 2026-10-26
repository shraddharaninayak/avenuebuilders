import subprocess
import time
import json
import urllib.request
import os
import websocket # let's check if websocket or basic request works

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
out_dir = os.path.join(base_dir, "scratch", "timeline_shots")
os.makedirs(out_dir, exist_ok=True)

# Launch Edge with remote debugging
proc = subprocess.Popen([
    edge_exe,
    "--headless",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--window-size=1400,900",
    "about:blank"
])

time.sleep(1.5)

try:
    # Query CDP endpoints
    req = urllib.request.urlopen("http://localhost:9222/json")
    pages = json.loads(req.read().decode())
    print("CDP pages:", pages)
    ws_url = pages[0]["webSocketDebuggerUrl"]
    print("WebSocket URL:", ws_url)
except Exception as e:
    print("CDP query failed:", e)
finally:
    proc.terminate()
