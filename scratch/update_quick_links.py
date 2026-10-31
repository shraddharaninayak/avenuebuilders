pages = ['index.html', 'about.html', 'services.html', 'projects.html', 'contact.html', 'portfolio.html']

old_link = '<li><a href="projects.html#layouts">Completed Layouts</a></li>'
new_link = '<li><a href="services.html">Services</a></li>'

for p in pages:
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()

    if old_link in content:
        content = content.replace(old_link, new_link)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'{p}: successfully updated')
    else:
        print(f'{p}: old link not found')
