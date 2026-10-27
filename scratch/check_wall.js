const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const sizeOf = (filePath) => {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] === 0xff && (buf[i+1] === 0xc0 || buf[i+1] === 0xc2)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
};

console.log('wall dimensions:', sizeOf(path.join(ROOT, 'assets', 'avenue-architectural-wall.jpg')));
