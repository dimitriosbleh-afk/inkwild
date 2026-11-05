import { COVERED, HAIR_COLOURS, HAIRS, MINI_HEADS, OUTFITS, SKINS } from '../art/captain';
import type { CaptainLook } from '../core/save';
import type { Theme } from './themes';

type RGB = [number, number, number];
type Colour = string | RGB;
export type Dir = 'up' | 'down' | 'left' | 'right';
export type PoiKind = 'grass' | 'crew' | 'keeper' | 'boat' | 'sign' | 'hut' | 'board';

export interface Poi {
  kind: PoiKind;
  x: number;
  y: number;
  /** Shows a ! over it: something new is waiting here. */
  alert: boolean;
}

export interface SceneSetup {
  theme: Theme;
  look?: CaptainLook;
  crewLook?: CaptainLook;
  kinds: PoiKind[];
  grass: number;
  start?: { x: number; y: number };
}

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

function canopy(clumps: [number, number, number][], pal: readonly string[], size: number, seed: number): HTMLCanvasElement {
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

const PERSON = ['..rrrr..', '.rrrrrr.', '.hsssh..', '.skssk..', '..sss...', '.bbbbbb.', 'sbbbbbbs', '..bbbb..', '..p..p..', '.kk..kk.'];
const PERSON_STEP = ['..rrrr..', '.rrrrrr.', '.hsssh..', '.skssk..', '..sss...', '.bbbbbb.', 'sbbbbbbs', '..bbbb..', '..p..p..', '..kk.kk.'];
const PERSON_BACK = ['..rrrr..', '.rrrrrr.', '.hhhhh..', '.hhhhh..', '..hhh...', '.bbbbbb.', 'sbbbbbbs', '..bbbb..', '..p..p..', '.kk..kk.'];

function personPal(look?: CaptainLook) {
  const skin = look ? SKINS[look.skin % SKINS.length]! : '#f0c49a';
  const hair = look ? HAIR_COLOURS[look.hairColour % HAIR_COLOURS.length]! : '#5a3a22';
  const outfit = look ? OUTFITS[look.outfit % OUTFITS.length]! : '#3c7bd9';
  const style = HAIRS[(look?.hair ?? 0) % HAIRS.length]!;
  const hat = look && COVERED.has(style) ? OUTFITS[look.colour % OUTFITS.length]! : hair;
  return { r: hat, h: hair, s: skin, k: '#1b1b1b', b: outfit, p: '#2b2f4a' };
}

function withHead(rows: string[], look?: CaptainLook): string[] {
  const head = MINI_HEADS[HAIRS[(look?.hair ?? 0) % HAIRS.length]!];
  return rows === PERSON_BACK ? rows : [...head, ...rows.slice(3)];
}

const SPEED = 46;
const NEAR = 13;
const ZOOM = 2;
const CELL = 3;
const LOOKAHEAD = 40;
const ARROWS: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
const STEPS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

type Vec = { x: number; y: number };
type Route = { points: Vec[]; poi: Poi | null; arrive: (() => void) | null };
const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

/** A walkable Island: terrain, collision, points of interest, and a player the student steers or sends walking. */
export class Scene {
  readonly pois: Poi[] = [];
  player: { x: number; y: number; dir: Dir; moving: boolean };
  onNear: (poi: Poi | null) => void = () => {};
  onStep: (poi: Poi) => void = () => {};

  private W = 320;
  private H: number;
  private lo: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private vctx: CanvasRenderingContext2D;
  private walk: Uint8Array;
  private draws: { y: number; draw: (t: number) => void }[] = [];
  private renderTerrain: (t: number) => void = () => {};
  private stick: Vec | null = null;
  private route: Route | null = null;
  private arrows = new Set<string>();
  private camera = { x: 0, y: 0, w: 1, h: 1 };
  private goal: { kind: PoiKind; label: string } | null = null;
  private stopped = false;
  private raf = 0;
  private last = 0;
  private near: Poi | null = null;
  private stepping: Poi | null = null;
  private sprites: Record<'front' | 'step' | 'back', HTMLCanvasElement>;
  private keys = (e: KeyboardEvent) => this.key(e, true);
  private keysUp = (e: KeyboardEvent) => this.key(e, false);

  constructor(private view: HTMLCanvasElement, setup: SceneSetup) {
    const rect = { w: view.clientWidth || innerWidth, h: view.clientHeight || innerHeight };
    this.H = Math.max(200, Math.min(420, Math.round((this.W * rect.h) / rect.w)));
    this.lo = document.createElement('canvas');
    this.lo.width = this.W;
    this.lo.height = this.H;
    this.g = this.lo.getContext('2d')!;
    const VW = this.W / ZOOM;
    const S = Math.max(1, Math.ceil(rect.w / VW));
    view.width = Math.round(VW * S);
    view.height = Math.round((VW * S * rect.h) / rect.w);
    this.vctx = view.getContext('2d')!;
    this.vctx.imageSmoothingEnabled = false;
    this.walk = new Uint8Array(this.W * this.H);
    const pal = personPal(setup.look);
    this.sprites = { front: sprite(withHead(PERSON, setup.look), pal), step: sprite(withHead(PERSON_STEP, setup.look), pal), back: sprite(PERSON_BACK, pal) };
    const start = this.build(setup);
    this.player = { x: setup.start?.x ?? start.x, y: setup.start?.y ?? start.y, dir: 'down', moving: false };
  }

  start(): void {
    addEventListener('keydown', this.keys);
    addEventListener('keyup', this.keysUp);
    const loop = (t: number) => {
      this.tick(Math.min(0.05, (t - (this.last || t)) / 1000), t);
      this.last = t;
      this.raf = requestAnimationFrame(loop);
    };
    if (import.meta.env.DEV) Object.assign(window, { scene: this });
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.stopped = true;
    this.route = null;
    this.arrows.clear();
    cancelAnimationFrame(this.raf);
    removeEventListener('keydown', this.keys);
    removeEventListener('keyup', this.keysUp);
  }

  /** One frame: move, check what's near, draw. The animation loop calls this; tests can too. */
  tick(dt: number, t: number): void {
    this.update(dt);
    this.render(t);
  }

  /** Analog steering: v has length up to 1 and speed scales with it. Any real steer cancels a tap-to-walk route. */
  steer(v: Vec | null): void {
    const len = v ? Math.hypot(v.x, v.y) : 0;
    this.stick = v && len > 0 ? (len > 1 ? { x: v.x / len, y: v.y / len } : { x: v.x, y: v.y }) : null;
    if (this.stick) this.route = null;
  }

  /** Walks a found path to a world point. If the point is a POI, stops within reach of it and then calls arrive. */
  walkTo(world: Vec, arrive?: () => void): void {
    const poi = this.pois.find((q) => dist(q, world) < 1) ?? null;
    const points = this.findPath(world, poi ? NEAR - 2 : CELL);
    this.route = { points, poi, arrive: arrive ?? null };
  }

  screenToWorld(clientX: number, clientY: number): Vec {
    const r = this.view.getBoundingClientRect(), c = this.camera;
    return { x: c.x + ((clientX - r.left) / r.width) * c.w, y: c.y + ((clientY - r.top) / r.height) * c.h };
  }

  setAlert(kind: PoiKind, alert: boolean): void {
    for (const p of this.pois) if (p.kind === kind) p.alert = alert;
  }

  /** The POI the off-screen arrow points at, with its tag. */
  setGoal(goal: { kind: PoiKind; label: string } | null): void {
    this.goal = goal;
  }

  nearest(): Poi | null {
    return this.near;
  }

  /** The POI of this kind closest to the player. */
  closest(kind: PoiKind): Poi | undefined {
    const p = this.player;
    return this.pois.filter((q) => q.kind === kind).sort((a, b) => dist(a, p) - dist(b, p))[0];
  }

  private key(e: KeyboardEvent, down: boolean): void {
    if (!ARROWS[e.key]) return;
    e.preventDefault();
    if (down) this.arrows.add(e.key);
    else this.arrows.delete(e.key);
    let x = 0, y = 0;
    for (const k of this.arrows) {
      x += ARROWS[k]![0];
      y += ARROWS[k]![1];
    }
    const len = Math.hypot(x, y);
    this.steer(len ? { x: x / len, y: y / len } : null);
  }

  private canStand(x: number, y: number): boolean {
    for (const dx of [-2, 0, 2]) {
      const X = Math.round(x + dx), Y = Math.round(y);
      if (X < 0 || Y < 0 || X >= this.W || Y >= this.H || !this.walk[Y * this.W + X]) return false;
    }
    return true;
  }

  /** Breadth-first search over CELL-sized cells. Unreachable targets get the nearest reachable cell instead. */
  private findPath(target: Vec, reach: number): Vec[] {
    const cols = Math.ceil(this.W / CELL), rows = Math.ceil(this.H / CELL);
    const centre = (c: number): Vec => ({ x: (c % cols) * CELL + CELL / 2, y: Math.floor(c / cols) * CELL + CELL / 2 });
    const cellAt = (v: Vec) => Math.min(rows - 1, Math.max(0, Math.floor(v.y / CELL))) * cols + Math.min(cols - 1, Math.max(0, Math.floor(v.x / CELL)));
    const from = new Int32Array(cols * rows).fill(-1);
    const start = cellAt(this.player);
    from[start] = start;
    const queue = [start];
    let best = start, bestD = Infinity;
    for (let qi = 0; qi < queue.length; qi++) {
      const c = queue[qi]!, d = dist(centre(c), target);
      if (d < bestD) [best, bestD] = [c, d];
      if (d <= reach) break;
      const cx = c % cols, cy = Math.floor(c / cols);
      for (const [ox, oy] of STEPS) {
        const nx = cx + ox, ny = cy + oy, n = ny * cols + nx;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || from[n] !== -1) continue;
        const m = centre(n);
        if (!this.canStand(m.x, m.y)) continue;
        if (ox && oy && !(this.canStand(m.x - ox * CELL, m.y) && this.canStand(m.x, m.y - oy * CELL))) continue;
        from[n] = c;
        queue.push(n);
      }
    }
    const path: Vec[] = [];
    for (let c = best; c !== start; c = from[c]!) path.push(centre(c));
    return this.smooth(path.reverse());
  }

  /** Drops waypoints the player can walk straight past, so routes run in lines rather than grid zigzags. */
  private smooth(points: Vec[]): Vec[] {
    const out: Vec[] = [];
    let at: Vec = this.player;
    for (let i = 0; i < points.length; ) {
      let j = Math.min(points.length - 1, i + LOOKAHEAD);
      while (j > i && !this.clearLine(at, points[j]!)) j--;
      at = points[j]!;
      out.push(at);
      i = j + 1;
    }
    return out;
  }

  private clearLine(a: Vec, b: Vec): boolean {
    const n = Math.ceil(dist(a, b));
    for (let k = 1; k <= n; k++) if (!this.canStand(a.x + ((b.x - a.x) * k) / n, a.y + ((b.y - a.y) * k) / n)) return false;
    return true;
  }

  /** Full move, else slide along x, else along y. Facing follows the stronger axis. */
  private move(v: Vec, dt: number): boolean {
    const p = this.player;
    if (Math.abs(v.x) > Math.abs(v.y)) p.dir = v.x < 0 ? 'left' : 'right';
    else if (v.y) p.dir = v.y < 0 ? 'up' : 'down';
    const dx = v.x * SPEED * dt, dy = v.y * SPEED * dt;
    for (const [mx, my] of [[dx, dy], [dx, 0], [0, dy]] as const) {
      if ((mx || my) && this.canStand(p.x + mx, p.y + my)) {
        p.x += mx;
        p.y += my;
        return true;
      }
    }
    return false;
  }

  private routeStep(dt: number): Vec | null {
    const r = this.route, p = this.player;
    if (!r) return null;
    while (r.points[0] && dist(p, r.points[0]) < 0.75) r.points.shift();
    const next = r.points[0];
    if (!next) return null;
    const d = dist(p, next), full = SPEED * dt;
    const k = full > 0 ? Math.min(1, d / full) / d : 1 / d;
    return { x: (next.x - p.x) * k, y: (next.y - p.y) * k };
  }

  private arrival(): void {
    const r = this.route;
    if (!r || this.stopped) return;
    const there = r.poi ? dist(this.player, r.poi) <= NEAR - 1 : r.points.length === 0;
    if (!there && r.points.length) return;
    this.route = null;
    if (there) r.arrive?.();
  }

  private update(dt: number): void {
    const p = this.player;
    const v = this.stick ?? this.routeStep(dt);
    p.moving = !!v && this.move(v, dt);
    if (v && dt > 0 && !p.moving && !this.stick) this.route = null;
    let best: Poi | null = null, bestD = NEAR;
    for (const poi of this.pois) {
      const d = Math.hypot(poi.x - p.x, poi.y - p.y);
      if (d < bestD) {
        best = poi;
        bestD = d;
      }
    }
    if (best !== this.near) {
      this.near = best;
      this.onNear(best);
    }
    const onGrass = best?.kind === 'grass' && bestD < 7 ? best : null;
    if (onGrass && this.stepping !== onGrass && p.moving) {
      this.stepping = onGrass;
      this.onStep(onGrass);
    }
    if (!onGrass) this.stepping = null;
    this.arrival();
  }

  private render(t: number): void {
    const g = this.g;
    this.renderTerrain(t);
    const p = this.player;
    const playerDraw = {
      y: p.y,
      draw: () => {
        const img = p.dir === 'up' ? this.sprites.back : p.moving && Math.floor(t / 160) % 2 ? this.sprites.step : this.sprites.front;
        g.fillStyle = 'rgba(10,20,10,.3)';
        g.fillRect(Math.round(p.x) - 4, Math.round(p.y), 9, 2);
        if (p.dir === 'left') {
          g.save();
          g.translate(Math.round(p.x) + 5, 0);
          g.scale(-1, 1);
          g.drawImage(img, 0, Math.round(p.y) - 11);
          g.restore();
        } else g.drawImage(img, Math.round(p.x) - 5, Math.round(p.y) - 11);
      },
    };
    for (const d of [...this.draws, playerDraw].sort((a, b) => a.y - b.y)) d.draw(t);
    this.drawAlerts(t);
    this.light();

    const VW = this.W / ZOOM;
    const VH = (VW * this.view.height) / this.view.width;
    const cx = Math.round(Math.max(0, Math.min(this.W - VW, p.x - VW / 2)));
    const cy = Math.round(Math.max(0, Math.min(this.H - VH, p.y - VH / 2)));
    this.camera = { x: cx, y: cy, w: VW, h: VH };
    this.vctx.drawImage(this.lo, cx, cy, VW, VH, 0, 0, this.view.width, this.view.height);
    this.drawPointer(cx, cy, VW, VH, t);
  }

  private pointerTarget(): Poi | undefined {
    if (this.goal) return this.closest(this.goal.kind);
    const p = this.player;
    return this.pois.filter((q) => q.alert).sort((a, b) => dist(a, p) - dist(b, p))[0];
  }

  private drawAlerts(t: number): void {
    const g = this.g;
    const hop = Math.floor(t / 250) % 2;
    for (const poi of this.pois) {
      if (!poi.alert) continue;
      const by = poi.y - (poi.kind === 'grass' ? 18 : 22) - hop;
      g.fillStyle = '#0b0f22';
      g.fillRect(poi.x - 3, by - 1, 7, 10);
      g.fillStyle = '#ffffff';
      g.fillRect(poi.x - 2, by, 5, 8);
      g.fillStyle = '#d9443b';
      g.fillRect(poi.x, by + 1, 1, 4);
      g.fillRect(poi.x, by + 6, 1, 1);
    }
  }

  /** When the goal is off screen, an arrow at the edge points the way, tagged with the goal's label. */
  private drawPointer(cx: number, cy: number, VW: number, VH: number, t: number): void {
    const target = this.pointerTarget();
    if (!target) return;
    const sx = (target.x - cx) / VW, sy = (target.y - 10 - cy) / VH;
    if (sx > 0.05 && sx < 0.95 && sy > 0.05 && sy < 0.95) return;
    const vw = this.view.width, vh = this.view.height;
    const ang = Math.atan2(sy - 0.5, sx - 0.5);
    const r = 0.42 + 0.01 * Math.sin(t / 150);
    const ax = vw * (0.5 + Math.cos(ang) * r * 0.95);
    // Kept below the goal banner and above the action button, so the arrow never hides behind the HUD.
    const ay = vh * Math.max(0.3, Math.min(0.82, 0.5 + Math.sin(ang) * r * 0.9));
    const c = this.vctx;
    const size = vw / 40;
    c.save();
    c.translate(ax, ay);
    c.rotate(ang);
    c.fillStyle = '#0b0f22';
    c.beginPath();
    c.moveTo(size * 1.4, 0);
    c.lineTo(-size, -size * 1.1);
    c.lineTo(-size, size * 1.1);
    c.closePath();
    c.fill();
    c.fillStyle = '#f2c14e';
    c.beginPath();
    c.moveTo(size, 0);
    c.lineTo(-size * 0.6, -size * 0.7);
    c.lineTo(-size * 0.6, size * 0.7);
    c.closePath();
    c.fill();
    c.restore();
    if (this.goal) this.drawTag(this.goal.label, ax, ay, ang, size);
  }

  /** The label sits on the inward side of the arrow, so it never runs off the edge. */
  private drawTag(label: string, ax: number, ay: number, ang: number, size: number): void {
    const c = this.vctx, px = Math.round(size * 0.7), pad = Math.round(px * 0.5);
    c.save();
    c.font = `${px}px 'Press Start 2P', monospace`;
    c.textBaseline = 'middle';
    const w = Math.ceil(c.measureText(label).width) + pad * 2, hgt = px + pad * 2;
    const x = ax - Math.cos(ang) * (size * 1.8 + w / 2), y = ay - Math.sin(ang) * (size * 1.8 + hgt / 2);
    const left = Math.round(Math.max(4, Math.min(this.view.width - w - 4, x - w / 2)));
    const top = Math.round(Math.max(4, Math.min(this.view.height - hgt - 4, y - hgt / 2)));
    c.fillStyle = '#0b0f22';
    c.fillRect(left - 3, top - 3, w + 6, hgt + 6);
    c.fillStyle = '#1f2850';
    c.fillRect(left, top, w, hgt);
    c.fillStyle = '#f2c14e';
    c.fillText(label, left + pad, top + hgt / 2 + 1);
    c.restore();
  }

  private light(): void {
    const { g, W, H } = this;
    const lg = g.createLinearGradient(0, 0, W, H);
    lg.addColorStop(0, 'rgba(255,214,140,.12)');
    lg.addColorStop(0.55, 'rgba(255,214,140,0)');
    lg.addColorStop(1, 'rgba(30,20,80,.16)');
    g.fillStyle = lg;
    g.fillRect(0, 0, W, H);
  }

  private build(setup: SceneSetup): { x: number; y: number } {
    const { W, H, g } = this;
    const th = setup.theme;
    const seed = th.seed * 37.1;
    const CX = 158, CY = Math.round(H * 0.49), RX = 122, RY = Math.round(Math.min(H * 0.37, 74 + (H - 200) * 0.25));
    const PLATEAU = 0.4, CLIFF = 10;
    const hgt = new Float32Array(W * H), plat = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const e = Math.hypot((x - CX) / RX, (y - CY) / RY);
        const h = 1 - e + (fbm(x / 46 + seed, y / 46 + seed * 0.7) - 0.47) * 0.62;
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

    let STAIR_X = CX - 18;
    for (let off = 0; off < 60; off += 2) {
      const ok = (sx: number) => [...Array(H).keys()].some((y) => cliffRow[y * W + sx] === CLIFF && cliffRow[y * W + sx + 6] === CLIFF);
      if (ok(CX - 18 + off)) {
        STAIR_X = CX - 18 + off;
        break;
      }
      if (ok(CX - 18 - off)) {
        STAIR_X = CX - 18 - off;
        break;
      }
    }
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
    const walk = this.walk;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x, h = hgt[i]!, r = hash2(x, y), cr = cliffRow[i]!;
        const stair = x >= STAIR_X && x < STAIR_X + 7;
        if (cr && cr <= CLIFF) {
          if (stair) {
            put(i, cr % 2 ? '#d8b98a' : '#a88358');
            walk[i] = 1;
            continue;
          }
          const strata = vnoise(x / 3, cr * 1.7);
          let c = cr === 1 ? th.cliff[0] : cr < 4 ? th.cliff[1] : cr < CLIFF ? th.cliff[2] : th.cliff[3];
          if (strata > 0.72 && cr > 1) c = th.cliff[0];
          put(i, c);
          continue;
        }
        if (P_(x, y)) {
          let c = vnoise(x / 9 + 40, y / 9) > 0.56 ? th.plateau[0] : th.plateau[1];
          if (r < 0.09) c = th.grass[0];
          if (r > 0.994) c = ['#ffd75e', '#ff8fb1', '#ffffff'][Math.floor(r * 1000) % 3]!;
          if (!P_(x, y + 1)) c = th.plateau[2];
          else if (!P_(x - 1, y) || !P_(x + 1, y) || !P_(x, y - 1)) c = th.grass[2];
          if (stair && !P_(x, y + 2)) c = '#d8b98a';
          put(i, c);
          walk[i] = 1;
          continue;
        }
        if (h >= 0.07) {
          let c: Colour = vnoise(x / 10 + 90, y / 10) > 0.58 ? th.grass[0] : th.grass[1];
          if (r < 0.08) c = th.grass[2];
          if (r > 0.995) c = ['#ffd75e', '#ffffff'][Math.floor(r * 1000) % 2]!;
          if (cr > CLIFF) c = th.grass[3];
          if (onPath[i]) c = onPath[i] === 2 ? (r < 0.15 ? '#b3864c' : '#c79a5e') : '#9c7a45';
          if (h < 0.085) c = mix(typeof c === 'string' ? c : th.grass[1], th.sand[0], 0.5);
          put(i, c);
          walk[i] = 1;
          continue;
        }
        if (h >= 0) {
          let c = r < 0.08 ? th.sand[1] : th.sand[0];
          if (h < 0.018) c = r < 0.1 ? th.sand[2] : th.sand[2];
          if (onPath[i]) c = '#d1b077';
          put(i, c);
          walk[i] = 1;
          continue;
        }
        let c: Colour;
        if (h > -0.07) {
          const t = (h + 0.07) / 0.07;
          c = mix(th.shallow[0], th.shallow[1], Math.pow(t, 1.3));
          const rip = Math.sin(x * 0.45 + y * 0.25 + vnoise(x / 7, y / 7) * 7);
          if (rip > 0.86 && t > 0.3) c = mix(th.shallow[1], '#d9fbf2', t * 0.7);
        } else c = vnoise(x / 14, y / 9) > 0.55 ? th.deep[0] : th.deep[1];
        put(i, c);
        water.push(i);
      }
    for (let k = 0; k < 24; k++) for (let dx = 0; dx < 8; dx++) walk[(dock.y - 4 + k) * W + dock.x + dx] = 1;

    const block = (x0: number, y0: number, w: number, h: number) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < W && y < H) walk[y * W + x] = 0;
    };
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
    const find = (near: [number, number], pad: number, needPlat?: number, radius = 80): { x: number; y: number } | null => {
      let best: { x: number; y: number } | null = null, bd2 = 1e9;
      for (let y = Math.max(4, near[1] - radius); y < Math.min(H - 4, near[1] + radius); y += 2)
        for (let x = Math.max(4, near[0] - radius); x < Math.min(W - 4, near[0] + radius); x += 2) {
          if (!okSpot(x, y, pad, needPlat)) continue;
          const d = Math.hypot(x - near[0], y - near[1]);
          if (d < bd2) {
            bd2 = d;
            best = { x, y };
          }
        }
      return best;
    };
    const kinds = new Set(setup.kinds);
    const addPoi = (kind: PoiKind, at: { x: number; y: number } | null, pad: number) => {
      if (!at) return;
      claim(at.x, at.y, pad);
      this.pois.push({ kind, x: at.x, y: at.y, alert: false });
    };

    // Boat at the end of the dock.
    this.pois.push({ kind: 'boat', x: dock.x + 4, y: dock.y + 17, alert: false });
    this.draws.push({
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

    if (kinds.has('hut')) {
      const hp = find([dock.x - 30, dock.y - 22], 12, 0);
      if (hp) {
        claim(hp.x, hp.y, 13);
        block(hp.x - 11, hp.y - 9, 23, 10);
        this.pois.push({ kind: 'hut', x: hp.x - 1, y: hp.y + 3, alert: false });
        this.draws.push({ y: hp.y, draw: () => { g.fillStyle = 'rgba(20,40,20,.28)'; g.fillRect(hp.x - 11, hp.y, 24, 2); g.drawImage(hut, hp.x - 12, hp.y - 13); } });
      }
    }
    if (kinds.has('sign')) {
      const sp = find([dock.x - 12, dock.y - 10], 3, 0, 40);
      if (sp) {
        addPoi('sign', sp, 4);
        block(sp.x - 1, sp.y - 1, 3, 2);
        this.draws.push({ y: sp.y, draw: () => { g.fillStyle = '#5a3a20'; g.fillRect(sp.x, sp.y - 8, 1, 8); g.fillStyle = '#c79a5e'; g.fillRect(sp.x - 4, sp.y - 12, 9, 5); g.fillStyle = '#7a4f2c'; g.fillRect(sp.x - 3, sp.y - 10, 7, 1); } });
      }
    }
    if (kinds.has('board')) {
      const bp = find([dock.x - 40, dock.y - 4], 4, 0, 50);
      if (bp) {
        addPoi('board', bp, 5);
        block(bp.x - 3, bp.y - 1, 7, 2);
        this.draws.push({ y: bp.y, draw: () => { g.fillStyle = '#5a3a20'; g.fillRect(bp.x - 3, bp.y - 8, 1, 8); g.fillRect(bp.x + 3, bp.y - 8, 1, 8); g.fillStyle = '#8fd3ff'; g.fillRect(bp.x - 4, bp.y - 13, 9, 6); g.fillStyle = '#f4f1e8'; g.fillRect(bp.x - 3, bp.y - 12, 3, 2); g.fillRect(bp.x + 1, bp.y - 11, 2, 3); } });
      }
    }
    const person = (look: CaptainLook | undefined) => sprite(withHead(PERSON, look), personPal(look));
    if (kinds.has('crew')) {
      const [mx, my] = pathPts[50]!;
      const cp = find([Math.round(mx) + 12, Math.round(my)], 5, 0, 60);
      if (cp) {
        addPoi('crew', cp, 6);
        block(cp.x - 2, cp.y - 1, 5, 2);
        const img = person(setup.crewLook);
        this.draws.push({ y: cp.y, draw: (t) => { g.fillStyle = 'rgba(10,20,10,.3)'; g.fillRect(cp.x - 4, cp.y, 9, 2); g.drawImage(img, cp.x - 5, cp.y - 11 - (Math.floor(t / 600) % 2)); } });
      }
    }
    if (kinds.has('keeper')) {
      const kp = find([CX + 10, CY - Math.round(RY * 0.45)], 6, 1, 90) ?? find([CX, CY - 20], 6, undefined, 120);
      if (kp) {
        addPoi('keeper', kp, 8);
        block(kp.x - 2, kp.y - 1, 5, 2);
        const img = sprite(PERSON, { r: '#1f2850', h: '#f4f1e8', s: '#e8b48a', k: '#1b1b1b', b: '#d9443b', p: '#1f2850' });
        this.draws.push({
          y: kp.y,
          draw: (t) => {
            g.fillStyle = '#5a3a20';
            g.fillRect(kp.x + 7, kp.y - 18, 1, 18);
            g.fillStyle = Math.floor(t / 400) % 2 ? '#d9443b' : '#e85a4a';
            g.fillRect(kp.x + 8, kp.y - 18, 6, 4);
            g.fillStyle = 'rgba(10,20,10,.3)';
            g.fillRect(kp.x - 4, kp.y, 9, 2);
            g.drawImage(img, kp.x - 5, kp.y - 11);
          },
        });
      }
    }
    const grassSeeds: [number, number][] = [
      [CX + 30, CY - 24],
      [CX - 60, CY + 20],
      [CX + 70, CY + 10],
      [CX - 30, CY - 34],
    ];
    for (const near of grassSeeds.slice(0, setup.grass)) {
      const gp = find(near, 9, undefined, 50);
      if (!gp) continue;
      addPoi('grass', gp, 9);
      this.draws.push({
        y: gp.y - 2,
        draw: (t) => {
          const hop = Math.floor(t / 220) % 2;
          for (let k = 0; k < 26; k++) {
            const gx = gp.x - 8 + Math.floor(hash2(k + gp.x, 1) * 17), gy = gp.y + 2 - Math.floor(hash2(k, 2 + gp.y) * 7);
            const sway = k < 9 && hop ? 1 : 0;
            g.fillStyle = th.grass[3];
            g.fillRect(gx + sway, gy - 5, 1, 5);
            g.fillStyle = th.grass[2];
            g.fillRect(gx + sway + 1, gy - 4, 1, 4);
          }
        },
      });
    }

    const trunk = sprite(['tTt', 'tTt', 'tTt', 'ttT', 'tTt', 'Ttt', 'tTt', 'tTtt', 'ttTt'], { t: th.trunk[0], T: th.trunk[1] }, '#3b2f2a');
    const groves: [number, number, number][] = [[CX - 80, CY - 20, 22], [CX + 70, CY - 30, 16], [CX - 40, CY + 40, 12], [CX + 85, CY + 25, 10]];
    const nearCliff = (x: number, y: number) => {
      for (let dy = -30; dy <= 5; dy++)
        for (let dx = -8; dx <= 8; dx++) {
          const X = x + dx, Y = y + dy;
          if (X >= 0 && Y >= 0 && X < W && Y < H && cliffRow[Y * W + X] && cliffRow[Y * W + X]! <= CLIFF) return true;
        }
      return false;
    };
    for (let n = 0, tries = 0; n < th.trees && tries < 6000; tries++) {
      const gv = groves[tries % groves.length]!;
      const x = Math.round(gv[0] + (hash2(tries + th.seed, 11) - 0.5) * 2 * gv[2] * 1.6), y = Math.round(gv[1] + (hash2(tries, 12 + th.seed) - 0.5) * 2 * gv[2]);
      if (!okSpot(x, y, 7) || nearCliff(x, y)) continue;
      claim(x, y, 8);
      block(x - 2, y - 2, 5, 3);
      n++;
      const r = (k: number) => hash2(tries, k);
      const crown = canopy([[13, 13, 8 + r(1) * 2], [6, 15, 5 + r(2) * 2], [20, 15, 5 + r(3) * 2], [9, 8, 5 + r(4) * 2], [17, 8, 5 + r(5) * 2]], th.leaf, 27, tries);
      this.draws.push({
        y,
        draw: (t) => {
          g.fillStyle = 'rgba(16,40,20,.30)';
          g.beginPath();
          g.ellipse(x + 3, y + 1, 11, 3.5, 0, 0, Math.PI * 2);
          g.fill();
          g.drawImage(trunk, x - 2, y - 10);
          g.drawImage(crown, x - 13 + (Math.floor((t + hash2(x, y) * 2000) / 700) % 2), y - 32);
        },
      });
    }
    const bushCanopy = canopy([[6, 6, 5], [3, 7, 3], [9, 7, 3]], th.leaf, 13, 7);
    for (let n = 0, tries = 0; n < 10 && tries < 3000; tries++) {
      const x = Math.floor(hash2(tries + th.seed, 21) * W), y = Math.floor(hash2(tries, 22 + th.seed) * H);
      if (!okSpot(x, y, 4)) continue;
      claim(x, y, 4);
      block(x - 4, y - 2, 9, 3);
      n++;
      this.draws.push({ y, draw: () => { g.fillStyle = 'rgba(16,40,20,.28)'; g.fillRect(x - 5, y, 11, 2); g.drawImage(bushCanopy, x - 6, y - 11); } });
    }

    const frame = g.createImageData(W, H), fd = frame.data;
    let lastWater = -1e9;
    const clouds = [{ x: 40, y: H * 0.25, rx: 60, ry: 22, v: 0.06 }, { x: 250, y: H * 0.75, rx: 75, ry: 26, v: 0.05 }];
    this.renderTerrain = (t: number) => {
      if (t - lastWater > 110) {
        fd.set(bd);
        const ph = t * 0.0016;
        for (const i of water) {
          const x = i % W, y = (i / W) | 0, h = hgt[i]!;
          const f = h + 0.012 + 0.009 * Math.sin(ph + vnoise(x / 8, y / 8) * 5);
          let c: RGB | null = null;
          if (f > -0.004 && f < 0.004) c = [234, 248, 255];
          else if (f > -0.02 && f < -0.014 && hash2(x, y) > 0.35) c = [178, 232, 236];
          else if (h < -0.07 && Math.sin(x * 0.22 + Math.floor(y / 2) * 1.7 + t * 0.0012 + vnoise(x / 16, y / 6) * 6) > 0.985) c = [96, 146, 218];
          if (c) {
            fd[i * 4] = c[0];
            fd[i * 4 + 1] = c[1];
            fd[i * 4 + 2] = c[2];
          }
        }
        lastWater = t;
      }
      g.putImageData(frame, 0, 0);
      g.fillStyle = 'rgba(10,20,50,.12)';
      for (const c of clouds) {
        const cx = ((c.x + (t * c.v) / 16) % (W + 160)) - 80;
        g.beginPath();
        g.ellipse(cx, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
        g.fill();
      }
    };

    const startAt = { x: dock.x + 4, y: dock.y - 6 };
    return this.canStand(startAt.x, startAt.y) ? startAt : { x: Math.round(pathPts[100]![0]), y: Math.round(pathPts[100]![1]) };
  }
}

const hut = sprite(
  ['.......RRRRRRRR.......', '.....RRrrrrrrrrRR.....', '...RRrrrrrrrrrrrrRR...', '.RRrrrrrrrrrrrrrrrrRR.', 'RrrrrrrrrrrrrrrrrrrrrR', 'RRRRRRRRRRRRRRRRRRRRRR', '.WwwwwwwwwwwwwwwwwwwW.', '.WwgggwwwwddwwwwgggwW.', '.WwgGgwwwwddwwwwgGgwW.', '.WwgggwwwwddwwwwgggwW.', '.WwwwwwwwwddwwwwwwwwW.', '.WwwwwwwwwddwwwwwwwwW.', '.ssssssssssssssssssss.'],
  { R: '#8e3a27', r: '#c95a3d', W: '#a5784a', w: '#d9b07a', g: '#ffe58a', G: '#fff6c8', d: '#6b4329', s: '#8d8a85' },
);
const boat = sprite(['......r......', '......w......', '......ww.....', '......www....', '......wwww...', '......wwwww..', '......w......', 'bbbbbbbbbbbbb', '.BbbbbbbbbbB.', '..BBBBBBBBB..'], { w: '#f4f1e8', b: '#b0603a', B: '#7a3b1f', r: '#d9443b' });
