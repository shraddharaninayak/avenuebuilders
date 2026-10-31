import numpy as np
from PIL import Image, ImageFilter

orig_path = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders\assets\the-avenue-commercial-building.jpg"
orig = Image.open(orig_path).convert("RGB")
orig_w, orig_h = orig.size

# Target dimensions matching 16:10.3 ratio
# 16 / 10.3 = 1.553398...
# 1024 * 1.553398 = 1590.68 -> 1591
target_w = 1591
target_h = 1024

# Scale factor: zoom out slightly so complete building fits with breathing space
# In original, building is approx 690px wide (x: 80 to 770) and 788px high (y: 62 to 850)
scale = 0.88
scaled_w = int(round(orig_w * scale))
scaled_h = int(round(orig_h * scale))
scaled_img = orig.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)

# Position so the building is centered horizontally and vertically
# Building center in original: x = (80 + 770) / 2 = 425, y = (62 + 850) / 2 = 456
scaled_center_x = int(425 * scale)
scaled_center_y = int(456 * scale)

pos_x = (target_w // 2) - scaled_center_x
pos_y = (target_h // 2) - scaled_center_y

print(f"Original size: {orig_w}x{orig_h}")
print(f"Scaled size: {scaled_w}x{scaled_h}")
print(f"Canvas: {target_w}x{target_h}")
print(f"Placing at pos_x={pos_x}, pos_y={pos_y}")

# Step 1: Create background canvas by creating full-width sky and ground extension
# We can create a base from a blurred and stretched version of the original image
# that perfectly matches the color palette and atmosphere
bg_base = orig.resize((target_w, target_h), Image.Resampling.LANCZOS)
# Horizontal blur / smooth gradient for background
bg_blurred = bg_base.filter(ImageFilter.GaussianBlur(radius=25))

# We also build an accurate sky gradient for the top ~70%
# Sample vertical column of sky from left edge (x=10) and right edge (x=orig_w-10)
bg_arr = np.array(bg_blurred, dtype=np.float32)
orig_arr = np.array(orig, dtype=np.float32)

# For y in range(0, target_h):
# Left edge of scaled image will be at pos_x
# Right edge of scaled image will be at pos_x + scaled_w
# We can smoothly extend the left strip outward to 0, and right strip outward to target_w
left_strip = orig_arr[:, 0:15, :].mean(axis=1) # shape (orig_h, 3)
right_strip = orig_arr[:, orig_w-15:orig_w, :].mean(axis=1) # shape (orig_h, 3)

# Resize strips vertically to match scaled_h
left_strip_scaled = np.zeros((scaled_h, 3), dtype=np.float32)
right_strip_scaled = np.zeros((scaled_h, 3), dtype=np.float32)

for c in range(3):
    left_strip_scaled[:, c] = np.interp(
        np.linspace(0, orig_h - 1, scaled_h),
        np.arange(orig_h),
        left_strip[:, c]
    )
    right_strip_scaled[:, c] = np.interp(
        np.linspace(0, orig_h - 1, scaled_h),
        np.arange(orig_h),
        right_strip[:, c]
    )

# Fill left background (x < pos_x) and right background (x >= pos_x + scaled_w)
for y_idx in range(scaled_h):
    canvas_y = pos_y + y_idx
    if 0 <= canvas_y < target_h:
        c_left = left_strip_scaled[y_idx]
        c_right = right_strip_scaled[y_idx]
        # On the left:
        bg_arr[canvas_y, :pos_x] = c_left
        # On the right:
        bg_arr[canvas_y, pos_x + scaled_w:] = c_right

# Sky above pos_y: extend top row colors
top_row = bg_arr[max(0, pos_y), :, :].copy()
for canvas_y in range(0, max(0, pos_y)):
    # subtle gradient slightly darker blue towards very top
    darken = 1.0 - (max(0, pos_y) - canvas_y) * 0.001
    bg_arr[canvas_y, :] = top_row * darken

# Ground below pos_y + scaled_h: extend bottom row
bottom_row = bg_arr[min(target_h - 1, pos_y + scaled_h - 1), :, :].copy()
for canvas_y in range(pos_y + scaled_h, target_h):
    bg_arr[canvas_y, :] = bottom_row

# Apply horizontal smoothing blur to the background
bg_img = Image.fromarray(np.clip(bg_arr, 0, 255).astype(np.uint8))
bg_img = bg_img.filter(ImageFilter.GaussianBlur(radius=8))

# Step 2: Composite the scaled image with feathered edges onto bg_img
# Create alpha mask for scaled_img with feathered margins (35px) on borders
mask = np.ones((scaled_h, scaled_w), dtype=np.float32)
feather = 35

# Left and right feathering
for i in range(feather):
    alpha = 0.5 * (1 - np.cos(np.pi * (i + 1) / feather))
    mask[:, i] = np.minimum(mask[:, i], alpha)
    mask[:, scaled_w - 1 - i] = np.minimum(mask[:, scaled_w - 1 - i], alpha)

# Top feathering (sky area)
top_feather = 45
for i in range(top_feather):
    alpha = 0.5 * (1 - np.cos(np.pi * (i + 1) / top_feather))
    mask[i, :] = np.minimum(mask[i, :], alpha)

# Bottom feathering (street area)
bottom_feather = 30
for i in range(bottom_feather):
    alpha = 0.5 * (1 - np.cos(np.pi * (i + 1) / bottom_feather))
    mask[scaled_h - 1 - i, :] = np.minimum(mask[scaled_h - 1 - i, :], alpha)

mask_img = Image.fromarray((mask * 255).astype(np.uint8), mode="L")

# Paste scaled image onto background using the smooth feather mask
final_canvas = bg_img.copy()
final_canvas.paste(scaled_img, (pos_x, pos_y), mask_img)

out_preview = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders\scratch\commercial_wide_preview.jpg"
final_canvas.save(out_preview, quality=96)
print(f"Saved wide preview to {out_preview}")
