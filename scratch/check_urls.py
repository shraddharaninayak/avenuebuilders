import os
import re

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
file_path = os.path.join(base_dir, "classico.html")

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

srcs = set(re.findall(r'src=["\']([^"\']+)["\']', content))
hrefs = set(re.findall(r'href=["\']([^"\']+)["\']', content))
print("SRCS:")
for s in sorted(list(srcs)):
    print(" ", s)
print("HREFS:")
for h in sorted(list(hrefs)):
    print(" ", h)
