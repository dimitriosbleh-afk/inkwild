import type { Band } from '../content/types';
import type { BranchProgress, Outcome } from './save';

const WINDOW = 6;
const UP_AT = 5;
const DOWN_AT = 3;

const up = (b: Band): Band => (b < 4 ? ((b + 1) as Band) : b);
const down = (b: Band): Band => (b > 1 ? ((b - 1) as Band) : b);

export function recordForBand(p: BranchProgress, outcome: Outcome): void {
  p.recent = [...p.recent, outcome].slice(-WINDOW);

  if (p.placing > 0) {
    p.placing -= 1;
    const [a, b] = p.recent.slice(-2);
    if (a === undefined || b === undefined) return;
    if (a === 'first' && b === 'first') move(p, up(p.band));
    else if (a !== 'first' && b !== 'first') move(p, down(p.band));
    return;
  }

  const firsts = p.recent.filter((o) => o === 'first').length;
  const shown = p.recent.filter((o) => o === 'shown').length;
  if (p.recent.length >= WINDOW && firsts >= UP_AT) move(p, up(p.band));
  else if (shown >= DOWN_AT) move(p, down(p.band));
}

function move(p: BranchProgress, band: Band): void {
  if (band === p.band) return;
  p.band = band;
  p.recent = [];
}
