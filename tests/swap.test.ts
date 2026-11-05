import { describe, expect, it } from 'vitest';
import { befriended } from '../src/core/creatures';
import { decodeSwap, encodeSwap } from '../src/swap/payload';
import { content, Player } from './fixture';

const known = (id: string) => id.startsWith('c');

describe('Swaps', () => {
  it('round-trips a Creature card and rejects anything tampered with', () => {
    const code = encodeSwap({ creature: 'c5.2', shiny: true });
    expect(decodeSwap(code, known)).toEqual({ creature: 'c5.2', shiny: true });
    expect(decodeSwap(code.replace('c5.2', 'c5.3'), known)).toBeUndefined();
    expect(decodeSwap('hello', known)).toBeUndefined();
    expect(decodeSwap(encodeSwap({ creature: 'zzz', shiny: false }), known)).toBeUndefined();
  });

  it('gives the receiver a copy marked as from a Swap, once', () => {
    const p = new Player();
    const first = p.do({ type: 'receive', creature: 'c5.2', shiny: false });
    expect(first).toEqual([{ type: 'received', creature: 'c5.2', shiny: false, already: false }]);
    expect(befriended(content, p.save)).toMatchObject([{ creature: 'c5.2', received: true }]);
    expect(p.do({ type: 'receive', creature: 'c5.2', shiny: false })[0]).toMatchObject({ already: true });
    expect(p.save.received).toHaveLength(1);
  });

  it('upgrades a Creature you already have when the swapped one is shiny', () => {
    const p = new Player();
    p.learn('sentence');
    p.encounter('sentence', 'first');
    p.do({ type: 'receive', creature: 'c5.1', shiny: true });
    expect(befriended(content, p.save).find((c) => c.creature === 'c5.1')).toMatchObject({ shiny: true, received: false });
  });
});
