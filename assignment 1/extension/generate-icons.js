const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal pure-Node PNG generator
function createPng(size) {
  // Width, Height
  const width = size;
  const height = size;

  // RGBA buffer: height rows, each with 1 filter byte + width * 4 bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const radius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Rounded rectangle test
      const dx = Math.abs(x + 0.5 - cx);
      const dy = Math.abs(y + 0.5 - cy);
      const hw = width / 2 - 1;
      const hh = height / 2 - 1;

      let inBounds = false;
      if (dx <= hw - radius && dy <= hh) inBounds = true;
      else if (dx <= hw && dy <= hh - radius) inBounds = true;
      else {
        const cornerDx = dx - (hw - radius);
        const cornerDy = dy - (hh - radius);
        if (cornerDx * cornerDx + cornerDy * cornerDy <= radius * radius) {
          inBounds = true;
        }
      }

      if (inBounds) {
        // Teal background (#0F766E -> R:15, G:118, B:110)
        let r = 15;
        let g = 118;
        let b = 110;
        let a = 255;

        // Draw an 'E' shape
        const nx = (x / width) * 100;
        const ny = (y / height) * 100;

        const inStem = nx >= 26 && nx <= 42 && ny >= 24 && ny <= 76;
        const inTop = nx >= 26 && nx <= 74 && ny >= 24 && ny <= 36;
        const inMid = nx >= 26 && nx <= 66 && ny >= 44 && ny <= 56;
        const inBot = nx >= 26 && nx <= 74 && ny >= 64 && ny <= 76;

        if (inStem || inTop || inMid || inBot) {
          // Warm paper white (#FAF8F5 -> R:250, G:248, B:245)
          r = 250;
          g = 248;
          b = 245;
        }

        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = a;
      } else {
        // Transparent
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  // Compress IDAT data
  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: deflate
  ihdr[11] = 0; // Filter: standard
  ihdr[12] = 0; // Interlace: none
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// CRC32 table & calculation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const outDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

[16, 32, 48, 128].forEach((size) => {
  const png = createPng(size);
  const outPath = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Generated ${outPath} (${png.length} bytes)`);
});
