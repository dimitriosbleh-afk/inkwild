const COLOURS = ['#f2c14e', '#ffffff', '#8fd3ff', '#f28aa0', '#45d16b'];

export function burst(at: Element, colours = COLOURS): void {
  const r = at.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.className = 'fx';
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  document.body.append(canvas);
  const g = canvas.getContext('2d')!;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let parts = Array.from({ length: 80 }, () => ({
    x: cx,
    y: cy,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 13 - 2,
    s: 4 + Math.floor(Math.random() * 3) * 2,
    c: colours[Math.floor(Math.random() * colours.length)]!,
    life: 50 + Math.random() * 25,
  }));
  const step = () => {
    g.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter((p) => p.life-- > 0);
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45;
      p.vx *= 0.98;
      g.fillStyle = p.c;
      g.fillRect(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, p.s, p.s);
    }
    if (parts.length) requestAnimationFrame(step);
    else canvas.remove();
  };
  requestAnimationFrame(step);
}

export function shake(el: Element): void {
  el.classList.remove('shake');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('shake');
  // Once done, let any idle animation (a bobbing Creature) carry on.
  const done = (e: Event) => {
    if (e.target !== el || (e as AnimationEvent).animationName !== 'shake') return;
    el.classList.remove('shake');
    el.removeEventListener('animationend', done);
  };
  el.addEventListener('animationend', done);
}
