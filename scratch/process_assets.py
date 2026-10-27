import os
from PIL import Image

brain_dir = r"C:\Users\nshra\.gemini\antigravity-ide\brain\2b511e0f-8307-45ab-95bb-baa24d0bc8c8"
workspace_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
assets_dir = os.path.join(workspace_dir, "assets")

# Images
img_travertine = os.path.join(brain_dir, "avenue_travertine_seamless_wall_1793081566876.jpg")
img_panorama = os.path.join(brain_dir, "avenue_continuous_panorama_1793081604040.jpg")

print("Checking source images...")
im_trav = Image.open(img_travertine)
print("Travertine:", im_trav.size)
im_pano = Image.open(img_panorama)
print("Panorama:", im_pano.size)
