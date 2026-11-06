import { DRAWN as BASE } from './drawn';
import { COMMA } from './drawn/comma';
import { TWOTIDE } from './drawn/twotide';
import { BLUSTER } from './drawn/bluster';
import { MANGROVES } from './drawn/mangroves';
import { PEAKS } from './drawn/peaks';
import { REDPEN } from './drawn/redpen';

const DRAWN = { ...BASE, ...COMMA, ...TWOTIDE, ...BLUSTER, ...MANGROVES, ...PEAKS, ...REDPEN };
import type { Variant } from '../core/save';
import { hash, makeSprite, type SpriteDef } from './sprite';

const HUES = [8, 28, 45, 95, 140, 175, 200, 225, 265, 300, 330];

/** A stand-in creature drawn from its id until its hand-made art lands. Symmetrical, so it reads as a creature. */
function generated(id: string, evolved: boolean): SpriteDef {
  const r = hash(id);
  const hue = HUES[r % HUES.length]!;
  const pal = {
    o: `hsl(${hue} 55% 38%)`,
    b: `hsl(${hue} 60% 55%)`,
    l: `hsl(${(hue + 30) % 360} 70% 78%)`,
    a: `hsl(${(hue + 180) % 360} 70% 60%)`,
    k: '#111111',
    w: '#ffffff',
  };
  const size = evolved ? 16 : 12;
  const half = size / 2;
  const rows: string[] = [];
  const ears = (r >> 4) % 3;
  for (let y = 0; y < size; y++) {
    let row = '';
    for (let x = 0; x < half; x++) {
      const dx = (half - x - 0.5) / half;
      const dy = (y - size * 0.58) / (size * 0.42);
      const inside = dx * dx + dy * dy < 1;
      let ch = '.';
      if (inside) ch = dy > 0.15 && dx < 0.5 ? 'l' : dx > 0.75 || dy > 0.8 ? 'o' : 'b';
      if (!inside && ears === 0 && y < size * 0.3 && x > half * 0.3 && x < half * 0.6) ch = 'o';
      if (!inside && ears === 1 && y < size * 0.25 && y > 0 && x === Math.floor(half * 0.4)) ch = 'a';
      if (!inside && ears === 2 && y > size * 0.4 && y < size * 0.75 && x < 1) ch = 'a';
      const eyeY = Math.floor(size * 0.45);
      const eyeX = Math.floor(half * 0.45);
      if (y === eyeY && x === eyeX) ch = 'w';
      if (y === eyeY + 1 && x === eyeX) ch = 'k';
      row += ch;
    }
    rows.push(row + [...row].reverse().join(''));
  }
  return { pal, rows };
}

export interface CreatureLook {
  scale: number;
  evolved?: boolean;
  /** Which version to draw. Defaults to plain. */
  variant?: Variant;
  /** Older callers: the same as `variant: 'shiny'`. */
  shiny?: boolean;
  flip?: boolean;
}

export function creatureCanvas(id: string, opts: CreatureLook): HTMLCanvasElement {
  const drawn = DRAWN[id];
  const def = drawn ? ((opts.evolved && drawn.evolved) || drawn.base) : generated(id, !!opts.evolved);
  const scale = drawn && opts.evolved && !drawn.evolved ? Math.round(opts.scale * 1.3) : opts.scale;
  const variant = opts.variant ?? (opts.shiny ? 'shiny' : 'plain');
  const flip = opts.flip ? { flip: true } : {};
  switch (variant) {
    case 'plain':
      return makeSprite(def, scale, flip);
    case 'shiny':
      return makeSprite(def, scale, { pal: drawn?.shiny ?? shinyOf(def), ...flip });
    case 'golden':
      return makeSprite(def, scale, { pal: goldenOf(def), ...flip });
    case 'champion':
      return makeSprite(crowned(def), scale, flip);
  }
}

export function shinyOf(def: SpriteDef): Record<string, string> {
  return { b: '#f2c14e', o: '#a8792a', l: '#fff4c2', ...(def.pal.a ? { a: '#ffffff' } : {}) };
}

