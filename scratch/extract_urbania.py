import fitz
import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
pdf_path = os.path.join(base_dir, "assets", "brochures", "The-Avenue-Urbania-Brochure.pdf")
out_dir = os.path.join(base_dir, "assets", "urbania-brochure")
os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"Total Pages in The-Avenue-Urbania-Brochure.pdf: {len(doc)}")

txt_file = os.path.join(base_dir, "scratch", "urbania_text.txt")
with open(txt_file, "w", encoding="utf-8") as out:
    for i, page in enumerate(doc):
        text = page.get_text()
        out.write(f"\n==================== PAGE {i+1} ====================\n")
        out.write(text.strip() + "\n")
        
        # Save page rendering as image
        pix = page.get_pixmap(dpi=150)
        page_img_path = os.path.join(out_dir, f"page_{i+1}.png")
        pix.save(page_img_path)
        print(f"Page {i+1} saved ({pix.width}x{pix.height})")

doc.close()
print("Done extracting pages and text!")
