import { describe, expect, it } from 'vitest';
import { restorable, restore } from '../src/backup/code';
import type { Content, SkillId } from '../src/content/types';
import { befriended, CHAMPION_WINS, fieldGuide, GOLDEN_STREAK, guideCounts, variantHint } from '../src/core/creatures';
import { battleHp, battleWon, GOLDIE_HP, step, type Action, type GameEvent } from '../src/core/game';
import { reviewDue } from '../src/core/review';
import { newSave, upgradeSave, type Save } from '../src/core/save';
import { content, Player, right, wrong } from './fixture';

const TODAY = 100;
const types = (events: GameEvent[]) => events.map((e) => e.type);
const variants = (events: GameEvent[]) => events.flatMap((e) => (e.type === 'variant' ? [e.variant] : []));

/** The fixture bank with a passage on every Encounter, so a first answer can come too fast. */
const PASSAGE = 'Mia grabbed her coat. Rain hammered on the roof. She ran for the bus. The bus was late again.';
const withText: Content = { ...content, encounter: (id) => ({ ...content.encounter(id), text: PASSAGE }) };

/** A Student who has been taught 5.1 and plays its Encounters one after another, with luck that never finds a shiny. */
class Learner {
  save: Save;
  events: GameEvent[] = [];
  private n = 0;
  constructor(
    private bank: Content = content,
    private rand: () => number = () => 0.99,
  ) {
    this.save = newSave(TODAY);
    this.save.skills['5.1'] = { taught: true, done: 0, xp: 0, recent: [], mastered: false, reviewMisses: 0, rusty: false, streak: 0 };
  }
  do(action: Action): GameEvent[] {
    const r = step(this.bank, this.save, action, { day: TODAY, rand: this.rand });
    this.save = r.save;
    this.events = r.events;
    return r.events;
  }
  /** The next 5.1 Encounter, answered first try, second try or shown. `ms` times the first answer. */
  play(how: 'first' | 'second' | 'shown', ms?: number): GameEvent[] {
    this.save.activity = { kind: 'encounter', id: `5.1-b2-${this.n++ % 6}`, tries: 0 };
    const body = content.encounter(this.save.activity.id).body;
    const timed = ms === undefined ? {} : { ms };
    if (how === 'first') return this.do({ type: 'answer', response: right(body), ...timed });
    const first = this.do({ type: 'answer', response: wrong(body), ...timed });
    return [...first, ...this.do({ type: 'answer', response: how === 'second' ? right(body) : wrong(body) })];
  }
  streak(): number {
    return this.save.skills['5.1']!.streak;
  }
}

describe('golden Creatures', () => {
  it('turn golden the first time a Skill gets five first-try results in a row', () => {
    const l = new Learner();
    for (let i = 0; i < GOLDEN_STREAK - 1; i++) expect(variants(l.play('first'))).not.toContain('golden');
    expect(l.streak()).toBe(4);
    expect(l.play('first')).toContainEqual({ type: 'variant', skill: '5.1', creature: 'c5.1', variant: 'golden' });
    expect(l.save.variants['c5.1']).toEqual(['plain', 'golden']);
    expect(befriended(content, l.save)[0]).toMatchObject({ variants: ['plain', 'golden'], look: 'golden' });
    // Earned once: a longer streak says nothing more.
    expect(variants(l.play('first'))).toEqual([]);
    expect(l.streak()).toBe(6);
  });

  it('start the streak again on a second try or an answer shown', () => {
    const l = new Learner();
    for (let i = 0; i < 4; i++) l.play('first');
    l.play('second');
    expect(l.streak()).toBe(0);
    for (let i = 0; i < 4; i++) l.play('first');
    l.play('shown');
    expect(l.streak()).toBe(0);
    for (let i = 0; i < 4; i++) l.play('first');
    expect(l.save.variants['c5.1']).toEqual(['plain']);
    expect(variants(l.play('first'))).toEqual(['golden']);
  });

  it('ignore a too-fast tap either way: it neither counts nor breaks the streak', () => {
    const l = new Learner(withText);
    for (let i = 0; i < 4; i++) l.play('first');
    l.save.activity = { kind: 'encounter', id: '5.1-b2-0', tries: 0 };
    const body = content.encounter('5.1-b2-0').body;
    expect(l.do({ type: 'answer', response: right(body), ms: 50 })).toEqual([{ type: 'tooFast' }]);
    expect(l.do({ type: 'answer', response: wrong(body), ms: 50 })).toEqual([{ type: 'tooFast' }]);
    expect(l.streak()).toBe(4);
    expect(variants(l.do({ type: 'answer', response: right(body), ms: 60_000 }))).toEqual(['golden']);
  });

  it('count Keeper battle answers and Goldie battle rounds on the Skill too', () => {
    const p = new Player();
    p.learn('sentence');
    p.encounter('sentence', 'first');
    p.save.skills['5.1']!.streak = 4;
    p.do({ type: 'review', creature: 'c5.1' });
    const a = p.save.activity;
    if (a?.kind !== 'review') throw new Error('no battle');
    expect(content.encounter(a.ids[0]!).skill).toBe('5.1');
    expect(variants(p.answerRight())).toEqual(['golden']);
  });
});

