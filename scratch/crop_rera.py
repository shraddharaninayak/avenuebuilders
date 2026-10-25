from PIL import Image
import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
page26_path = os.path.join(base_dir, "assets", "milestone-brochure", "page_26.png")

with Image.open(page26_path) as img:
    # crop top-left area (width: 800, height: 300)
    crop = img.crop((0, 0, 900, 300))
    crop.save(os.path.join(base_dir, "scratch", "page26_topleft.png"))
    
print("Saved top-left crop")
