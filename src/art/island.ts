import type { CaptainLook } from '../core/save';
import { HAIR_COLOURS, OUTFITS, SKINS } from './captain';

type RGB = [number, number, number];
type Colour = string | RGB;

function hash2(x: number, y: number): number {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
function vnoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number): number {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < 4; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2;
    a *= 0.5;
  }
  return s;
}
const hex = (c: string): RGB => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number): RGB => {
  const A = hex(a), B = hex(b);
  return [0, 1, 2].map((k) => Math.round(A[k]! + (B[k]! - A[k]!) * t)) as RGB;
};

function sprite(rows: string[], pal: Record<string, string>, outline = '#1b1410'): HTMLCanvasElement {
  const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
  const c = document.createElement('canvas');
  c.width = w + 2;
  c.height = h + 2;
  const x = c.getContext('2d')!;
  const at = (i: number, j: number) => !!rows[j]?.[i] && rows[j]![i] !== '.';
  x.fillStyle = outline;
  for (let j = -1; j <= h; j++)
    for (let i = -1; i <= w; i++) if (!at(i, j) && (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1))) x.fillRect(i + 1, j + 1, 1, 1);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++)
      if (at(i, j)) {
        x.fillStyle = pal[rows[j]![i]!] ?? '#ff00ff';
        x.fillRect(i + 1, j + 1, 1, 1);
      }
  return c;
}

function canopy(clumps: [number, number, number][], pal: string[], size: number, seed: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const x = c.getContext('2d')!;
  const inside = new Uint8Array(size * size);
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      let best = -1e9, bdx = 0, bdy = 0, br = 1;
      for (const [cx, cy, r] of clumps) {
        const dx = i - cx, dy = j - cy, m = r - Math.hypot(dx, dy);
        if (m > best) {
          best = m;
          bdx = dx;
          bdy = dy;
          br = r;
        }
      }
      if (best < 0) continue;
      inside[j * size + i] = 1;
      const light = -(bdx * 0.6 + bdy * 0.85) / br + (hash2(i + seed, j) - 0.5) * 0.35;
      x.fillStyle = light > 0.45 ? pal[0]! : light > -0.05 ? pal[1]! : light > -0.5 ? pal[2]! : pal[3]!;
      x.fillRect(i, j, 1, 1);
    }
  x.fillStyle = pal[4]!;
  const n = (a: number, b: number) => a >= 0 && b >= 0 && a < size && b < size && inside[b * size + a] === 1;
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) if (!inside[j * size + i] && (n(i - 1, j) || n(i + 1, j) || n(i, j - 1) || n(i, j + 1))) x.fillRect(i, j, 1, 1);
  return c;
}

const LEAF = ['#b4d97a', '#7fae52', '#5a8a3c', '#3f6b2e', '#24401c'];

function miniCaptain(look?: CaptainLook): HTMLCanvasElement {
  const skin = look ? SKINS[look.skin % SKINS.length]! : '#f0c49a';
  const hair = look ? HAIR_COLOURS[look.hairColour % HAIR_COLOURS.length]! : '#5a3a22';
  const outfit = look ? OUTFITS[look.outfit % OUTFITS.length]! : '#3c7bd9';
  const hat = look && look.hair % 3 === 0 ? OUTFITS[look.colour % OUTFITS.length]! : hair;
  return sprite(['..rrrr..', '.rrrrrr.', '.hsssh..', '.skssk..', '..sss...', '.bbbbbb.', 'sbbbbbbs', '..bbbb..', '..p..p..', '.kk..kk.'], {
    r: hat,
    h: hair,
    s: skin,
    k: '#1b1b1b',
    b: outfit,
    p: '#2b2f4a',
  });
}