describe('shiny Creatures', () => {
  it('are only found on a first-try result, and only once', () => {
    const lucky = new Learner(content, () => 0);
    expect(lucky.play('second')).toContainEqual(expect.objectContaining({ type: 'befriended', shiny: false }));
    expect(lucky.save.variants['c5.1']).toEqual(['plain']);
    expect(variants(lucky.play('shown'))).toEqual([]);
    expect(variants(lucky.play('first'))).toEqual(['shiny']);
    expect(variants(lucky.play('first'))).toEqual([]);
    expect(lucky.save.variants['c5.1']).toEqual(['plain', 'shiny']);
  });

  it('can be caught on the very first Encounter, right first try', () => {
    const lucky = new Learner(content, () => 0);
    expect(lucky.play('first')).toContainEqual({ type: 'befriended', skill: '5.1', creature: 'c5.1', shiny: true });
    expect(befriended(content, lucky.save)[0]).toMatchObject({ look: 'shiny' });
  });
});

/** Mastered, so it can be battled. */
function mastered(save: Save, id: SkillId): Save {
  save.skills[id] = { taught: true, done: 6, xp: 60, recent: [{ outcome: 'first', band: 2, day: 90 }], mastered: true, masteredBand: 2, reviewMisses: 0, rusty: false, streak: 0 };
  return save;
}

/** Today's Goldie battle with `creature`, each round answered as given. */
function battle(p: Player, creature: string, rounds: ('first' | 'second' | 'shown')[]): GameEvent[] {
  p.do({ type: 'review', creature });
  if (p.save.activity?.kind !== 'review') throw new Error('no battle');
  const events: GameEvent[] = [];
  for (const how of rounds) {
    if (how === 'first') events.push(...p.answerRight());
    else events.push(...p.answerWrong(), ...(how === 'second' ? p.answerRight() : p.answerWrong()));
  }
  return events;
}
const done = (events: GameEvent[]) => events.find((e) => e.type === 'battleDone');

