import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"

pdfs = []
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.lower().endswith(".pdf"):
            pdfs.append(os.path.join(root, f))

print(f"Found {len(pdfs)} PDF files:")
for p in pdfs:
    print(" -", os.path.relpath(p, base_dir))
