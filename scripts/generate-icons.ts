import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create Brand SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#ec4899" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.8"/>
    </linearGradient>
  </defs>

  <!-- Background with rounded corners for maskable safe-zone -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  
  <!-- Subtle border -->
  <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="#374151" stroke-width="4" stroke-opacity="0.4"/>

  <!-- Document Silhouette (ID Card Shape) -->
  <g transform="translate(96, 126)">
    <!-- ID Card Base -->
    <rect width="320" height="200" rx="20" fill="#1f2937" stroke="#4b5563" stroke-width="3"/>
    
    <!-- Photo slot -->
    <rect x="24" y="28" width="76" height="100" rx="8" fill="#374151"/>
    <circle cx="62" cy="62" r="22" fill="#6b7280"/>
    <path d="M 36 116 Q 62 90 88 116 Z" fill="#6b7280"/>
    
    <!-- Redacted lines (Anti-copy feel) -->
    <rect x="120" y="36" width="160" height="14" rx="4" fill="#06b6d4" fill-opacity="0.7"/>
    <rect x="120" y="62" width="130" height="12" rx="4" fill="#4b5563"/>
    <rect x="120" y="86" width="145" height="12" rx="4" fill="#4b5563"/>
    
    <!-- Censored strip (black bar) -->
    <rect x="120" y="112" width="90" height="14" rx="3" fill="#111827" stroke="#e11d48" stroke-width="1.5"/>
    <text x="130" y="123" font-family="system-ui, sans-serif" font-size="9" font-weight="900" fill="#f43f5e" letter-spacing="1">CENSURADO</text>
    
    <!-- MRZ Bar at bottom -->
    <rect x="24" y="150" width="272" height="26" rx="4" fill="#0f172a" stroke="#374151" stroke-width="1"/>
    <line x1="34" y1="158" x2="286" y2="158" stroke="#64748b" stroke-width="2" stroke-dasharray="6,4"/>
    <line x1="34" y1="168" x2="250" y2="168" stroke="#64748b" stroke-width="2" stroke-dasharray="6,4"/>
    
    <!-- Anti-AI Wave Lines Overlay -->
    <path d="M 0 60 Q 80 110 160 60 T 320 60" fill="none" stroke="url(#waveGrad)" stroke-width="6" stroke-linecap="round"/>
    <path d="M 0 100 Q 80 150 160 100 T 320 100" fill="none" stroke="url(#waveGrad)" stroke-width="6" stroke-linecap="round"/>
    <path d="M 0 140 Q 80 190 160 140 T 320 140" fill="none" stroke="url(#waveGrad)" stroke-width="6" stroke-linecap="round"/>
  </g>

  <!-- Central Security Shield Emblem -->
  <g transform="translate(256, 360)">
    <circle cx="0" cy="0" r="54" fill="#030712" stroke="#06b6d4" stroke-width="4"/>
    <!-- Lock icon inside -->
    <path d="M -16 6 L -16 -4 C -16 -14 16 -14 16 -4 L 16 6 Z" fill="none" stroke="#ec4899" stroke-width="5" stroke-linecap="round"/>
    <rect x="-24" y="6" width="48" height="36" rx="8" fill="url(#shieldGrad)"/>
    <circle cx="0" cy="22" r="5" fill="#ffffff"/>
    <path d="M -2 24 L -3 32 L 3 32 L 2 24 Z" fill="#ffffff"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');

// Function to generate a valid uncompressed PNG file of arbitrary width & height
// with a stylish dark background and security pattern colors
function createSimplePng(width: number, height: number, isMaskable = false): Buffer {
  // Construct raw RGBA buffer
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  
  const cx = width / 2;
  const cy = height / 2;
  const safeRadius = Math.min(width, height) * (isMaskable ? 0.38 : 0.44);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base background: Dark navy-slate
      let r = 10;
      let g = 15;
      let b = 25;
      let a = 255;

      // Shield / Card area
      const inCard = Math.abs(dx) < width * 0.32 && Math.abs(dy) < height * 0.22;
      if (inCard) {
        r = 30;
        g = 41;
        b = 59;
      }

      // Sine wave anti-copy ripples
      const wave = Math.sin((x / width) * 12 + (y / height) * 6);
      if (Math.abs(wave) < 0.15 && dist < safeRadius * 1.05) {
        // Cyan-magenta gradient wave
        const t = x / width;
        r = Math.floor(6 + t * (236 - 6));
        g = Math.floor(182 - t * 100);
        b = Math.floor(212 - t * (212 - 153));
      }

      // Security emblem ring
      const emblemDist = Math.sqrt(dx * dx + (dy - height * 0.18) * (dy - height * 0.18));
      if (Math.abs(emblemDist - width * 0.1) < width * 0.015) {
        r = 6;
        g = 182;
        b = 212; // Cyan ring
      } else if (emblemDist < width * 0.08) {
        r = 236;
        g = 72;
        b = 153; // Magenta center
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Deflate compressed data
  const compressed = zlib.deflateSync(rawData);

  // Helper to compute CRC32
  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcVal = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Compression Deflate
  ihdr[11] = 0; // Filter None
  ihdr[12] = 0; // No Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Write the required PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createSimplePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createSimplePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createSimplePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createSimplePng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createSimplePng(48, 48, false));

console.log('PWA icons created successfully in public directory!');
