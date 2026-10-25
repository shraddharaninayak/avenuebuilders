from PIL import Image
import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
source_dir = os.path.join(base_dir, "assets", "milestone-brochure")

# List of key pages to optimize for the web presentation
web_pages = [
    ("page_1.png", "milestone-cover.jpg", 1920),
    ("page_3.png", "milestone-hero-render.jpg", 1920),
    ("page_6.png", "milestone-entrance-porch.jpg", 1920),
    ("page_7.png", "milestone-night-aerial.jpg", 1920),
    ("page_8.png", "milestone-towers-day.jpg", 1920),
    ("page_10.png", "milestone-lobby.jpg", 1920),
    ("page_11.png", "milestone-amenities-aerial.jpg", 1920),
    ("page_12.png", "milestone-clubhouse-kids.jpg", 1920),
    ("page_13.png", "milestone-gym-games.jpg", 1920),
    ("page_14.png", "milestone-yoga-music.jpg", 1920),
    ("page_15.png", "plan-ground-floor.jpg", 2200),
    ("page_16.png", "plan-first-podium.jpg", 2200),
    ("page_17.png", "plan-wing-a-flat-1.jpg", 2200),
    ("page_18.png", "plan-wing-a-flat-2.jpg", 2200),
    ("page_19.png", "plan-wing-a-typical.jpg", 2200),
    ("page_23.png", "plan-recreational-floor.jpg", 2200),
    ("page_24.png", "plan-sky-terraces.jpg", 2200),
    ("page_25.png", "milestone-specifications.jpg", 1920),
    ("page_26.png", "milestone-contact-back.jpg", 1920),
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

print("Asset optimization complete.")
