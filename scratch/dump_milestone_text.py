import fitz
import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
pdf_path = os.path.join(base_dir, "assets", "Milestone E-Brochure New.pdf")
doc = fitz.open(pdf_path)

with open(os.path.join(base_dir, "scratch", "milestone_text.txt"), "w", encoding="utf-8") as out:
    for i, page in enumerate(doc):
        text = page.get_text()
        out.write(f"\n==================== PAGE {i+1} ====================\n")
        out.write(text.strip() + "\n")

print("Done writing text")
