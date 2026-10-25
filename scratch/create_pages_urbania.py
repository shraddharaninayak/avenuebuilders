import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
src_file = os.path.join(base_dir, "urbania.html")
dest_file = os.path.join(base_dir, "pages", "urbania.html")

with open(src_file, "r", encoding="utf-8") as f:
    html = f.read()

# Replace asset references
html_sub = html.replace('href="assets/', 'href="../assets/')
html_sub = html_sub.replace("href='assets/", "href='../assets/")
html_sub = html_sub.replace('src="assets/', 'src="../assets/')
html_sub = html_sub.replace("src='assets/", "src='../assets/")
html_sub = html_sub.replace('data-src="assets/', 'data-src="../assets/')
html_sub = html_sub.replace("data-src='assets/", "data-src='../assets/")
html_sub = html_sub.replace('href="styles.css"', 'href="../styles.css"')

with open(dest_file, "w", encoding="utf-8") as f:
    f.write(html_sub)

print(f"Generated {dest_file} ({len(html_sub)} bytes)")
