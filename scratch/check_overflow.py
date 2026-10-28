import subprocess
import time
import json
import urllib.request
import os

edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(edge_exe):
    edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

# Launch Edge
proc = subprocess.Popen([
    edge_exe,
    "--headless",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--window-size=390,844",
    "http://localhost:8085/index.html"
])

time.sleep(2)

try:
    req = urllib.request.urlopen("http://localhost:9222/json")
    pages = json.loads(req.read().decode())
    print("Edge pages:", len(pages))
    target = pages[0]
    ws_url = target["webSocketDebuggerUrl"]
    print("Target:", target["url"])
except Exception as e:
    print("Error:", e)
finally:
    proc.terminate()
