import { describe, expect, it } from 'vitest';
import type { SkillId } from '../src/content/types';
import { step, type GameEvent } from '../src/core/game';
import { poolKey } from '../src/core/pick';
import { reviewDue, reviewFor } from '../src/core/review';
import { newSave, type Save } from '../src/core/save';
import { alertsFor, goalFor } from '../src/world/goal';
import { content, Player, right } from './fixture';

const TODAY = 100;
const rand = () => 0.42;

/** Mastered, with its newest practice on `lastDay`. */
function mastered(save: Save, id: SkillId, lastDay: number): Save {
  save.skills[id] = {
    taught: true,
    done: 6,
    xp: 60,
    recent: [
      { outcome: 'first', band: 2, day: lastDay - 1 },
      { outcome: 'first', band: 2, day: lastDay },
    ],
    mastered: true,
    masteredBand: 2,
    reviewMisses: 0,
    rusty: false,
    streak: 0,
  };
  return save;
}

const skillsOf = (ids: string[]) => ids.map((id) => content.encounter(id).skill);

describe('choosing a Daily review', () => {
  it('has nothing until a Skill is taught and played, then always three rounds', () => {
    expect(reviewFor(content, newSave(TODAY), TODAY, rand)).toEqual([]);
    const one = reviewFor(content, mastered(newSave(TODAY), '5.1', 90), TODAY, rand);
    expect(one).toHaveLength(3);
    expect(new Set(one).size).toBe(3);
    expect(new Set(skillsOf(one))).toEqual(new Set(['5.1']));
    const two = reviewFor(content, mastered(mastered(newSave(TODAY), '5.1', 90), '5.2', 80), TODAY, rand);
    expect(two).toHaveLength(3);
    expect(new Set(skillsOf(two))).toEqual(new Set(['5.1', '5.2']));
  });

  it('draws from taught Skills played at least once until two are mastered, then only from mastered ones', () => {
    const save = newSave(TODAY);
    save.skills['5.1'] = { taught: true, done: 1, xp: 10, recent: [{ outcome: 'second', band: 2, day: 99 }], mastered: false, reviewMisses: 0, rusty: false, streak: 0 };
    save.skills['5.2'] = { taught: true, done: 0, xp: 0, recent: [], mastered: false, reviewMisses: 0, rusty: false, streak: 0 };
    expect(new Set(skillsOf(reviewFor(content, save, TODAY, rand)))).toEqual(new Set(['5.1']));
    mastered(mastered(save, '1.1', 90), '1.2', 90);
    expect(new Set(skillsOf(reviewFor(content, save, TODAY, rand)))).toEqual(new Set(['1.1', '1.2']));
  });

  it('picks the longest-unpractised Skills, one Encounter each', () => {
    const save = newSave(TODAY);
    for (const [id, day] of [['5.1', 90], ['5.2', 50], ['5.3', 70], ['1.1', 95], ['1.2', 60]] as const) mastered(save, id, day);
    const skills = skillsOf(reviewFor(content, save, TODAY, rand));
    expect(skills).toHaveLength(3);
    expect(new Set(skills)).toEqual(new Set(['5.2', '1.2', '5.3']));
  });

  it('spreads across Islands before taking a second Skill from one', () => {
    const save = newSave(TODAY);
    for (const [id, day] of [['5.1', 10], ['5.2', 20], ['5.3', 30], ['1.1', 90]] as const) mastered(save, id, day);
    expect(new Set(skillsOf(reviewFor(content, save, TODAY, rand)))).toEqual(new Set(['5.1', '1.1', '5.2']));
  });

  it('uses each Skill’s Island Band and avoids Encounters seen lately', () => {
    const save = mastered(mastered(newSave(TODAY), '5.1', 90), '1.1', 90);
    save.branches.sentence.band = 4;
    const pool = content.pool('5.1', 4);
    save.seen[poolKey('5.1', 4)] = pool.slice(1).map((e) => e.id);
    for (let i = 0; i < 5; i++) {
      const ids = reviewFor(content, save, TODAY, () => i / 5);
      expect(ids.find((id) => content.encounter(id).skill === '5.1')).toBe(pool[0]!.id);
    }
  });

  it('is done for the day once finished', () => {
    const save = mastered(mastered(newSave(TODAY), '5.1', 90), '1.1', 90);
    expect(reviewDue(content, save, TODAY)).toBe(true);
    save.reviewDay = TODAY;
    expect(reviewFor(content, save, TODAY, rand)).toEqual([]);
    expect(reviewDue(content, save, TODAY)).toBe(false);
    expect(reviewDue(content, save, TODAY + 1)).toBe(true);
  });
});

