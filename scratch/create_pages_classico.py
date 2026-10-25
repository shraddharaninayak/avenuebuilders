import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
source_file = os.path.join(base_dir, "classico.html")
dest_file = os.path.join(base_dir, "pages", "classico.html")

with open(source_file, "r", encoding="utf-8") as f:
    html = f.read()

# Replace asset references
html_sub = html.replace('href="assets/', 'href="../assets/')
html_sub = html_sub.replace("href='assets/", "href='../assets/")
html_sub = html_sub.replace('src="assets/', 'src="../assets/')
html_sub = html_sub.replace("src='assets/", "src='../assets/")
html_sub = html_sub.replace('href="styles.css"', 'href="../styles.css"')

# In modal JS, check if there's any dynamic src or paths
# In classico.html:
# modalImg.src = img.src; (uses current img src, which will already have ../assets/...)
# modalDownload.href = img.src;

with open(dest_file, "w", encoding="utf-8") as f:
    f.write(html_sub)

print(f"Created {dest_file} ({len(html_sub)} bytes)")