describe('Goldie battles', () => {
  it('are won with at least two rounds right first or second try', () => {
    expect(battleWon(['first', 'first', 'shown'])).toBe(true);
    expect(battleWon(['second', 'shown', 'second'])).toBe(true);
    expect(battleWon(['first', 'shown', 'shown'])).toBe(false);
    expect(battleWon(['shown', 'shown', 'shown'])).toBe(false);
  });

  it('hit the Goldie fully on a first try and half on a second; an answer shown lets the Goldie hit back', () => {
    expect(battleHp([])).toEqual({ you: GOLDIE_HP, foe: GOLDIE_HP });
    const full = GOLDIE_HP - battleHp(['first']).foe;
    expect(GOLDIE_HP - battleHp(['second']).foe).toBe(full / 2);
    expect(battleHp(['shown'])).toMatchObject({ foe: GOLDIE_HP });
    expect(battleHp(['shown']).you).toBeLessThan(GOLDIE_HP);
  });

  it('open as soon as one Creature is befriended, from a Skill not yet mastered', () => {
    const p = new Player();
    expect(reviewDue(content, p.save, p.day)).toBe(false);
    p.learn('sentence');
    p.encounter('sentence', 'second');
    expect(befriended(content, p.save)).toHaveLength(1);
    expect(reviewDue(content, p.save, p.day)).toBe(true);
    p.do({ type: 'review', creature: 'c5.1' });
    expect(p.save.activity).toMatchObject({ kind: 'review', fighter: 'c5.1', rounds: [] });
    expect(p.save.activity?.kind === 'review' && p.save.activity.ids).toHaveLength(3);
  });

  it('need a fighter the Student has befriended', () => {
    const p = new Player(mastered(mastered(newSave(TODAY), '5.1'), '1.1'));
    p.do({ type: 'review', creature: 'c5.2' });
    expect(p.save.activity).toBeUndefined();
    p.do({ type: 'review', creature: 'nobody' });
    expect(p.save.activity).toBeUndefined();
    p.do({ type: 'review', creature: 'c1.1' });
    expect(p.save.activity).toMatchObject({ kind: 'review', fighter: 'c1.1' });
  });

  it('count a win for the fighter, and a loss for nobody, with the answers still given', () => {
    const p = new Player(mastered(mastered(newSave(TODAY), '5.1'), '1.1'));
    const lost = battle(p, 'c5.1', ['first', 'shown', 'shown']);
    expect(lost.filter((e) => e.type === 'resolved').map((e) => e.type === 'resolved' && !!e.success)).toEqual([true, true, true]);
    expect(done(lost)).toEqual({ type: 'battleDone', won: false, creature: 'c5.1', wins: 0, first: 1, right: 1, of: 3 });
    expect(p.save.reviewDay).toBe(TODAY);
    p.day += 1;
    expect(done(battle(p, 'c5.1', ['second', 'shown', 'second']))).toMatchObject({ won: true, wins: 1 });
    expect(p.save.wins).toEqual({ 'c5.1': 1 });
  });

  it('make a Creature a Champion on its third win, with a reveal, once', () => {
    const p = new Player(mastered(mastered(newSave(TODAY), '5.1'), '1.1'));
    for (let i = 1; i < CHAMPION_WINS; i++) {
      expect(variants(battle(p, 'c1.1', ['first', 'first', 'first']))).not.toContain('champion');
      p.day += 1;
    }
    battle(p, 'c5.1', ['first', 'first', 'first']);
    p.day += 1;
    expect(p.save.wins).toEqual({ 'c1.1': 2, 'c5.1': 1 });
    const third = battle(p, 'c1.1', ['first', 'second', 'shown']);
    expect(done(third)).toMatchObject({ won: true, wins: 3 });
    expect(third).toContainEqual({ type: 'variant', skill: '1.1', creature: 'c1.1', variant: 'champion' });
    expect(befriended(content, p.save).find((c) => c.creature === 'c1.1')).toMatchObject({ variants: ['plain', 'champion'], look: 'champion', wins: 3 });
    p.day += 1;
    expect(variants(battle(p, 'c1.1', ['first', 'first', 'first']))).toEqual([]);
    expect(p.save.wins['c1.1']).toBe(4);
  });

  it('never change a Band, placement or mastery, even on a Skill not yet mastered', () => {
    const p = new Player();
    p.learn('sentence');
    p.encounter('sentence', 'first');
    const branches = structuredClone(p.save.branches);
    const before = { ...p.save.skills['5.1']! };
    battle(p, 'c5.1', ['first', 'first', 'first']);
    expect(p.save.branches).toEqual(branches);
    expect(p.save.skills['5.1']).toMatchObject({ mastered: false, done: before.done });
    expect(p.save.skills['5.1']!.masteredBand).toBeUndefined();
    p.day += 1;
    battle(p, 'c5.1', ['shown', 'shown', 'shown']);
    expect(p.save.branches).toEqual(branches);
    expect(p.save.skills['5.1']).toMatchObject({ mastered: false, done: before.done });
  });

  it('happen once a day', () => {
    const p = new Player(mastered(mastered(newSave(TODAY), '5.1'), '1.1'));
    battle(p, 'c5.1', ['first', 'first', 'first']);
    expect(reviewDue(content, p.save, p.day)).toBe(false);
    p.do({ type: 'review', creature: 'c5.1' });
    expect(p.save.activity).toBeUndefined();
    expect(reviewDue(content, p.save, p.day + 1)).toBe(true);
  });
});

describe('Swaps of variants', () => {
  it('add a variant the Student does not have, and only once', () => {
    const p = new Player();
    expect(p.do({ type: 'receive', creature: 'c5.2', variant: 'golden' })).toEqual([{ type: 'received', creature: 'c5.2', variant: 'golden', already: false }]);
    expect(befriended(content, p.save)).toMatchObject([{ creature: 'c5.2', received: true, variants: ['golden'], look: 'golden' }]);
    expect(p.do({ type: 'receive', creature: 'c5.2', variant: 'golden' })[0]).toMatchObject({ already: true });
    p.do({ type: 'receive', creature: 'c5.2', variant: 'plain' });
    expect(p.save.variants['c5.2']).toEqual(['plain', 'golden']);
  });

  it('say a plain one is already had once its Skill has been played', () => {
    const p = new Player();
    p.learn('sentence');
    p.encounter('sentence', 'second');
    expect(p.do({ type: 'receive', creature: 'c5.1', variant: 'plain' })[0]).toMatchObject({ already: true });
  });
});

