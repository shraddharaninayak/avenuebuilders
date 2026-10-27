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

const f1 = 'C:/Users/nshra/.gemini/antigravity-ide/brain/2b511e0f-8307-45ab-95bb-baa24d0bc8c8/avenue_panoramic_canvas_1793076928116.jpg';
const f2 = 'C:/Users/nshra/.gemini/antigravity-ide/brain/2b511e0f-8307-45ab-95bb-baa24d0bc8c8/avenue_architectural_full_canvas_1793076899641.jpg';
console.log('panoramic:', sizeOf(f1));
console.log('full_canvas:', sizeOf(f2));
