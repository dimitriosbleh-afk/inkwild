let ctx: AudioContext | undefined;

const TUNES = {
  tap: [[660, 0.05]],
  right: [[660, 0.08], [880, 0.12]],
  look: [[330, 0.12]],
  hit: [[180, 0.08], [120, 0.14]],
  fanfare: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]],
} as const;

export function blip(kind: keyof typeof TUNES): void {
  ctx ??= new AudioContext();
  let t = ctx.currentTime;
  for (const [freq, dur] of TUNES[kind]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur);
    t += dur;
  }
}