describe('loading a save from before variants', () => {
  it('moves shinies and Swaps into variants and drops the old fields', () => {
    const old = { ...structuredClone(newSave(TODAY)), shinies: ['c5.1'], received: [{ creature: 'c5.2', shiny: false }, { creature: 'c1.1', shiny: true }] } as Partial<Save> & { started: number };
    delete old.variants;
    delete old.wins;
    old.skills = { '5.1': { taught: true, done: 2, xp: 20, recent: [], mastered: false, reviewMisses: 0, rusty: false, streak: 0 } };
    const loaded = upgradeSave(old);
    expect(loaded.variants).toEqual({ 'c5.1': ['shiny'], 'c5.2': ['plain'], 'c1.1': ['shiny'] });
    expect(loaded.wins).toEqual({});
    expect(loaded).not.toHaveProperty('shinies');
    expect(loaded).not.toHaveProperty('received');
    const mine = befriended(content, loaded);
    expect(mine.find((c) => c.creature === 'c5.1')).toMatchObject({ variants: ['plain', 'shiny'], received: false });
    expect(mine.find((c) => c.creature === 'c5.2')).toMatchObject({ variants: ['plain'], received: true });
    expect(mine.find((c) => c.creature === 'c1.1')).toMatchObject({ variants: ['shiny'], received: true });
  });

  it('gives Skills a streak of 0 and a review under way rounds that win nothing unearned', () => {
    const old = structuredClone(new Player().save) as unknown as Record<string, unknown> & { started: number };
    old.skills = { '5.1': { taught: true, done: 6, xp: 60, recent: [], mastered: true, reviewMisses: 0, rusty: false } };
    old.activity = { kind: 'review', ids: ['5.1-b2-0', '5.1-b2-1', '5.1-b2-2'], at: 2, tries: 0, firsts: 1 };
    const loaded = upgradeSave(old as unknown as Save);
    expect(loaded.skills['5.1']).toMatchObject({ streak: 0 });
    expect(loaded.activity).toEqual({ kind: 'review', ids: ['5.1-b2-0', '5.1-b2-1', '5.1-b2-2'], at: 2, tries: 0, rounds: ['first', 'shown'], phase: 'task', fighter: '' });
  });
});

describe('restoring from a Backup code', () => {
  it('gives a valid save whose restored Creatures are caught plain, with no rare variants or wins', () => {
    const data = restorable(content, newSave(TODAY));
    data.sentence = { position: 2, band: 3 };
    const restored = restore(content, data, 300);
    expect(upgradeSave(structuredClone(restored))).toEqual(restored);
    expect(restored).toMatchObject({ variants: {}, wins: {} });
    expect(restored.skills['5.1']).toMatchObject({ streak: 0 });
    expect(befriended(content, restored).map((c) => [c.creature, c.variants])).toEqual([
      ['c5.1', ['plain']],
      ['c5.2', ['plain']],
    ]);
  });
});

describe('the Field Guide', () => {
  it('lists every Skill Creature and every Keeper partner by Island, and counts what is caught', () => {
    const empty = guideCounts(fieldGuide(content, newSave(TODAY)));
    const skills = content.branches.reduce((n, b) => n + content.skillsOf(b.id).length, 0);
    const keepers = content.branches.filter((b) => b.marked && content.skillsOf(b.id).length > 0).length;
    expect(empty).toEqual({ caught: 0, total: skills + keepers, shiny: 0, golden: 0, champion: 0 });

    const save = mastered(newSave(TODAY), '5.1');
    save.variants = { 'c5.1': ['plain', 'shiny', 'champion'], 'c5.2': ['golden'], 'c1.1': ['shiny', 'golden'] };
    save.branches.sentence.keeper = true;
    const guide = fieldGuide(content, save);
    expect(guide.map((i) => i.branch.id)).toEqual(['sentence', 'between']);
    expect(guide[0]!.entries.map((e) => e.creature)).toEqual(['c5.1', 'c5.2', 'c5.3', 'c5.4', 'k5']);
    expect(guide[0]!.entries.at(-1)).toMatchObject({ kind: 'keeper', name: 'k5', keeper: 'Keeper', met: true });
    expect(guideCounts(guide)).toEqual({ caught: 4, total: skills + keepers, shiny: 2, golden: 2, champion: 1 });
  });

  it('says how to get each variant, naming the move', () => {
    const save = mastered(newSave(TODAY), '5.1');
    save.skills['5.1']!.streak = 3;
    save.wins['c5.1'] = 1;
    const skill = content.skill('5.1');
    expect(variantHint(content, save, skill, 'golden')).toBe("Golden: get 5 right first try in a row on Skill 5.1. You're on 3.");
    expect(variantHint(content, save, skill, 'champion')).toBe('Champion: win 3 Goldie battles with Critter 5.1. 1 won so far.');
    expect(variantHint(content, save, skill, 'shiny')).toMatch(/right first try/);
    expect(variantHint(content, save, skill, 'plain')).toMatch(/long grass on Quill Isle/);
  });
});
