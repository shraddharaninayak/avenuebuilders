const fs = require('fs');

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

const refPath = 'C:/Users/nshra/.gemini/antigravity-ide/brain/2b511e0f-8307-45ab-95bb-baa24d0bc8c8/.user_uploaded/media_1793076713171.jpg';
console.log('User reference image size:', sizeOf(refPath));
