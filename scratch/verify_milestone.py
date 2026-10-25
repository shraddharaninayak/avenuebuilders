import os
import re

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"

def verify_milestone_file(file_rel_path):
    print(f"\n--- Verifying {file_rel_path} ---")
    full_path = os.path.join(base_dir, file_rel_path)
    if not os.path.exists(full_path):
        print(f"ERROR: {file_rel_path} does not exist!")
        return False
    
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    file_dir = os.path.dirname(full_path)
    
    # 1. Check local assets in src
    srcs = re.findall(r'src=["\']([^"\']+)["\']', content)
    for src in srcs:
        if src.startswith("http") or src.startswith("data:") or not src:
            continue
        asset_path = os.path.normpath(os.path.join(file_dir, src))
        if not os.path.exists(asset_path):
            print(f"ERROR: Missing src asset: {src} -> {asset_path}")
        else:
            print(f"OK src: {src}")

    # 1b. Check data-src
    d_srcs = re.findall(r'data-src=["\']([^"\']+)["\']', content)
    for src in d_srcs:
        if src.startswith("http") or src.startswith("data:") or not src:
            continue
        asset_path = os.path.normpath(os.path.join(file_dir, src))
        if not os.path.exists(asset_path):
            print(f"ERROR: Missing data-src asset: {src} -> {asset_path}")
        else:
            print(f"OK data-src: {src}")
            
    # 2. Check local assets / relative links in href
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', content)
    anchors = []
    for href in hrefs:
        if href.startswith("http") or href.startswith("tel:") or href.startswith("mailto:") or not href:
            continue
        if href.startswith("#"):
            anchors.append(href[1:])
            continue
        
        target_file_part = href.split("#")[0]
        if target_file_part:
            target_path = os.path.normpath(os.path.join(file_dir, target_file_part))
            if not os.path.exists(target_path):
                print(f"ERROR: Missing href target: {href} -> {target_path}")
            else:
                print(f"OK href: {href}")

    # 3. Check anchors against IDs
    ids = set(re.findall(r'id=["\']([^"\']+)["\']', content))
    for anchor in anchors:
        if anchor in ids:
            print(f"OK anchor: #{anchor}")
        else:
            print(f"ERROR: Anchor #{anchor} not found in elements!")

verify_milestone_file("milestone.html")
verify_milestone_file(os.path.join("pages", "milestone.html"))

# 4. Check links in projects.html and pages/projects.html
print("\n--- Verifying Project Linkages ---")
with open(os.path.join(base_dir, "projects.html"), "r", encoding="utf-8") as f:
    p_content = f.read()
if "milestone.html" in p_content and 'id="milestone"' in p_content:
    print("OK: projects.html correctly links to milestone.html and contains #milestone")
else:
    print("ERROR: projects.html linkage incomplete!")

with open(os.path.join(base_dir, "pages", "projects.html"), "r", encoding="utf-8") as f:
    pp_content = f.read()
if "../milestone.html" in pp_content and 'id="milestone"' in pp_content:
    print("OK: pages/projects.html correctly links to ../milestone.html and contains #milestone")
else:
    print("ERROR: pages/projects.html linkage incomplete!")
