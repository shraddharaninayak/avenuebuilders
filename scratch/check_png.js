const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const sizeOfPng = (filePath) => {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  return null;
};

console.log('left-foliage:', sizeOfPng(path.join(ROOT, 'assets', 'avenue-left-foliage.png')));
console.log('right-slats:', sizeOfPng(path.join(ROOT, 'assets', 'avenue-right-slats.png')));
console.log('wall:', fs.statSync(path.join(ROOT, 'assets', 'avenue-architectural-wall.jpg')).size);
