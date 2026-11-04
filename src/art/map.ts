import type { BranchId } from '../content/types';

export type IslandKind = BranchId | 'home';

export interface MapIsland {
  kind: IslandKind;
  x: number;
  y: number;
  r: number;
  charted: boolean;
}

type RGB = [number, number, number];

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
const fbm = (x: number, y: number) => 0.5 * vnoise(x, y) + 0.25 * vnoise(x * 2, y * 2) + 0.125 * vnoise(x * 4, y * 4);
const hex = (c: string): RGB => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const grey = ([r, g, b]: RGB): RGB => {
  const l = Math.round(r * 0.3 + g * 0.55 + b * 0.15);
  return [Math.round(l * 0.75 + 30), Math.round(l * 0.78 + 32), Math.round(l * 0.85 + 40)];
};

/** Land colour for one pixel of one island, by kind and height. Each kind reads as its landscape at a glance. */
function land(kind: IslandKind, h: number, x: number, y: number): string | null {
  const r = hash2(x, y);
  switch (kind) {
    case 'whose':
      if (h > 0.32) return null;
      return h < 0.14 ? '#ecd59a' : r < 0.3 ? '#4f9a3c' : '#6dbb4f';
    case 'convince':
      if (h > 0.45) return r < 0.2 ? '#7a2e1a' : '#a8442a';
      if (h > 0.3) return vnoise(x / 2, y) > 0.6 ? '#c45a32' : '#b44e2c';
      return h < 0.14 ? '#e8b77a' : '#d9773f';
    case 'pictures':
      if (h > 0.14 && vnoise(x / 3, y / 3) > 0.62) return '#3a8f8a';
      return h < 0.12 ? '#8a7a4a' : r < 0.35 ? '#2f6b3a' : '#3f7d45';
    case 'sentence':
      if (h < 0.3) return null;
      return h < 0.38 ? '#f2e3b0' : r < 0.3 ? '#5aa443' : '#7fca5c';
    case 'punctuation':
      return h < 0.2 ? '#f2e3b0' : h > 0.5 ? '#ffffff' : r < 0.25 ? '#cfe6ef' : '#e8f3f7';
    case 'structure':
      if (h > 0.55) return r < 0.2 ? '#dfe8ef' : '#ffffff';
      if (h > 0.35) return r < 0.25 ? '#6d6f7a' : '#8a8d99';
      return h < 0.14 ? '#cdb98a' : '#5f8a4a';
    case 'editing':
      if (h > 0.68) return '#ff5a2a';
      if (h > 0.45) return r < 0.25 ? '#2a2326' : '#3d3236';
      return h < 0.14 ? '#5a5250' : r < 0.3 ? '#4a4a3a' : '#5e6a40';
    case 'workshop':
      return h < 0.14 ? '#ecd59a' : r < 0.3 ? '#8a6a4f' : '#a8875f';
    case 'between':
      if (h > 0.2 && r < 0.18) return '#24401c';
      return h < 0.12 ? '#ecd59a' : r < 0.4 ? '#3f6b2e' : '#5a8a3c';
    case 'home':
      return h < 0.14 ? '#ecd59a' : h > 0.42 ? '#a6e07a' : r < 0.3 ? '#5aa443' : '#6dbb4f';
  }
}

