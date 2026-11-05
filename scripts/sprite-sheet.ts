import { mkdirSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';
import { DRAWN as BASE } from '../src/art/drawn';
import { COMMA } from '../src/art/drawn/comma';
import { TWOTIDE } from '../src/art/drawn/twotide';
import { BLUSTER } from '../src/art/drawn/bluster';
import { MANGROVES } from '../src/art/drawn/mangroves';
import { PEAKS } from '../src/art/drawn/peaks';

const DRAWN = { ...BASE, ...COMMA, ...TWOTIDE, ...BLUSTER, ...MANGROVES, ...PEAKS };
import type { SpriteDef } from '../src/art/sprite';

/** Renders every hand-made Creature (base, evolved, shiny) into one PNG contact sheet, so art can be checked by eye. */
const SCALE = 6;
const CELL = 26 * SCALE;
const only = process.argv[2];
const ids = Object.keys(DRAWN).filter((id) => !only || only.split(',').includes(id));
const cols = 3;
const W = CELL * cols;
const H = CELL * ids.length;
const px = Buffer.alloc(W * H * 3);
const bg = [0x1f, 0x28, 0x50];
for (let i = 0; i < W * H; i++) px.set(bg, i * 3);

const rgb = (c: string) => {
  if (c.startsWith('hsl')) return [255, 0, 255];
  return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
};
function draw(def: SpriteDef, pal: Record<string, string>, ox: number, oy: number) {
  const rows = def.rows;
  const w = Math.max(...rows.map((r) => r.length));
  const at = (i: number, j: number) => {
    const ch = rows[j]?.[i];
    return ch && ch !== '.' ? ch : null;
  };
  const put = (i: number, j: number, c: number[]) => {
    for (let y = 0; y < SCALE; y++)
      for (let x = 0; x < SCALE; x++) {
        const X = ox + (i + 1) * SCALE + x, Y = oy + (j + 1) * SCALE + y;
        if (X >= 0 && Y >= 0 && X < W && Y < H) px.set(c, (Y * W + X) * 3);
      }
  };
  for (let j = -1; j <= rows.length; j++)
    for (let i = -1; i <= w; i++) if (!at(i, j) && (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1))) put(i, j, [0x0b, 0x0f, 0x22]);
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < w; i++) { const ch = at(i, j); if (ch) put(i, j, rgb(pal[ch] ?? '#ff00ff')); }
}
ids.forEach((id, row) => {
  const art = DRAWN[id]!;
  draw(art.base, art.base.pal, 0, row * CELL);
  if (art.evolved) draw(art.evolved, art.evolved.pal, CELL, row * CELL);
  draw(art.base, { ...art.base.pal, ...art.shiny }, CELL * 2, row * CELL);
});

const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr.set([8, 2, 0, 0, 0], 8);
mkdirSync(new URL('../.scratch/art/', import.meta.url), { recursive: true });
const out = new URL(`../.scratch/art/${only && !only.includes(',') ? only : 'sheet'}.png`, import.meta.url);
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(`wrote ${ids.length} creatures (columns: base, evolved, shiny) to ${out.pathname}`);
