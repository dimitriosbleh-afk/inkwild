import { describe, expect, it } from 'vitest';
import type { Body, Content, Encounter, Response } from '../src/content/types';
import { check, checkedBody, PROOF_LOOK, sentencesOf } from '../src/core/check';
import { step, type Action, type GameEvent } from '../src/core/game';
import { MAX_READ_MS, MIN_READ_MS, readingMs, rushed, tooFast } from '../src/core/pace';
import { newSave, type Activity, type Save } from '../src/core/save';
import { content, Player } from './fixture';

const PASSAGE = 'Mia grabbed her coat. Rain hammered on the roof. She ran for the bus. The bus was late again.';
const choose = (proof?: number[]): Extract<Body, { format: 'choose' }> => ({
  format: 'choose',
  options: [{ text: 'right' }, { text: 'wrong a', reason: 'reason a' }],
  answer: 0,
  ...(proof ? { proof } : {}),
});
const pick = (choice: number, proof?: number): Response => ({ format: 'choose', choice, ...(proof === undefined ? {} : { proof }) });

/** The fixture bank, with every Encounter given a passage and a proof (sentence 1, "Rain hammered on the roof."). */
const proofed: Content = {
  ...content,
  encounter: (id) => ({ ...content.encounter(id), text: PASSAGE, body: choose([1]) }),
};

/** A Student mid-Encounter on 5.1, taught, playing against `bank`. */
class Reader {
  save: Save;
  constructor(
    private bank: Content,
    activity: Activity = { kind: 'encounter', id: '5.1-b2-0', tries: 0 },
  ) {
    this.save = newSave(100);
    this.save.skills['5.1'] = { taught: true, done: 0, xp: 0, recent: [], mastered: false, reviewMisses: 0, rusty: false };
    this.save.activity = activity;
  }
  do(action: Action): GameEvent[] {
    const r = step(this.bank, this.save, action, { day: 100, rand: () => 0.5 });
    this.save = r.save;
    return r.events;
  }
  answer(response: Response, ms?: number): GameEvent[] {
    return this.do({ type: 'answer', response, ...(ms === undefined ? {} : { ms }) });
  }
}

const resolved = (events: GameEvent[]) => events.find((e) => e.type === 'resolved');

describe('Prove it: check', () => {
  it('asks for the proof once the choice is right', () => {
    expect(check(choose([1]), pick(0))).toEqual({ kind: 'continue' });
  });

  it('is right only with the right choice and a sentence that proves it', () => {
    expect(check(choose([1, 3]), pick(0, 1))).toEqual({ kind: 'right' });
    expect(check(choose([1, 3]), pick(0, 3))).toEqual({ kind: 'right' });
  });

  it('calls a right choice with the wrong sentence wrong, and says why', () => {
    expect(check(choose([1]), pick(0, 2))).toEqual({ kind: 'wrong', reason: PROOF_LOOK });
    expect(PROOF_LOOK).toBe("That line doesn't prove it. Find the sentence that shows it.");
  });

  it('treats a wrong choice as before, proof or not', () => {
    expect(check(choose([1]), pick(1))).toEqual({ kind: 'wrong', reason: 'reason a' });
    expect(check(choose([1]), pick(1, 1))).toEqual({ kind: 'wrong', reason: 'reason a' });
  });

  it('checks a choose task without a proof exactly as before', () => {
    expect(check(choose(), pick(0))).toEqual({ kind: 'right' });
    expect(check(choose(), pick(1))).toEqual({ kind: 'wrong', reason: 'reason a' });
    expect(check(choose([]), pick(0))).toEqual({ kind: 'right' });
  });

  it('ignores a proof when there is no passage to find it in', () => {
    expect(checkedBody({ body: choose([1]) })).toEqual(choose());
    expect(checkedBody({ text: PASSAGE, body: choose([1]) })).toEqual(choose([1]));
  });

  it('counts proof sentences the way the passage is split', () => {
    expect(sentencesOf(PASSAGE)[1]).toBe('Rain hammered on the roof.');
  });
});

