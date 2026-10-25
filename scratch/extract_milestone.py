import fitz # PyMuPDF
import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
pdf_path = os.path.join(base_dir, "assets", "Milestone E-Brochure New.pdf")
out_dir = os.path.join(base_dir, "assets", "milestone-brochure")
os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"Total Pages in Milestone E-Brochure New.pdf: {len(doc)}")

for i, page in enumerate(doc):
    text = page.get_text()
    print(f"\n--- PAGE {i+1} ---")
    print(text.strip())
    
    # Save page rendering as image
    pix = page.get_pixmap(dpi=150)
    page_img_path = os.path.join(out_dir, f"page_{i+1}.png")
    pix.save(page_img_path)
    print(f"Saved: {page_img_path} ({pix.width}x{pix.height})")

doc.close()