export function drawMap(view: HTMLCanvasElement, islands: MapIsland[], boatAt: { x: number; y: number }): () => void {
  const rect = { w: view.clientWidth || innerWidth, h: view.clientHeight || innerHeight };
  const W = 320;
  const H = Math.max(60, Math.round((W * rect.h) / rect.w));
  const S = Math.max(1, Math.ceil(rect.w / W));
  view.width = W * S;
  view.height = H * S;
  const vctx = view.getContext('2d')!;
  vctx.imageSmoothingEnabled = false;
  const lo = document.createElement('canvas');
  lo.width = W;
  lo.height = H;
  const g = lo.getContext('2d')!;

  const img = g.createImageData(W, H), d = img.data;
  const deep: number[] = [];
  const lava: number[] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let best = -9, who: MapIsland | undefined;
      for (const isl of islands) {
        const cx = isl.x * W, cy = isl.y * H, rr = isl.r * W;
        let h = 1 - Math.hypot(x - cx, (y - cy) * 1.15) / rr + (fbm(x / 9 + isl.x * 50, y / 9) - 0.45) * 0.7;
        if (isl.kind === 'workshop') h -= Math.max(0, 0.9 - Math.hypot(x - cx - rr * 0.35, y - cy - rr * 0.1) / (rr * 0.45));
        if (h > best) {
          best = h;
          who = isl;
        }
      }
      let c: RGB;
      const i = y * W + x;
      const rough = vnoise(x / 34, y / 20) * 0.7 + vnoise(x / 9, y / 6) * 0.3;
      const lc = who && best >= 0 ? land(who.kind, best, x, y) : null;
      if (lc) {
        c = hex(lc);
        if (who?.kind === 'editing' && best > 0.68) lava.push(i);
      } else if (best > -0.12 || (who?.kind === 'whose' && best > 0.32) || (who?.kind === 'sentence' && best > -0.2)) {
        const lagoon = (who?.kind === 'whose' && best > 0.32) || (who?.kind === 'sentence' && best >= 0);
        c = lagoon ? hex(hash2(x, y) < 0.06 && who?.kind === 'sentence' ? '#ff8fb1' : '#62d3d6') : hex(best > -0.05 ? '#4fb6d0' : '#3a8fd0');
      } else {
        c = hex(rough > 0.6 ? '#2659a8' : rough < 0.32 ? '#2e6cc4' : '#2a63b8');
        deep.push(i);
      }
      if (who && !who.charted && best > -0.12) c = grey(c);
      d[i * 4] = c[0];
      d[i * 4 + 1] = c[1];
      d[i * 4 + 2] = c[2];
      d[i * 4 + 3] = 255;
    }

  const frame = new ImageData(W, H);
  let raf = 0;
  const render = (t: number) => {
    frame.data.set(d);
    const fd = frame.data;
    for (const i of deep) {
      const x = i % W, y = (i / W) | 0;
      const v = Math.sin(x * 0.22 + Math.floor(y / 2) * 1.7 + t * 0.0012 + vnoise(x / 16, y / 6) * 6);
      if (v > 0.985) {
        fd[i * 4] = 96;
        fd[i * 4 + 1] = 146;
        fd[i * 4 + 2] = 218;
      }
    }
    const glow = 0.5 + 0.5 * Math.sin(t / 300);
    for (const i of lava) {
      fd[i * 4] = 255;
      fd[i * 4 + 1] = Math.round(70 + 110 * glow * hash2(i, Math.floor(t / 200)));
      fd[i * 4 + 2] = 30;
    }
    g.putImageData(frame, 0, 0);
    for (const isl of islands)
      if (!isl.charted) {
        g.fillStyle = 'rgba(220,226,240,.35)';
        const cx = isl.x * W + Math.sin(t / 1400 + isl.x * 9) * 3, cy = isl.y * H;
        g.beginPath();
        g.ellipse(cx, cy, isl.r * W * 0.9, isl.r * W * 0.5, 0, 0, Math.PI * 2);
        g.ellipse(cx + isl.r * W * 0.5, cy - 4, isl.r * W * 0.5, isl.r * W * 0.35, 0, 0, Math.PI * 2);
        g.fill();
      }
    const bx = Math.round(boatAt.x * W), by = Math.round(boatAt.y * H + Math.sin(t / 450));
    g.fillStyle = 'rgba(10,30,60,.35)';
    g.fillRect(bx - 5, by + 4, 12, 1);
    g.fillStyle = '#7a3b1f';
    g.fillRect(bx - 5, by + 2, 11, 2);
    g.fillStyle = '#b0603a';
    g.fillRect(bx - 6, by + 1, 13, 1);
    g.fillStyle = '#f4f1e8';
    for (let k = 0; k < 5; k++) g.fillRect(bx, by - 5 + k, 1 + Math.floor(k / 1.5), 1);
    g.fillStyle = '#d9443b';
    g.fillRect(bx, by - 6, 1, 1);
    const rg = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.9);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(1, 'rgba(5,8,30,.4)');
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
    vctx.drawImage(lo, 0, 0, W * S, H * S);
    raf = requestAnimationFrame(render);
  };
  raf = requestAnimationFrame(render);
  return () => cancelAnimationFrame(raf);
}
