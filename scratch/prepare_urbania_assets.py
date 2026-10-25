from PIL import Image
import os
import shutil

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
source_dir = os.path.join(base_dir, "assets", "urbania-brochure")

# Copy building-urbania.jpg if not exists
building_dest = os.path.join(base_dir, "assets", "building-urbania.jpg")
building_src = os.path.join(base_dir, "images", "25-scaled.jpg")
if os.path.exists(building_src) and not os.path.exists(building_dest):
    shutil.copy2(building_src, building_dest)
    print("Copied building-urbania.jpg to assets/")

# Also copy brochure to assets/The-Avenue-Urbania-Brochure.pdf if not exists in assets/
brochure_root_dest = os.path.join(base_dir, "assets", "The-Avenue-Urbania-Brochure.pdf")
brochure_src = os.path.join(base_dir, "assets", "brochures", "The-Avenue-Urbania-Brochure.pdf")
if os.path.exists(brochure_src) and not os.path.exists(brochure_root_dest):
    shutil.copy2(brochure_src, brochure_root_dest)
    print("Copied The-Avenue-Urbania-Brochure.pdf to assets/")

web_pages = [
    ("page_1.png", "urbania-cover.jpg", 1400),
    ("page_2.png", "urbania-four-tiers.jpg", 1920),
    ("page_3.png", "urbania-hero-render.jpg", 1920),
    ("page_4.png", "urbania-entrance-gate.jpg", 1920),
    ("page_5.png", "urbania-ground-amenities.jpg", 1920),
    ("page_6.png", "plan-ground-podium.jpg", 2200),
    ("page_7.png", "plan-typical-floors.jpg", 2200),
    ("page_8.png", "urbania-aerial-tower.jpg", 1920),
    ("page_9.png", "urbania-sky-carpet.jpg", 1920),
    ("page_10.png", "urbania-gym-recreation.jpg", 1920),
    ("page_11.png", "urbania-infinity-pool-theatre.jpg", 1920),
    ("page_12.png", "plan-recreation-terrace.jpg", 2200),
    ("page_13.png", "urbania-lobby.jpg", 1920),
    ("page_14.png", "plan-4bhk-tower-a.jpg", 2200),
    ("page_15.png", "plan-3bhk-tower-b.jpg", 2200),
    ("page_16.png", "plan-5bhk-6bhk-penthouses.jpg", 2200),
    ("page_17.png", "urbania-tower-elevation.jpg", 1920),
    ("page_18.png", "urbania-location-map.jpg", 1920),
]

for src_name, dest_name, target_width in web_pages:
    src_path = os.path.join(source_dir, src_name)
    dest_path = os.path.join(source_dir, dest_name)
    if os.path.exists(src_path):
        with Image.open(src_path) as img:
            rgb_img = img.convert("RGB")
            orig_w, orig_h = rgb_img.size
            if orig_w > target_width:
                target_height = int(orig_h * (target_width / orig_w))
                resized = rgb_img.resize((target_width, target_height), Image.Resampling.LANCZOS)
                resized.save(dest_path, "JPEG", quality=88, optimize=True)
            else:
                rgb_img.save(dest_path, "JPEG", quality=88, optimize=True)
            print(f"Saved {dest_name}: {os.path.getsize(dest_path)//1024} KB")

print("Urbania asset preparation complete.")
