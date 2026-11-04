export const OUTLINE = '#0b0f22';

export interface SpriteDef {
  pal: Record<string, string>;
  rows: string[];
}

/** Draws a pixel sprite with a 4-neighbour outline, as signed off in the visual sample. */
export function makeSprite(def: SpriteDef, scale: number, opts: { outline?: boolean; pal?: Record<string, string>; flip?: boolean } = {}): HTMLCanvasElement {
  const rows = def.rows;
  const pal = { ...def.pal, ...opts.pal };
  const w = Math.max(...rows.map((r) => r.length));
  const hgt = rows.length;
  const c = document.createElement('canvas');
  c.width = (w + 2) * scale;
  c.height = (hgt + 2) * scale;
  const x = c.getContext('2d')!;
  if (opts.flip) {
    x.translate(c.width, 0);
    x.scale(-1, 1);
  }
  const at = (i: number, j: number) => {
    const ch = rows[j]?.[i];
    return ch && ch !== '.' ? ch : null;
  };
  if (opts.outline !== false) {
    x.fillStyle = OUTLINE;
    for (let j = -1; j <= hgt; j++)
      for (let i = -1; i <= w; i++) {
        if (at(i, j)) continue;
        if (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1)) x.fillRect((i + 1) * scale, (j + 1) * scale, scale, scale);
      }
  }
  for (let j = 0; j < hgt; j++)
    for (let i = 0; i < w; i++) {
      const ch = at(i, j);
      if (!ch) continue;
      x.fillStyle = pal[ch] ?? '#ff00ff';
      x.fillRect((i + 1) * scale, (j + 1) * scale, scale, scale);
    }
  return c;
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
