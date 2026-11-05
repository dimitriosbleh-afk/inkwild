import { DRAWN as BASE } from './drawn';
import { COMMA } from './drawn/comma';
import { TWOTIDE } from './drawn/twotide';
import { BLUSTER } from './drawn/bluster';
import { MANGROVES } from './drawn/mangroves';
import { PEAKS } from './drawn/peaks';
import { REDPEN } from './drawn/redpen';

const DRAWN = { ...BASE, ...COMMA, ...TWOTIDE, ...BLUSTER, ...MANGROVES, ...PEAKS, ...REDPEN };
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

export function creatureCanvas(id: string, opts: { scale: number; evolved?: boolean; shiny?: boolean; flip?: boolean }): HTMLCanvasElement {
  const drawn = DRAWN[id];
  const def = drawn ? ((opts.evolved && drawn.evolved) || drawn.base) : generated(id, !!opts.evolved);
  const scale = drawn && opts.evolved && !drawn.evolved ? Math.round(opts.scale * 1.3) : opts.scale;
  const pal = opts.shiny ? (drawn?.shiny ?? shinyOf(def)) : undefined;
  return makeSprite(def, scale, { ...(pal ? { pal } : {}), ...(opts.flip ? { flip: true } : {}) });
}

function shinyOf(def: SpriteDef): Record<string, string> {
  return { b: '#f2c14e', o: '#a8792a', l: '#fff4c2', ...(def.pal.a ? { a: '#ffffff' } : {}) };
}
