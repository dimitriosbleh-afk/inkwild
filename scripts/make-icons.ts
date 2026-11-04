import { writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

const ROWS = [
  '................',
  '.....g..g..g....',
  '..g..q..q..q....',
  '...qqqqqqqqqg...',
  '.g.qnqnqnqnqq...',
  '..qnmnnmnnnnq...',
  '.qnnnnmnnnnssss.',
  '.qnmnnnnnnsswkss',
  '.qnnnnnmnnsskkss',
  '.qnnmnnnnnspsssss',
  '..qnnnnnnnnsss..',
  '..qnnnnmnnnnn...',
  '...nnnnnnnnnn...',
  '...ss..ss.ss....',
];
const PAL: Record<string, string> = { n: '#2f4a8a', m: '#4a68b0', q: '#1a2340', g: '#f2c14e', s: '#efcfa6', k: '#111111', w: '#ffffff', p: '#f28aa0', O: '#0b0f22' };
const rgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

function grid(): string[] {
  const w = 18, h = 18;
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  ROWS.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') g[j + 2]![i + 1] = ch; }));
  const filled = (i: number, j: number) => g[j]?.[i] !== undefined && g[j]![i] !== '.' && g[j]![i] !== 'O';
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (g[j]![i] === '.' && (filled(i - 1, j) || filled(i + 1, j) || filled(i, j - 1) || filled(i, j + 1))) g[j]![i] = 'O';
  return g.map((r) => r.join(''));
}

function png(size: number): Buffer {
  const art = grid();
  const cell = Math.floor((size * 0.78) / 18);
  const off = Math.floor((size - cell * 18) / 2);
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const ax = Math.floor((x - off) / cell), ay = Math.floor((y - off) / cell);
      const ch = art[ay]?.[ax];
      const border = x < size * 0.04 || y < size * 0.04 || x >= size * 0.96 || y >= size * 0.96;
      const bg = rgb('#1f2850');
      const [r, g, b] = border ? rgb('#f2c14e') : ch && ch !== '.' ? rgb(PAL[ch]!) : bg;
      raw.set([r!, g!, b!], y * (size * 3 + 1) + 1 + x * 3);
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [180, 192, 512]) writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), png(size));
console.log('icons written');
