import type { Body, Part, Response, Task } from '../content/types';

export type Verdict = { kind: 'right' } | { kind: 'wrong'; reason: string } | { kind: 'continue' };

const RIGHT: Verdict = { kind: 'right' };
const wrong = (reason: string): Verdict => ({ kind: 'wrong', reason });
export const SORT_LOOK = 'Not quite. Read each one again and ask the question on the piles.';

export function taps(parts: Part[]): { tap: string; reason?: string }[] {
  return parts.filter((p): p is { tap: string; reason?: string } => typeof p !== 'string');
}

export function joinTiles(tiles: string[]): string {
  return normalise(tiles.join(' '));
}

const ABBREVIATION = /\b(?:a\.m|p\.m|Dr|Mr|Mrs|Ms|St|P\.S|e\.g|i\.e|vs|etc|(?:Mr|Mrs|Ms|Dr) [A-Z])\.$/;
const STARTS_SENTENCE = /^[A-Z0-9'‘"“(]/;

/**
 * A passage split into sentences, the units a student taps to prove an answer. A mark ends a sentence only when the next
 * word starts a new one, so "'Stop!' he yelled." stays whole, and so do "Dr. Lin", "6 a.m." and "9.02".
 */
export function sentencesOf(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\n+/)) {
    let start = 0;
    for (const m of line.matchAll(/[.!?]+['’"”)]*(?=\s|$)/g)) {
      const end = m.index + m[0].length;
      const after = line.slice(end).trimStart();
      if (after && !STARTS_SENTENCE.test(after)) continue;
      if (ABBREVIATION.test(line.slice(0, m.index + 1))) continue;
      out.push(line.slice(start, end).trim());
      start = end;
    }
    const rest = line.slice(start).trim();
    if (rest) out.push(rest);
  }
  return out.filter(Boolean);
}

export function normalise(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?’'])/g, '$1')
    .trim();
}

const fallback = 'Look again at the text and try once more.';
export const PROOF_LOOK = "That line doesn't prove it. Find the sentence that shows it.";

/**
 * Prove it: a choose task that, once answered right, asks for the passage sentence that proves the answer. Only a task
 * with a passage can ask, since the proof is a sentence of it; a task still waiting for its `proof` plays as before.
 */
export function needsProof(task: Pick<Task, 'text' | 'body'>): boolean {
  return !!task.text && task.body.format === 'choose' && !!task.body.proof?.length;
}

/** The body as checked for this task: a proof with no passage to find it in is ignored. */
export function checkedBody(task: Pick<Task, 'text' | 'body'>): Body {
  if (task.body.format !== 'choose' || needsProof(task) || !task.body.proof) return task.body;
  const { proof: _, ...rest } = task.body;
  return rest;
}

export function check(body: Body, response: Response): Verdict {
  switch (body.format) {
    case 'choose': {
      if (response.format !== 'choose') break;
      if (response.choice !== body.answer) return wrong(body.options[response.choice]?.reason ?? fallback);
      if (!body.proof?.length) return RIGHT;
      // Prove it: the right answer alone only opens the passage; the sentence that shows it finishes the task.
      if (response.proof === undefined) return { kind: 'continue' };
      return body.proof.includes(response.proof) ? RIGHT : wrong(PROOF_LOOK);
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
      // With two piles, explaining any one misplaced item would hand over its answer, so the Second look stays general.
      const misplaced = body.items.some((item, i) => response.bins[i] !== item.bin);
      return misplaced ? wrong(SORT_LOOK) : RIGHT;
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