/** The signed-off home Island (island-sample v2), sized to the screen. Returns a stop function. */
export function drawHomeIsland(view: HTMLCanvasElement, look?: CaptainLook): () => void {
  const rect = { w: view.clientWidth || innerWidth, h: view.clientHeight || innerHeight };
  const W = 320;
  const H = Math.max(200, Math.min(480, Math.round((W * rect.h) / rect.w)));
  const S = Math.max(1, Math.ceil(rect.w / W));
  view.width = W * S;
  view.height = H * S;
  const vctx = view.getContext('2d')!;
  vctx.imageSmoothingEnabled = false;
  const lo = document.createElement('canvas');
  lo.width = W;
  lo.height = H;
  const g = lo.getContext('2d')!;
  g.imageSmoothingEnabled = false;

  const CX = 158, CY = Math.round(H * 0.49), RX = 122, RY = Math.round(Math.min(H * 0.37, 74 + (H - 200) * 0.25));
  const PLATEAU = 0.4, CLIFF = 10;
  const hgt = new Float32Array(W * H), plat = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const e = Math.hypot((x - CX) / RX, (y - CY) / RY);
      const h = 1 - e + (fbm(x / 46, y / 46) - 0.47) * 0.62;
      hgt[y * W + x] = h;
      plat[y * W + x] = h > 0.12 && h + (CY - y) / (RY * 3.5) > PLATEAU ? 1 : 0;
    }
  const H_ = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : hgt[y * W + x]!);
  const P_ = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : plat[y * W + x]!);
  const cliffRow = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (P_(x, y)) continue;
      for (let k = 1; k <= CLIFF + 2; k++)
        if (P_(x, y - k)) {
          cliffRow[y * W + x] = k;
          break;
        }
    }

  const STAIR_X = CX - 18;
  let dock = { x: CX + 26, y: CY + 60 };
  for (let y = H - 1; y > CY; y--)
    if (H_(CX + 26, y) >= 0) {
      dock = { x: CX + 26, y };
      break;
    }
  let stairBottom = CY;
  for (let y = 0; y < H; y++)
    if (cliffRow[y * W + STAIR_X] === CLIFF) {
      stairBottom = y;
      break;
    }
  const pathPts: [number, number][] = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120, ax = STAIR_X + 3, ay = stairBottom + 1, bx = dock.x + 3, by = dock.y - 4, mx = (ax + bx) / 2 - 10, my = Math.max(ay, by) + 14;
    pathPts.push([(1 - t) * (1 - t) * ax + 2 * (1 - t) * t * mx + t * t * bx, (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * my + t * t * by]);
  }
  const onPath = new Uint8Array(W * H);
  for (const [px, py] of pathPts)
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const r = Math.hypot(dx, dy) + hash2(px + dx, py + dy) * 1.2;
        const X = Math.round(px + dx), Y = Math.round(py + dy);
        if (r < 3.2 && X >= 0 && Y >= 0 && X < W && Y < H) onPath[Y * W + X] = r < 2.3 ? 2 : 1;
      }

  const base = g.createImageData(W, H), bd = base.data;
  const water: number[] = [];
  const put = (i: number, c: Colour) => {
    const [r, gg, b] = typeof c === 'string' ? hex(c) : c;
    bd[i * 4] = r;
    bd[i * 4 + 1] = gg;
    bd[i * 4 + 2] = b;
    bd[i * 4 + 3] = 255;
  };

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x, h = hgt[i]!, r = hash2(x, y), cr = cliffRow[i]!;
      if (cr && cr <= CLIFF) {
        if (x >= STAIR_X && x < STAIR_X + 7) {
          put(i, cr % 2 ? '#d8b98a' : '#a88358');
          continue;
        }
        const strata = vnoise(x / 3, cr * 1.7);
        let c = cr === 1 ? '#d9a46a' : cr < 4 ? '#b07a4a' : cr < CLIFF ? '#8c5c37' : '#5e3d26';
        if (strata > 0.72 && cr > 1) c = '#c48c56';
        if (hash2(x, 7) < 0.18 && cr > 1) c = '#6e4729';
        put(i, c);
        continue;
      }
      if (P_(x, y)) {
        let c = vnoise(x / 9 + 40, y / 9) > 0.56 ? '#6cb84d' : '#7fca5c';
        if (r < 0.09) c = '#5aa443';
        if (r > 0.994) c = ['#ffd75e', '#ff8fb1', '#ffffff'][Math.floor(r * 1000) % 3]!;
        if (!P_(x, y + 1)) c = '#a6e07a';
        else if (!P_(x - 1, y) || !P_(x + 1, y) || !P_(x, y - 1)) c = '#4f9a3c';
        if (x >= STAIR_X && x < STAIR_X + 7 && !P_(x, y + 2)) c = '#d8b98a';
        put(i, c);
        continue;
      }
      if (h >= 0.07) {
        let c: Colour = vnoise(x / 10 + 90, y / 10) > 0.58 ? '#5aa443' : '#6dbb4f';
        if (r < 0.08) c = '#4f9a3c';
        if (r > 0.995) c = ['#ffd75e', '#ffffff'][Math.floor(r * 1000) % 2]!;
        if (cr > CLIFF) c = cr === CLIFF + 1 ? '#3f7d31' : '#4a8f3a';
        if (onPath[i]) c = onPath[i] === 2 ? (r < 0.15 ? '#b3864c' : '#c79a5e') : '#9c7a45';
        if (h < 0.085) c = mix(c, '#ecd59a', 0.5);
        put(i, c);
        continue;
      }
      if (h >= 0) {
        let c = r < 0.08 ? '#d6bb7c' : '#ecd59a';
        if (h < 0.018) c = r < 0.1 ? '#c4a56c' : '#d8bd80';
        if (onPath[i]) c = '#d1b077';
        put(i, c);
        continue;
      }
      let c: Colour;
      if (h > -0.07) {
        const t = (h + 0.07) / 0.07;
        c = mix('#2f7fc8', '#62d3d6', Math.pow(t, 1.3));
        const rip = Math.sin(x * 0.45 + y * 0.25 + vnoise(x / 7, y / 7) * 7);
        if (rip > 0.86 && t > 0.3) c = mix('#62d3d6', '#b9f1e6', t * 0.7);
      } else {
        c = vnoise(x / 14, y / 9) > 0.55 ? '#2659a8' : '#2a63b8';
        if (h < -0.35) c = '#22519c';
      }
      put(i, c);
      water.push(i);
    }

  const trunk = sprite(['tTt', 'tTt', 'tTt', 'ttT', 'tTt', 'Ttt', 'tTt', 'tTtt', 'ttTt'], { t: '#efe9db', T: '#b5ab98' }, '#3b2f2a');
  const makeTree = (seed: number) => {
    const r = (k: number) => hash2(seed, k);
    return canopy([[13, 13, 8 + r(1) * 2], [6, 15, 5 + r(2) * 2], [20, 15, 5 + r(3) * 2], [9, 8, 5 + r(4) * 2], [17, 8, 5 + r(5) * 2]], LEAF, 27, seed);
  };
  const bushCanopy = canopy([[6, 6, 5], [3, 7, 3], [9, 7, 3]], ['#9fd36e', '#6eae4a', '#4f8a36', '#3a6a2a', '#203a18'], 13, 7);
  const hut = sprite(
    ['.......RRRRRRRR.......', '.....RRrrrrrrrrRR.....', '...RRrrrrrrrrrrrrRR...', '.RRrrrrrrrrrrrrrrrrRR.', 'RrrrrrrrrrrrrrrrrrrrrR', 'RRRRRRRRRRRRRRRRRRRRRR', '.WwwwwwwwwwwwwwwwwwwW.', '.WwgggwwwwddwwwwgggwW.', '.WwgGgwwwwddwwwwgGgwW.', '.WwgggwwwwddwwwwgggwW.', '.WwwwwwwwwddwwwwwwwwW.', '.WwwwwwwwwddwwwwwwwwW.', '.ssssssssssssssssssss.'],
    { R: '#8e3a27', r: '#c95a3d', W: '#a5784a', w: '#d9b07a', g: '#ffe58a', G: '#fff6c8', d: '#6b4329', s: '#8d8a85' },
  );
  const player = miniCaptain(look);
  const boat = sprite(['......r......', '......w......', '......ww.....', '......www....', '......wwww...', '......wwwww..', '......w......', 'bbbbbbbbbbbbb', '.BbbbbbbbbbB.', '..BBBBBBBBB..'], { w: '#f4f1e8', b: '#b0603a', B: '#7a3b1f', r: '#d9443b' });
  const crab = [sprite(['r.r.r', '.rrr.', 'r.r.r'], { r: '#e0583a' }), sprite(['.r.r.', 'rrrrr', '.r.r.'], { r: '#e0583a' })];
  const rock = (w: number, h: number, seed: number) => {
    const c = document.createElement('canvas');
    c.width = w + 2;
    c.height = h + 2;
    const x = c.getContext('2d')!;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const dx = (i - (w - 1) / 2) / (w / 2), dy = (j - (h - 1) / 2) / (h / 2), d = dx * dx + dy * dy;
        if (d > 1) continue;
        const l = -(dx * 0.6 + dy * 0.8) + (hash2(i + seed, j) - 0.5) * 0.3;
        x.fillStyle = d > 0.75 ? '#3a3633' : l > 0.35 ? '#d6d1c7' : l > -0.2 ? '#a7a196' : '#77716a';
        x.fillRect(i + 1, j + 1, 1, 1);
      }
    return c;
  };

  type Obj = { y: number; draw: (t: number) => void; rockInWater?: boolean; x?: number };
  const objects: Obj[] = [];
  const free = new Uint8Array(W * H);
  const okSpot = (x: number, y: number, pad: number, needPlat?: number) => {
    for (let dy = -pad; dy <= 1; dy++)
      for (let dx = -pad; dx <= pad; dx++) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= W || Y >= H) return false;
        const i = Y * W + X;
        if (free[i] || onPath[i] || cliffRow[i] || hgt[i]! < 0.09) return false;
        if (needPlat !== undefined && P_(X, Y) !== needPlat) return false;
      }
    return true;
  };
  const claim = (x: number, y: number, pad: number) => {
    for (let dy = -pad * 2; dy <= pad; dy++)
      for (let dx = -pad; dx <= pad; dx++) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < W && Y < H) free[Y * W + X] = 1;
      }
  };

  let hutPos: { x: number; y: number } | null = null;
  for (let t = 0.45; t < 0.95 && !hutPos; t += 0.02) {
    const [px, py] = pathPts[Math.round(t * 120)]!;
    for (const off of [-16, 16]) {
      const hx = Math.round(px + off), hy = Math.round(py - 6);
      if (okSpot(hx, hy, 12, 0) && okSpot(hx, hy - 8, 10, 0)) {
        hutPos = { x: hx, y: hy };
        break;
      }
    }
  }
  if (!hutPos) {
    let best = 1e9;
    for (let y = CY; y < H - 10; y += 2)
      for (let x = 20; x < W - 20; x += 2) {
        if (!okSpot(x, y, 12, 0) || !okSpot(x, y - 8, 10, 0)) continue;
        const d = Math.hypot(x - (dock.x - 30), y - (dock.y - 22));
        if (d < best) {
          best = d;
          hutPos = { x, y };
        }
      }
  }
  if (hutPos) {
    const hp = hutPos;
    claim(hp.x, hp.y, 13);
    objects.push({ y: hp.y, draw: () => { g.fillStyle = 'rgba(20,40,20,.28)'; g.fillRect(hp.x - 11, hp.y, 24, 2); g.drawImage(hut, hp.x - 12, hp.y - 13); } });
    objects.push({ y: hp.y + 4, draw: (t) => g.drawImage(player, hp.x + 2, hp.y - 6 + (Math.floor(t / 500) % 2)) });
  }

  let grassPos: { x: number; y: number } | null = null;
  for (let y = CY - 30; y < CY && !grassPos; y += 2)
    for (let x = CX - 5; x < CX + 60; x += 3)
      if (okSpot(x, y, 9, 1)) {
        grassPos = { x, y };
        break;
      }
  if (grassPos) {
    const gp = grassPos;
    claim(gp.x, gp.y, 9);
    objects.push({
      y: gp.y,
      draw: (t) => {
        const hop = Math.floor(t / 220) % 2;
        for (let k = 0; k < 26; k++) {
          const gx = gp.x - 8 + Math.floor(hash2(k, 1) * 17), gy = gp.y - Math.floor(hash2(k, 2) * 6);
          const sway = k < 9 && hop ? 1 : 0;
          g.fillStyle = '#2f6b26';
          g.fillRect(gx + sway, gy - 5, 1, 5);
          g.fillStyle = '#4f9a3c';
          g.fillRect(gx + sway + 1, gy - 4, 1, 4);
        }
        const by = gp.y - 17 - hop;
        g.fillStyle = '#0b0f22';
        g.fillRect(gp.x - 3, by - 1, 7, 10);
        g.fillStyle = '#ffffff';
        g.fillRect(gp.x - 2, by, 5, 8);
        g.fillStyle = '#d9443b';
        g.fillRect(gp.x, by + 1, 1, 4);
        g.fillRect(gp.x, by + 6, 1, 1);
      },
    });
  }

  const groves: [number, number, number][] = [[CX - 80, CY - 20, 22], [CX + 70, CY - 30, 16], [CX - 40, CY + 40, 12], [CX + 85, CY + 25, 10]];
  const nearCliff = (x: number, y: number) => {
    for (let dy = -30; dy <= 5; dy++)
      for (let dx = -8; dx <= 8; dx++) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < W && Y < H && cliffRow[Y * W + X] && cliffRow[Y * W + X]! <= CLIFF) return true;
      }
    return false;
  };
  for (let n = 0, tries = 0; n < 12 && tries < 6000; tries++) {
    const gv = groves[tries % groves.length]!;
    const x = Math.round(gv[0] + (hash2(tries, 11) - 0.5) * 2 * gv[2] * 1.6), y = Math.round(gv[1] + (hash2(tries, 12) - 0.5) * 2 * gv[2]);
    if (!okSpot(x, y, 7) || nearCliff(x, y)) continue;
    claim(x, y, 8);
    n++;
    const frame = makeTree(tries);
    objects.push({
      y,
      draw: (t) => {
        g.fillStyle = 'rgba(16,40,20,.30)';
        g.beginPath();
        g.ellipse(x + 3, y + 1, 11, 3.5, 0, 0, Math.PI * 2);
        g.fill();
        g.drawImage(trunk, x - 2, y - 10);
        const sway = Math.floor((t + hash2(x, y) * 2000) / 700) % 2;
        g.drawImage(frame, x - 13 + sway, y - 32);
      },
    });
  }
  for (let n = 0, tries = 0; n < 12 && tries < 3000; tries++) {
    const x = Math.floor(hash2(tries, 21) * W), y = Math.floor(hash2(tries, 22) * H);
    if (!okSpot(x, y, 4)) continue;
    claim(x, y, 4);
    n++;
    const berries = hash2(tries, 23) > 0.5;
    objects.push({
      y,
      draw: () => {
        g.fillStyle = 'rgba(16,40,20,.28)';
        g.fillRect(x - 5, y, 11, 2);
        g.drawImage(bushCanopy, x - 6, y - 11);
        if (berries) {
          g.fillStyle = '#e04a5a';
          g.fillRect(x - 2, y - 7, 1, 1);
          g.fillRect(x + 2, y - 5, 1, 1);
          g.fillRect(x, y - 9, 1, 1);
        }
      },
    });
  }
  for (let n = 0, tries = 0; n < 9 && tries < 3000; tries++) {
    const x = Math.floor(hash2(tries, 31) * W), y = Math.floor(hash2(tries, 32) * H);
    const h = H_(x, y);
    if (h > 0.05 || h < -0.06 || free[y * W + x]) continue;
    n++;
    const rk = rock(5 + Math.floor(hash2(tries, 33) * 4), 4 + Math.floor(hash2(tries, 34) * 2), tries);
    objects.push({ y, draw: () => g.drawImage(rk, x - 3, y - 3), rockInWater: h < 0, x });
  }
  objects.push({
    y: dock.y + 14,
    draw: (t) => {
      for (let k = 0; k < 24; k++) {
        g.fillStyle = k % 3 === 0 ? '#7a4f2c' : '#a8754a';
        g.fillRect(dock.x, dock.y - 4 + k, 8, 1);
      }
      g.fillStyle = '#5a3a20';
      for (const [px, py] of [[-1, 6], [8, 6], [-1, 16], [8, 16]] as const) g.fillRect(dock.x + px, dock.y + py, 1, 5);
      const bob = Math.round(Math.sin(t / 450));
      g.fillStyle = 'rgba(10,30,60,.35)';
      g.fillRect(dock.x + 10, dock.y + 20 + bob, 15, 2);
      g.drawImage(boat, dock.x + 10, dock.y + 9 + bob);
    },
  });
  objects.sort((a, b) => a.y - b.y);

  let crabHome: { x: number; y: number } | null = null;
  for (let x = CX - 90; x < CX + 40 && !crabHome; x += 2)
    for (let y = CY + 30; y < H; y++) {
      const h = H_(x, y);
      if (h >= 0.02 && h < 0.05) {
        crabHome = { x, y };
        break;
      }
    }

  const frame = g.createImageData(W, H), fd = frame.data;
  const gulls = [{ x: -20, y: H * 0.2, v: 0.35 }, { x: 120, y: H * 0.13, v: 0.28 }];
  const clouds = [{ x: 40, y: H * 0.25, rx: 60, ry: 22, v: 0.06 }, { x: 250, y: H * 0.75, rx: 75, ry: 26, v: 0.05 }];
  const leaves = Array.from({ length: 7 }, (_, k) => ({ x: hash2(k, 91) * W, y: hash2(k, 92) * H, p: hash2(k, 93) * 6 }));
  let lastWater = -1e9;

  const drawWater = (t: number) => {
    fd.set(bd);
    const ph = t * 0.0016;
    for (const i of water) {
      const x = i % W, y = (i / W) | 0, h = hgt[i]!;
      const f = h + 0.012 + 0.009 * Math.sin(ph + vnoise(x / 8, y / 8) * 5);
      let c: RGB | null = null;
      if (f > -0.004 && f < 0.004) c = [234, 248, 255];
      else if (f > -0.02 && f < -0.014 && hash2(x, y) > 0.35) c = [178, 232, 236];
      else if (h < -0.07) {
        const v = Math.sin(x * 0.22 + Math.floor(y / 2) * 1.7 + t * 0.0012 + vnoise(x / 16, y / 6) * 6);
        if (v > 0.985) c = [96, 146, 218];
      }
      if (c) {
        fd[i * 4] = c[0];
        fd[i * 4 + 1] = c[1];
        fd[i * 4 + 2] = c[2];
      }
    }
  };

  let raf = 0;
  const render = (t: number) => {
    if (t - lastWater > 110) {
      drawWater(t);
      lastWater = t;
    }
    g.putImageData(frame, 0, 0);
    for (let k = 0; k < 5; k++) {
      const sx = Math.floor(hash2(k, Math.floor(t / 300)) * W), sy = Math.floor(hash2(k + 9, Math.floor(t / 300)) * H);
      if (H_(sx, sy) < -0.1) {
        g.fillStyle = '#ffffff';
        g.fillRect(sx, sy, 1, 1);
        g.fillStyle = 'rgba(255,255,255,.5)';
        g.fillRect(sx - 1, sy, 3, 1);
        g.fillRect(sx, sy - 1, 1, 3);
      }
    }
    for (const o of objects)
      if (o.rockInWater && Math.floor(t / 500) % 2) {
        g.fillStyle = 'rgba(234,248,255,.8)';
        g.fillRect(o.x! - 4, o.y + 2, 9, 1);
      }
    if (crabHome) {
      const span = 14, p = (t / 40) % (span * 2), dx = p < span ? p : span * 2 - p;
      g.drawImage(crab[Math.floor(t / 150) % 2]!, Math.round(crabHome.x + dx - 7), crabHome.y - 2);
    }
    for (const o of objects) o.draw(t);
    g.fillStyle = '#9fd36e';
    for (const l of leaves) {
      const lx = (l.x + t * 0.01) % W, ly = (l.y + t * 0.006 + Math.sin(t / 500 + l.p) * 3) % H;
      g.fillRect(lx | 0, ly | 0, 1 + (Math.floor(t / 300 + l.p) % 2), 1);
    }
    g.fillStyle = 'rgba(10,20,50,.13)';
    for (const c of clouds) {
      const cx = ((c.x + (t * c.v) / 16) % (W + 160)) - 80;
      g.beginPath();
      g.ellipse(cx, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
      g.ellipse(cx + c.rx * 0.6, c.y - 8, c.rx * 0.6, c.ry * 0.8, 0, 0, Math.PI * 2);
      g.fill();
    }
    for (const gl of gulls) {
      const gx = ((gl.x + (t * gl.v) / 16) % (W + 40)) - 20, flap = Math.floor(t / 180) % 2;
      g.fillStyle = 'rgba(10,20,40,.25)';
      g.fillRect((gx + 12) | 0, (gl.y + 22) | 0, 5, 1);
      g.fillStyle = '#ffffff';
      if (flap) {
        g.fillRect(gx | 0, gl.y | 0, 2, 1);
        g.fillRect((gx + 3) | 0, gl.y | 0, 2, 1);
        g.fillRect((gx + 2) | 0, (gl.y + 1) | 0, 1, 1);
      } else {
        for (const [dx, dy] of [[0, -1], [1, 0], [2, 1], [3, 0], [4, -1]] as const) g.fillRect((gx + dx) | 0, (gl.y + dy) | 0, 1, 1);
      }
    }
    const lg = g.createLinearGradient(0, 0, W, H);
    lg.addColorStop(0, 'rgba(255,214,140,.14)');
    lg.addColorStop(0.55, 'rgba(255,214,140,0)');
    lg.addColorStop(1, 'rgba(30,20,80,.18)');
    g.fillStyle = lg;
    g.fillRect(0, 0, W, H);
    const rg = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(1, 'rgba(5,8,30,.45)');
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
    vctx.drawImage(lo, 0, 0, W * S, H * S);
    raf = requestAnimationFrame(render);
  };
  raf = requestAnimationFrame(render);
  return () => cancelAnimationFrame(raf);
}
