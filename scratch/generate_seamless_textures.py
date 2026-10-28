import os
import numpy as np
from PIL import Image

brain_dir = r"C:\Users\nshra\.gemini\antigravity-ide\brain\2b511e0f-8307-45ab-95bb-baa24d0bc8c8"
workspace_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
assets_dir = os.path.join(workspace_dir, "assets")

img_travertine = os.path.join(brain_dir, "avenue_travertine_seamless_wall_1793081566876.jpg")
img_panorama = os.path.join(brain_dir, "avenue_continuous_panorama_1793081604040.jpg")

print("Processing stone texture...")
# 1. Seamless Travertine Wall
im_trav = Image.open(img_travertine).convert('RGB')
arr_trav = np.array(im_trav, dtype=np.float32)
H, W, C = arr_trav.shape

half = H // 2
rolled_trav = np.roll(arr_trav, half, axis=0)
y = np.arange(H)[:, None, None]
w = 0.5 * (1 + np.cos(2 * np.pi * y / H))
blended_trav = rolled_trav * w + arr_trav * (1 - w)
res_trav = Image.fromarray(np.clip(blended_trav, 0, 255).astype(np.uint8))

p_stone1 = os.path.join(assets_dir, "avenue-stone-seamless.jpg")
p_stone2 = os.path.join(assets_dir, "about-stone-seamless.jpg")
res_trav.save(p_stone1, quality=96)
res_trav.save(p_stone2, quality=96)
print(f"Saved {p_stone1} ({res_trav.size})")

# 2. Seamless Timber Slats
print("Processing slats...")
pano = Image.open(img_panorama).convert('RGBA')
pw, ph = pano.size

slats_crop = pano.crop((1010, 0, pw, ph))
slats_arr = np.array(slats_crop, dtype=np.float32)

feather_w = 40
for x in range(feather_w):
    slats_arr[:, x, 3] *= float(x) / feather_w

sH, sW, _ = slats_arr.shape
s_half = sH // 2
rolled_slats = np.roll(slats_arr, s_half, axis=0)
sy = np.arange(sH)[:, None, None]
sw_cos = 0.5 * (1 + np.cos(2 * np.pi * sy / sH))
blended_slats = rolled_slats * sw_cos + slats_arr * (1 - sw_cos)
res_slats = Image.fromarray(np.clip(blended_slats, 0, 255).astype(np.uint8))

p_slats1 = os.path.join(assets_dir, "avenue-slats-seamless.png")
p_slats2 = os.path.join(assets_dir, "about-pillar-right-seamless.png")
res_slats.save(p_slats1)
res_slats.save(p_slats2)
print(f"Saved {p_slats1} ({res_slats.size})")

# 3. Seamless Pillar & Foliage
print("Processing pillar...")
pillar_crop = pano.crop((0, 0, 310, ph))
pillar_arr = np.array(pillar_crop, dtype=np.float32)

for x in range(feather_w):
    pillar_arr[:, 310 - 1 - x, 3] *= float(x) / feather_w

pH, pW, _ = pillar_arr.shape
cut = 605
shift = pH - cut - 1
rolled_pillar = np.roll(pillar_arr, shift, axis=0)

# Smooth internal seam at row shift
blend_h = 100
half_b = blend_h // 2
seam = shift
t = np.linspace(0, 1, blend_h)[:, None, None]
smooth_t = 0.5 * (1 - np.cos(np.pi * t))

# Create smooth blend across the internal cut
for i in range(blend_h):
    row_idx = seam - half_b + i
    if 0 <= row_idx < pH:
        rolled_pillar[row_idx] = rolled_pillar[seam - half_b] * (1 - smooth_t[i]) + rolled_pillar[min(seam + half_b, pH - 1)] * smooth_t[i]

res_pillar = Image.fromarray(np.clip(rolled_pillar, 0, 255).astype(np.uint8))
p_pillar1 = os.path.join(assets_dir, "avenue-pillar-seamless.png")
p_pillar2 = os.path.join(assets_dir, "about-pillar-left-seamless.png")
res_pillar.save(p_pillar1)
res_pillar.save(p_pillar2)
print(f"Saved {p_pillar1} ({res_pillar.size})")

print("All textures regenerated successfully.")
