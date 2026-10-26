import subprocess
import os

out_path = os.path.abspath(os.path.join(r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders\scratch", "shot1.png"))
edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

cmd = [
    edge_exe,
    "--headless",
    "--disable-gpu",
    "--window-size=1400,900",
    f"--screenshot={out_path}",
    "http://localhost:8080/index.html"
]

print("Running command...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
print("File exists:", os.path.exists(out_path), "Size:", os.path.getsize(out_path) if os.path.exists(out_path) else 0)
