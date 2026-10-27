import os
from PIL import Image, ImageEnhance

src = r"C:\Users\nshra\.gemini\antigravity-ide\brain\993d9bb2-ab39-4625-b85d-d913683b845d\.user_uploaded\media_1793100401256.jpg"
dst_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders\assets"
dst_img = os.path.join(dst_dir, "about-hero-building.jpg")

img = Image.open(src)
print("Original dimensions:", img.size, img.mode)

# Save original copy for reference
img.save(os.path.join(dst_dir, "about-hero-building-raw.jpg"), quality=95)

# The user asks: "make the given image little evenging image suits with bg"
# "Display the complete building, including the rooftop and ground floor."
# Let's create an elegant, warm golden hour/evening lighting grade that suits the warm sunlit stone background:
# 1. Warm color temperature adjustment: boost red slightly, subtle green warm tint, soften harsh cool blues
r, g, b = img.split()

# Warming: scale R by 1.05, G by 1.01, B by 0.92
r_w = r.point(lambda i: min(255, int(i * 1.06)))
g_w = g.point(lambda i: min(255, int(i * 1.02)))
b_w = b.point(lambda i: max(0, int(i * 0.90)))

warmed = Image.merge("RGB", (r_w, g_w, b_w))

# Slightly enhance contrast and color saturation for rich golden architectural ambiance
enh_col = ImageEnhance.Color(warmed)
warmed = enh_col.enhance(1.08)

enh_con = ImageEnhance.Contrast(warmed)
warmed = enh_con.enhance(1.05)

warmed.save(dst_img, quality=95)
print("Saved warm evening building image to:", dst_img)
