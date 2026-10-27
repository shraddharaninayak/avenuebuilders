import os
import numpy as np
from PIL import Image

brain_dir = r"C:\Users\nshra\.gemini\antigravity-ide\brain\2b511e0f-8307-45ab-95bb-baa24d0bc8c8"
workspace_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
assets_dir = os.path.join(workspace_dir, "assets")

img_travertine = os.path.join(brain_dir, "avenue_travertine_seamless_wall_1793081566876.jpg")
img_panorama = os.path.join(brain_dir, "avenue_continuous_panorama_1793081604040.jpg")

# 1. Seamless Vertical Tile for Travertine Stone Wall
def make_vertical_seamless(img_path, blend_h=180):
    im = Image.open(img_path).convert('RGB')
    arr = np.array(im, dtype=np.float32)
    h, w, c = arr.shape
    
    # We blend top blend_h rows with bottom blend_h rows
    top_strip = arr[:blend_h, :, :]
    bottom_strip = arr[-blend_h:, :, :]
    
    alpha = np.linspace(0, 1, blend_h)[:, None, None]
    
    # Blended seam
    blended = top_strip * (1 - alpha) + bottom_strip * alpha
    
    # Replace top with blended, and bottom with blended
    arr[:blend_h, :, :] = blended
    arr[-blend_h:, :, :] = blended
    
    res = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    return res

seamless_trav = make_vertical_seamless(img_travertine, blend_h=180)
out_trav_path = os.path.join(assets_dir, "avenue-stone-seamless.jpg")
seamless_trav.save(out_trav_path, quality=95)
print(f"Saved seamless travertine wall to: {out_trav_path} ({seamless_trav.size})")

# 2. Extract Right Timber Wood Slats Screen (Full Height & Seamless)
pano = Image.open(img_panorama).convert('RGBA')
pw, ph = pano.size

# The slats start around x = 1010 to pw
slats_crop = pano.crop((1010, 0, pw, ph))
sw, sh = slats_crop.size

# Feather the left edge so it fades cleanly onto the stone wall
slats_arr = np.array(slats_crop, dtype=np.float32)
feather_w = 40
for x in range(feather_w):
    fade = float(x) / feather_w
    slats_arr[:, x, 3] *= fade

# Make vertical seamless for slats
blend_h = 100
top_strip = slats_arr[:blend_h, :, :].copy()
bot_strip = slats_arr[-blend_h:, :, :].copy()
alpha = np.linspace(0, 1, blend_h)[:, None, None]
blended = top_strip * (1 - alpha) + bot_strip * alpha
slats_arr[:blend_h, :, :] = blended
slats_arr[-blend_h:, :, :] = blended

slats_res = Image.fromarray(np.clip(slats_arr, 0, 255).astype(np.uint8))
out_slats_path = os.path.join(assets_dir, "avenue-slats-seamless.png")
slats_res.save(out_slats_path)
print(f"Saved seamless slats to: {out_slats_path} ({slats_res.size})")

# 3. Extract Left Pillar & Olive Foliage Frame (Full Height & Seamless)
pillar_crop = pano.crop((0, 0, 310, ph))
pillar_arr = np.array(pillar_crop, dtype=np.float32)

# Feather the right edge so it fades into the stone wall
for x in range(feather_w):
    fade = float(x) / feather_w
    pillar_arr[:, 310 - 1 - x, 3] *= fade

# Make vertical seamless
top_strip = pillar_arr[:blend_h, :, :].copy()
bot_strip = pillar_arr[-blend_h:, :, :].copy()
blended = top_strip * (1 - alpha) + bot_strip * alpha
pillar_arr[:blend_h, :, :] = blended
pillar_arr[-blend_h:, :, :] = blended

pillar_res = Image.fromarray(np.clip(pillar_arr, 0, 255).astype(np.uint8))
out_pillar_path = os.path.join(assets_dir, "avenue-pillar-seamless.png")
pillar_res.save(out_pillar_path)
print(f"Saved seamless pillar to: {out_pillar_path} ({pillar_res.size})")
