import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"

matches = []
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if "milestone" in f.lower():
            matches.append(os.path.join(root, f))

print(f"Found {len(matches)} milestone files:")
for m in matches:
    print(" -", os.path.relpath(m, base_dir))