describe('Prove it: scoring', () => {
  it('is first try only with the right choice and the right proof, nothing wrong between', () => {
    const r = new Reader(proofed);
    expect(r.answer(pick(0))).toEqual([{ type: 'continue' }]);
    expect(r.save.activity).toMatchObject({ kind: 'encounter', tries: 0 });
    expect(resolved(r.answer(pick(0, 1)))).toMatchObject({ outcome: 'first' });
    expect(r.save.activity).toBeUndefined();
  });

  it('gives a Second look for the wrong sentence, then second try for the right one', () => {
    const r = new Reader(proofed);
    r.answer(pick(0));
    expect(r.answer(pick(0, 2))).toEqual([{ type: 'secondLook', reason: PROOF_LOOK }]);
    expect(resolved(r.answer(pick(0, 1)))).toMatchObject({ outcome: 'second' });
  });

  it('shows the answer after the wrong sentence twice', () => {
    const r = new Reader(proofed);
    r.answer(pick(0));
    r.answer(pick(0, 2));
    expect(resolved(r.answer(pick(0, 3)))).toMatchObject({ outcome: 'shown', reason: PROOF_LOOK });
  });

  it('never counts a guessed answer as first try, even with the right proof', () => {
    const r = new Reader(proofed);
    expect(r.answer(pick(1))[0]).toMatchObject({ type: 'secondLook' });
    expect(r.answer(pick(0))).toEqual([{ type: 'continue' }]);
    expect(resolved(r.answer(pick(0, 1)))).toMatchObject({ outcome: 'second' });
  });

  it('plays a choose task without a proof exactly as before', () => {
    const p = new Player();
    p.learn('sentence');
    p.nextEncounter('sentence');
    expect(resolved(p.answerRight())).toMatchObject({ outcome: 'first' });
  });
});

describe('Too fast', () => {
  it('needs a second per 5 words of passage, from 2 to 10 seconds', () => {
    expect(readingMs(undefined)).toBe(0);
    expect(readingMs('Short one.')).toBe(MIN_READ_MS);
    expect(readingMs(Array(25).fill('word').join(' '))).toBe(5000);
    expect(readingMs(Array(200).fill('word').join(' '))).toBe(MAX_READ_MS);
    expect(readingMs('A — dash is not a word.')).toBe(MIN_READ_MS);
  });

  it('applies to the first attempt at a task with a passage only, never in the We do', () => {
    const encounter = { kind: 'encounter', tries: 0 } as const;
    expect(tooFast({ text: PASSAGE }, encounter, 500)).toBe(true);
    expect(tooFast({ text: PASSAGE }, encounter, 4000)).toBe(false);
    expect(tooFast({ text: PASSAGE }, { kind: 'keeper', tries: 0 }, 500)).toBe(true);
    expect(tooFast({ text: PASSAGE }, { kind: 'encounter', tries: 1 }, 500)).toBe(false);
    expect(tooFast({ text: PASSAGE }, { kind: 'teach', tries: 0 }, 500)).toBe(false);
    expect(tooFast({}, encounter, 0)).toBe(false);
    expect(tooFast({ text: PASSAGE }, encounter, undefined)).toBe(false);
  });

  it('does not count an answer tapped too fast as an attempt', () => {
    const r = new Reader(proofed);
    const before = structuredClone(r.save);
    expect(r.answer(pick(1), 500)).toEqual([{ type: 'tooFast' }]);
    expect(r.save).toEqual(before);
    expect(r.answer(pick(0), 600)).toEqual([{ type: 'tooFast' }]);
    expect(r.save).toEqual(before);
    expect(r.answer(pick(0), 5000)).toEqual([{ type: 'continue' }]);
    expect(resolved(r.answer(pick(0, 1), 6000))).toMatchObject({ outcome: 'first' });
  });

  it('lets the Second look answer come as soon as the Student likes', () => {
    const r = new Reader(proofed);
    r.answer(pick(1), 5000);
    expect(r.save.activity).toMatchObject({ tries: 1 });
    expect(r.answer(pick(0), 100)).toEqual([{ type: 'continue' }]);
  });

  it('never holds back a task with no passage', () => {
    const r = new Reader(content);
    expect(resolved(r.answer(pick(0), 0))).toMatchObject({ outcome: 'first' });
  });
});

describe('the Creature slips away', () => {
  it('gives no XP when the answer is shown, but progress still counts', () => {
    const p = new Player();
    p.learn('sentence');
    p.encounter('sentence', 'shown');
    expect(p.save.skills['5.1']).toMatchObject({ xp: 0, done: 1, recent: [expect.objectContaining({ outcome: 'shown' })] });
    p.encounter('sentence', 'second');
    expect(p.save.skills['5.1']).toMatchObject({ xp: 10, done: 2 });
  });

  it('gives no XP for a Daily review item whose answer is shown', () => {
    const encounter: Encounter = content.encounter('5.1-b2-0');
    const r = new Reader(content, { kind: 'review', ids: [encounter.id], at: 0, tries: 0, firsts: 0, phase: 'task' });
    r.answer(pick(1));
    r.answer(pick(1));
    expect(r.save.skills['5.1']).toMatchObject({ xp: 0, reviewMisses: 1 });
  });
});

describe('Slow down, in Tap to learn', () => {
  it('is two wrong taps within 3 seconds of each other', () => {
    expect(rushed(undefined, 1000)).toBe(false);
    expect(rushed(1000, 2500)).toBe(true);
    expect(rushed(1000, 4000)).toBe(true);
    expect(rushed(1000, 4001)).toBe(false);
  });
});