function reviewer(): Player {
  const save = newSave(TODAY);
  for (const [id, day] of [['5.1', 90], ['5.2', 50], ['1.1', 60]] as const) mastered(save, id, day);
  return new Player(save);
}

const types = (events: GameEvent[]) => events.map((e) => e.type);

describe('playing a Daily review', () => {
  it('works like an Encounter: a Second look, then the success line', () => {
    const p = reviewer();
    p.do({ type: 'review', creature: 'c5.1' });
    expect(p.save.activity).toMatchObject({ kind: 'review', at: 0, tries: 0 });
    expect(p.answerWrong()).toEqual([{ type: 'secondLook', reason: expect.any(String) }]);
    const success = p.task().success;
    expect(p.answerRight()[0]).toEqual({ type: 'resolved', outcome: 'second', success });
    expect(p.save.activity).toMatchObject({ kind: 'review', at: 1, tries: 0 });
  });

  it('never changes a Band, placement, mastery or Island streak, and gives XP', () => {
    const p = reviewer();
    const branches = structuredClone(p.save.branches);
    const xp = (s: Save) => Object.values(s.skills).reduce((sum, sk) => sum + (sk?.xp ?? 0), 0);
    const before = xp(p.save);
    p.do({ type: 'review', creature: 'c5.1' });
    // Two shown (no XP: the Creature slipped away) and one second try.
    for (let i = 0; i < 3; i++) {
      p.answerWrong();
      expect(types(i < 2 ? p.answerWrong() : p.answerRight())).not.toContain('evolved');
    }
    expect(p.save.branches).toEqual(branches);
    for (const id of ['5.1', '5.2', '1.1'] as const) expect(p.save.skills[id]).toMatchObject({ mastered: true, masteredBand: 2 });
    expect(xp(p.save)).toBeGreaterThan(before);
  });

  it('reports first-try answers at the end and blocks a second review the same day', () => {
    const p = reviewer();
    p.do({ type: 'review', creature: 'c5.1' });
    p.answerRight();
    p.answerWrong();
    p.answerRight();
    const last = p.answerRight();
    expect(last).toContainEqual({ type: 'battleDone', won: true, creature: 'c5.1', wins: 1, first: 2, right: 3, of: 3 });
    expect(p.save.activity).toBeUndefined();
    expect(p.save.reviewDay).toBe(TODAY);
    p.do({ type: 'review', creature: 'c5.1' });
    expect(p.save.activity).toBeUndefined();
    p.day += 1;
    p.do({ type: 'review', creature: 'c5.1' });
    expect(p.save.activity).toMatchObject({ kind: 'review' });
  });

  it('brings back other Skills next time, because a review counts as practice for choosing', () => {
    const p = reviewer();
    p.do({ type: 'review', creature: 'c5.1' });
    const first = p.save.activity?.kind === 'review' ? skillsOf(p.save.activity.ids) : [];
    for (let i = 0; i < 3; i++) p.answerRight();
    p.save = mastered(p.save, '5.3', 70);
    p.day += 1;
    p.do({ type: 'review', creature: 'c5.1' });
    const next = p.save.activity?.kind === 'review' ? skillsOf(p.save.activity.ids) : [];
    expect(first).toHaveLength(3);
    expect(next[0]).toBe('5.3');
  });

  it('ends without credit on RETREAT', () => {
    const p = reviewer();
    p.do({ type: 'review', creature: 'c5.1' });
    p.answerRight();
    p.do({ type: 'retreat' });
    expect(p.save.activity).toBeUndefined();
    expect(p.save.reviewDay).toBeUndefined();
    expect(reviewDue(content, p.save, TODAY)).toBe(true);
  });

  it('waits while another activity is midway', () => {
    const p = reviewer();
    p.do({ type: 'begin', branch: 'sentence' });
    const midway = p.save.activity;
    p.do({ type: 'review', creature: 'c5.1' });
    expect(p.save.activity).toEqual(midway);
  });

  it('is pure: the save passed in is untouched', () => {
    const save = reviewer().save;
    const copy = structuredClone(save);
    step(content, save, { type: 'review', creature: 'c5.1' }, { day: TODAY, rand });
    expect(save).toEqual(copy);
  });
});