/** Darkest to brightest. */
const GOLD_RAMP = ['#6b4a12', '#9a6a1c', '#c79428', '#e8b93a', '#f7d76a', '#fff2b8'];
/** The eyes keep their own colours, so a golden Creature still looks back at you. */
const EYES = new Set(['k', 'w']);

/**
 * The golden variant: every colour but the eyes moved onto a gold ramp by how light it is. The lightest and darkest
 * colours of the Creature land at the ends of the ramp, so its shading still reads. The outline is drawn separately.
 */
export function goldenOf(def: SpriteDef): Record<string, string> {
  const keys = Object.keys(def.pal).filter((k) => !EYES.has(k));
  const lum = new Map(keys.map((k) => [k, luminance(def.pal[k]!)]));
  const values = [...lum.values()];
  const lo = Math.min(...values);
  const span = Math.max(...values) - lo || 1;
  return Object.fromEntries(keys.map((k) => [k, GOLD_RAMP[Math.round(((lum.get(k)! - lo) / span) * (GOLD_RAMP.length - 1))]!]));
}

/** Relative lightness from 0 to 1 of a `#rrggbb` or `hsl(h s% l%)` colour. */
export function luminance(colour: string): number {
  const hex = /^#([0-9a-f]{6})$/i.exec(colour);
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }
  const hsl = /^hsl\(\s*[\d.]+\s+[\d.]+%\s+([\d.]+)%\s*\)$/i.exec(colour);
  return hsl ? Number(hsl[1]) / 100 : 0.5;
}

/** Crown pixels: gold, a darker gold band, and red jewels. */
const CROWN = ['1.3.1', '11111', '21312'];
const CROWN_PAL = { '1': '#f7c948', '2': '#b07d1e', '3': '#e8423a' };

/**
 * The champion variant: the Creature in its own colours with a small pixel crown on its head. The crown is centred on
 * the widest row in the top part of the Creature, so thin ears and antennae don't pull it sideways, and sits on the
 * highest pixel beneath it. The sprite grows to fit the crown, so nothing is cut off.
 */
export function crowned(def: SpriteDef): SpriteDef {
  const crownWidth = CROWN[0]!.length;
  const width = Math.max(...def.rows.map((r) => r.length));
  const runs = def.rows.map(widestRun).filter((run) => run.length > 0);
  const top = runs.slice(0, Math.max(1, Math.ceil(runs.length * 0.4)));
  const head = top.reduce((best, run) => (run.length > best.length ? run : best), top[0] ?? { start: 0, length: width });
  const left = Math.max(0, Math.round(head.start + head.length / 2 - crownWidth / 2));
  const pad = Math.max(0, left + crownWidth - width);
  const rows = def.rows.map((r) => r.padEnd(width + pad, '.'));
  const under = rows.findIndex((r) => /[^.]/.test(r.slice(left, left + crownWidth)));
  const seat = under === -1 ? rows.length : under;
  const lift = Math.max(0, CROWN.length - seat);
  const blank = '.'.repeat(width + pad);
  const out = [...Array.from({ length: lift }, () => blank), ...rows];
  CROWN.forEach((c, i) => {
    const j = seat + lift - CROWN.length + i;
    const row = out[j]!;
    out[j] = row.slice(0, left) + [...c].map((ch, k) => (ch === '.' ? row[left + k]! : ch)).join('') + row.slice(left + crownWidth);
  });
  return { pal: { ...def.pal, ...CROWN_PAL }, rows: out };
}

/** The longest run of drawn pixels in a row. */
function widestRun(row: string): { start: number; length: number } {
  let best = { start: 0, length: 0 };
  for (let i = 0; i < row.length; ) {
    if (row[i] === '.') {
      i++;
      continue;
    }
    let j = i;
    while (j < row.length && row[j] !== '.') j++;
    if (j - i > best.length) best = { start: i, length: j - i };
    i = j;
  }
  return best;
}
