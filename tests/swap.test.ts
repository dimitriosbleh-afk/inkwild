import { describe, expect, it } from 'vitest';
import { hash } from '../src/art/sprite';
import { befriended } from '../src/core/creatures';
import { VARIANTS } from '../src/core/save';
import { decodeSwap, encodeSwap } from '../src/swap/payload';
import { content, Player } from './fixture';

const known = (id: string) => id.startsWith('c');

/** A code as the game wrote it before variants: INKWILD1, the creature, a shiny flag, and a check. */
function oldCode(creature: string, shiny: 0 | 1): string {
  const body = `INKWILD1:${creature}:${shiny}`;
  return `${body}:${(hash(body) % 9000) + 1000}`;
}

describe('Swaps', () => {
  it('round-trips every variant of a Creature card and rejects anything tampered with', () => {
    for (const variant of VARIANTS) expect(decodeSwap(encodeSwap({ creature: 'c5.2', variant }), known)).toEqual({ creature: 'c5.2', variant });
    const code = encodeSwap({ creature: 'c5.2', variant: 'golden' });
    expect(code.startsWith('INKWILD2:')).toBe(true);
    expect(decodeSwap(code.replace('c5.2', 'c5.3'), known)).toBeUndefined();
    expect(decodeSwap(code.replace(':g:', ':c:'), known)).toBeUndefined();
    expect(decodeSwap('hello', known)).toBeUndefined();
    expect(decodeSwap(encodeSwap({ creature: 'zzz', variant: 'plain' }), known)).toBeUndefined();
  });

  it('still accepts an old INKWILD1 code, as plain or shiny', () => {
    expect(decodeSwap(oldCode('c5.2', 0), known)).toEqual({ creature: 'c5.2', variant: 'plain' });
    expect(decodeSwap(oldCode('c5.2', 1), known)).toEqual({ creature: 'c5.2', variant: 'shiny' });
    expect(decodeSwap(oldCode('c5.2', 1).replace(':1:', ':0:'), known)).toBeUndefined();
    const body = 'INKWILD1:c5.2:g';
    expect(decodeSwap(`${body}:${(hash(body) % 9000) + 1000}`, known)).toBeUndefined();
  });

  it('gives the receiver a copy marked as from a Swap, once', () => {
    const p = new Player();
    const first = p.do({ type: 'receive', creature: 'c5.2', variant: 'plain' });
    expect(first).toEqual([{ type: 'received', creature: 'c5.2', variant: 'plain', already: false }]);
    expect(befriended(content, p.save)).toMatchObject([{ creature: 'c5.2', received: true }]);
    expect(p.do({ type: 'receive', creature: 'c5.2', variant: 'plain' })[0]).toMatchObject({ already: true });
    expect(p.save.variants['c5.2']).toEqual(['plain']);
  });

  it('upgrades a Creature you already have when the swapped one is shiny', () => {
    const p = new Player();
    p.learn('sentence');
    p.encounter('sentence', 'first');
    p.do({ type: 'receive', creature: 'c5.1', variant: 'shiny' });
    expect(befriended(content, p.save).find((c) => c.creature === 'c5.1')).toMatchObject({ look: 'shiny', received: false });
  });
});