/** Every answer in today's review: right first try, or missed first try. */
function playReview(p: Player, how: 'first' | 'miss'): SkillId[] {
  p.do({ type: 'review', creature: 'c5.1' });
  const a = p.save.activity;
  if (a?.kind !== 'review') throw new Error('no review');
  for (let i = 0; i < a.ids.length; i++) {
    if (how === 'first') p.answerRight();
    else {
      p.answerWrong();
      p.answerRight();
    }
  }
  return skillsOf(a.ids) as SkillId[];
}

describe('Daily review misses and rusty Skills', () => {
  it('counts a miss, makes a Skill rusty after two in a row, and clears both on a right first try', () => {
    const p = reviewer();
    const ids = ['5.1', '5.2', '1.1'] as const;
    const branches = structuredClone(p.save.branches);
    expect(new Set(playReview(p, 'miss'))).toEqual(new Set(ids));
    for (const id of ids) expect(p.save.skills[id]).toMatchObject({ reviewMisses: 1, rusty: false });
    p.day += 1;
    playReview(p, 'miss');
    for (const id of ids) expect(p.save.skills[id]).toMatchObject({ reviewMisses: 2, rusty: true });
    p.day += 1;
    playReview(p, 'first');
    for (const id of ids) expect(p.save.skills[id]).toMatchObject({ reviewMisses: 0, rusty: false });
    for (const id of ids) expect(p.save.skills[id]).toMatchObject({ mastered: true, masteredBand: 2 });
    expect(p.save.branches).toEqual(branches);
  });

  it('a right first try in between starts the count again', () => {
    const p = reviewer();
    playReview(p, 'miss');
    p.day += 1;
    playReview(p, 'first');
    p.day += 1;
    playReview(p, 'miss');
    for (const id of ['5.1', '5.2', '1.1'] as const) expect(p.save.skills[id]).toMatchObject({ reviewMisses: 1, rusty: false });
  });

  it('never takes mastery or a Band away from a rusty Skill', () => {
    const p = reviewer();
    const branches = structuredClone(p.save.branches);
    for (let day = 0; day < 4; day++) {
      playReview(p, 'miss');
      p.day += 1;
    }
    expect(p.save.skills['5.1']).toMatchObject({ rusty: true, mastered: true, masteredBand: 2 });
    expect(p.save.branches).toEqual(branches);
  });
});

describe('choosing a Daily review with misses', () => {
  const mark = (save: Save, id: SkillId, reviewMisses: number) => {
    save.skills[id] = { ...save.skills[id]!, reviewMisses, rusty: reviewMisses >= 2 };
    return save;
  };
  const fiveMastered = () => {
    const save = newSave(TODAY);
    for (const [id, day] of [['5.1', 95], ['5.2', 50], ['5.3', 70], ['1.1', 90], ['1.2', 60]] as const) mastered(save, id, day);
    return save;
  };

  it('puts rusty Skills first, then ones missed last time, then the longest unpractised', () => {
    const save = mark(mark(fiveMastered(), '5.1', 2), '1.1', 1);
    expect(skillsOf(reviewFor(content, save, TODAY, rand))).toEqual(['5.1', '1.1', '5.2']);
  });

  it('takes every rusty Skill before spreading across Islands', () => {
    const save = mark(mark(fiveMastered(), '5.1', 2), '5.3', 3);
    const skills = skillsOf(reviewFor(content, save, TODAY, rand));
    expect(skills.slice(0, 2)).toEqual(['5.3', '5.1']);
    expect(skills[2]).toBe('1.2');
  });

  it('puts a rusty Skill first even before two are mastered', () => {
    const save = mark(mastered(newSave(TODAY), '5.1', 90), '5.1', 2);
    save.skills['1.1'] = { taught: true, done: 2, xp: 20, recent: [], mastered: false, reviewMisses: 0, rusty: false, streak: 0 };
    expect(skillsOf(reviewFor(content, save, TODAY, rand))[0]).toBe('5.1');
  });
});

