from PIL import Image
import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
img_dir = os.path.join(base_dir, "assets", "urbania-brochure")
thumb_dir = os.path.join(base_dir, "scratch", "urbania-thumbs")
os.makedirs(thumb_dir, exist_ok=True)

for i in range(1, 20):
    src = os.path.join(img_dir, f"page_{i}.png")
    if os.path.exists(src):
        with Image.open(src) as img:
            rgb_img = img.convert("RGB")
            w, h = rgb_img.size
            new_w = 600
            new_h = int(h * (600 / w))
            thumb = rgb_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            thumb.save(os.path.join(thumb_dir, f"thumb_{i}.jpg"), quality=80)

print(f"Generated 19 thumbnails in {thumb_dir}")
