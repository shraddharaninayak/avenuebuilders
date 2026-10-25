import os
from PIL import Image

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
img_dir = os.path.join(base_dir, "assets", "milestone-brochure")
thumb_dir = os.path.join(base_dir, "scratch", "milestone-thumbs")
os.makedirs(thumb_dir, exist_ok=True)

# Generate small thumbnails for fast inspection
for i in range(1, 27):
    src = os.path.join(img_dir, f"page_{i}.png")
    if os.path.exists(src):
        with Image.open(src) as img:
            thumb = img.resize((600, 350), Image.Resampling.LANCZOS)
            thumb.save(os.path.join(thumb_dir, f"thumb_{i}.jpg"), quality=80)

print(f"Generated 26 thumbnails in {thumb_dir}")