describe('the refresher before a rusty Skill', () => {
  /** The fixture's one I do step, marked as the trap. */
  const trapped: typeof content = {
    ...content,
    skill: (id) => {
      const s = content.skill(id);
      return { ...s, teach: { ...s.teach, iDo: { ...s.teach.iDo, steps: s.teach.iDo.steps.map((st) => ({ ...st, trap: true })) } } };
    },
  };
  const ctx = { day: TODAY, rand };
  const rustySave = () => {
    const save = reviewer().save;
    save.skills['5.1'] = { ...save.skills['5.1']!, reviewMisses: 2, rusty: true };
    return save;
  };

  it('opens on the trap step, waits for it, then plays the item', () => {
    let save = step(trapped, rustySave(), { type: 'review', creature: 'c5.1' }, ctx).save;
    expect(save.activity).toMatchObject({ kind: 'review', at: 0, phase: 'refresher' });
    expect(skillsOf((save.activity as { ids: string[] }).ids)[0]).toBe('5.1');
    const id = (save.activity as { ids: string[] }).ids[0]!;
    const early = step(trapped, save, { type: 'answer', response: right(content.encounter(id).body) }, ctx);
    expect(early.events).toEqual([]);
    expect(early.save).toEqual(save);
    save = step(trapped, save, { type: 'advance' }, ctx).save;
    expect(save.activity).toMatchObject({ kind: 'review', at: 0, phase: 'task' });
    const answered = step(trapped, save, { type: 'answer', response: right(content.encounter(id).body) }, ctx);
    expect(answered.events[0]).toMatchObject({ type: 'resolved', outcome: 'first' });
    expect(answered.save.activity).toMatchObject({ kind: 'review', at: 1, phase: 'task' });
    expect(answered.save.skills['5.1']).toMatchObject({ rusty: false, reviewMisses: 0, mastered: true });
  });

  it('skips the refresher for a Skill that is not rusty, or has no trap step', () => {
    const fresh = step(trapped, reviewer().save, { type: 'review', creature: 'c5.1' }, ctx).save;
    expect(fresh.activity).toMatchObject({ phase: 'task' });
    const noTrap = step(content, rustySave(), { type: 'review', creature: 'c5.1' }, ctx).save;
    expect(noTrap.activity).toMatchObject({ phase: 'task' });
  });
});

describe('Daily review on Home Island', () => {
  it('puts a ! on the long grass with the GOLDIE BATTLE label, ahead of an open Tide quest', () => {
    const save = mastered(mastered(newSave(TODAY), '5.1', 90), '1.1', 90);
    expect(goalFor(content, save, 'home', TODAY)).toEqual({ kind: 'grass', label: 'GOLDIE BATTLE', line: 'A Goldie wants to battle! Pick a Creature and fight.' });
    expect(alertsFor(content, save, 'home', TODAY).grass).toBe(true);
    save.tide = { day: TODAY, branch: 'between', done: false };
    expect(goalFor(content, save, 'home', TODAY).kind).toBe('grass');
    expect(alertsFor(content, save, 'home', TODAY).grass).toBe(true);
    save.reviewDay = TODAY;
    expect(goalFor(content, save, 'home', TODAY).kind).toBe('board');
    save.tide.done = true;
    expect(goalFor(content, save, 'home', TODAY).kind).toBe('boat');
    expect(alertsFor(content, save, 'home', TODAY).grass).toBe(false);
  });

  it('keeps pointing at the review while one is under way, and leaves Island goals alone', () => {
    const p = reviewer();
    p.do({ type: 'review', creature: 'c5.1' });
    expect(goalFor(content, p.save, 'home', TODAY).label).toBe('GOLDIE BATTLE');
    expect(goalFor(content, p.save, 'between', TODAY).line).not.toMatch(/waiting in the long grass/);
  });
});
