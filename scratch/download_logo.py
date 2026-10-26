import urllib.request
import os

url = "https://avenue-website-new.vercel.app/logo-avenue-colour.webp"
target = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders\assets\logo-avenue-colour.webp"

print("Downloading", url)
urllib.request.urlretrieve(url, target)
print("Saved to", target, "Size:", os.path.getsize(target))
