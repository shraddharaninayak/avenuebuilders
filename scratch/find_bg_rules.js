const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

// Match any selector block mentioning projects-editorial or delivered
const regex = /([^{}]+)\{([^{}]+)\}/g;
let match;
while ((match = regex.exec(css)) !== null) {
  const sel = match[1].trim();
  const body = match[2].trim();
  if (/projects-editorial|delivered-gallery|delivered-card|\.projects-page/i.test(sel) && /background/i.test(body)) {
    console.log('--- SELECTOR ---');
    console.log(sel);
    const bgLines = body.split(';').map(s => s.trim()).filter(s => /background/i.test(s));
    console.log(bgLines.join('\n'));
  }
}
