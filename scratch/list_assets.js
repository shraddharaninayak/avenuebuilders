const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const assets = fs.readdirSync(path.join(ROOT, 'assets')).filter(f => /wall|foliage|stone|slate|slat|canvas|back|pillar/i.test(f));
console.log('Candidate assets:', assets);
