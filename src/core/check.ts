import type { Body, Part, Response } from '../content/types';

export type Verdict = { kind: 'right' } | { kind: 'wrong'; reason: string } | { kind: 'continue' };

const RIGHT: Verdict = { kind: 'right' };
const wrong = (reason: string): Verdict => ({ kind: 'wrong', reason });

export function taps(parts: Part[]): { tap: string; reason?: string }[] {
  return parts.filter((p): p is { tap: string; reason?: string } => typeof p !== 'string');
}

export function joinTiles(tiles: string[]): string {
  return normalise(tiles.join(' '));
}

export function normalise(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?’'])/g, '$1')
    .trim();
}

const fallback = 'Look again at the text and try once more.';

export function check(body: Body, response: Response): Verdict {
  switch (body.format) {
    case 'choose': {
      if (response.format !== 'choose') break;
      if (response.choice === body.answer) return RIGHT;
      return wrong(body.options[response.choice]?.reason ?? fallback);
    }
    case 'tapText': {
      if (response.format !== 'tapText') break;
      if (response.tap === body.answer) return RIGHT;
      return wrong(taps(body.parts)[response.tap]?.reason ?? fallback);
    }
    case 'order': {
      if (response.format !== 'order') break;
      const inOrder =
        response.order.length === body.items.length &&
        response.order.every((item, i) => body.items[item] === body.items[i]);
      return inOrder ? RIGHT : wrong(body.reason);
    }
    case 'build': {
      if (response.format !== 'build') break;
      if (response.tiles.length !== piecesNeeded(body)) return wrong(body.reason);
      const built = joinTiles(response.tiles.map((t) => body.tiles[t] ?? ''));
      return body.accept.some((a) => normalise(a) === built) ? RIGHT : wrong(body.reason);
    }
    case 'fix': {
      if (response.format !== 'fix') break;
      if (response.tap !== body.spot) return wrong(taps(body.parts)[response.tap]?.reason ?? fallback);
      if (response.choice === undefined) return { kind: 'continue' };
      if (response.choice === body.answer) return RIGHT;
      return wrong(body.options[response.choice]?.reason ?? fallback);
    }
    case 'sort': {
      if (response.format !== 'sort') break;
      const misplaced = body.items.find((item, i) => response.bins[i] !== item.bin);
      return misplaced ? wrong(misplaced.reason) : RIGHT;
    }
  }
  throw new Error(`response ${response.format} does not fit a ${body.format} task`);
}

/** The tiles, in order, that build this sentence, or undefined if the tiles can't build it. */
export function tilesFor(tiles: string[], sentence: string): number[] | undefined {
  const target = normalise(sentence);
  const search = (built: number[]): number[] | undefined => {
    const text = joinTiles(built.map((i) => tiles[i]!));
    if (text === target) return built;
    for (let i = 0; i < tiles.length; i++) {
      if (built.includes(i)) continue;
      const next = [...built, i];
      if (target.startsWith(joinTiles(next.map((t) => tiles[t]!)))) {
        const found = search(next);
        if (found) return found;
      }
    }
    return undefined;
  };
  return search([]);
}

/** A build task names how many pieces to use, so a leftover tile can never make a second right answer. */
export function piecesNeeded(body: Extract<Body, { format: 'build' }>): number {
  return tilesFor(body.tiles, body.accept[0] ?? '')?.length ?? 0;
}
