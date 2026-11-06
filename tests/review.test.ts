import { describe, expect, it } from 'vitest';
import type { SkillId } from '../src/content/types';
import { step, type GameEvent } from '../src/core/game';
import { poolKey } from '../src/core/pick';
import { reviewDue, reviewFor } from '../src/core/review';
import { newSave, type Save } from '../src/core/save';
import { alertsFor, goalFor } from '../src/world/goal';
import { content, Player } from './fixture';

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
  };
  return save;
}

const skillsOf = (ids: string[]) => ids.map((id) => content.encounter(id).skill);

describe('choosing a Daily review', () => {
  it('waits until two Skills are mastered', () => {
    expect(reviewFor(content, newSave(TODAY), TODAY, rand)).toEqual([]);
    expect(reviewFor(content, mastered(newSave(TODAY), '5.1', 90), TODAY, rand)).toEqual([]);
    expect(reviewFor(content, mastered(mastered(newSave(TODAY), '5.1', 90), '5.2', 80), TODAY, rand)).toHaveLength(2);
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
    p.do({ type: 'review' });
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
    p.do({ type: 'review' });
    for (let i = 0; i < 3; i++) {
      p.answerWrong();
      expect(types(p.answerWrong())).not.toContain('evolved');
    }
    expect(p.save.branches).toEqual(branches);
    for (const id of ['5.1', '5.2', '1.1'] as const) expect(p.save.skills[id]).toMatchObject({ mastered: true, masteredBand: 2 });
    expect(xp(p.save)).toBeGreaterThan(before);
  });

  it('reports first-try answers at the end and blocks a second review the same day', () => {
    const p = reviewer();
    p.do({ type: 'review' });
    p.answerRight();
    p.answerWrong();
    p.answerRight();
    const last = p.answerRight();
    expect(last).toContainEqual({ type: 'reviewDone', first: 2, of: 3 });
    expect(p.save.activity).toBeUndefined();
    expect(p.save.reviewDay).toBe(TODAY);
    p.do({ type: 'review' });
    expect(p.save.activity).toBeUndefined();
    p.day += 1;
    p.do({ type: 'review' });
    expect(p.save.activity).toMatchObject({ kind: 'review' });
  });

  it('brings back other Skills next time, because a review counts as practice for choosing', () => {
    const p = reviewer();
    p.do({ type: 'review' });
    const first = p.save.activity?.kind === 'review' ? skillsOf(p.save.activity.ids) : [];
    for (let i = 0; i < 3; i++) p.answerRight();
    p.save = mastered(p.save, '5.3', 70);
    p.day += 1;
    p.do({ type: 'review' });
    const next = p.save.activity?.kind === 'review' ? skillsOf(p.save.activity.ids) : [];
    expect(first).toHaveLength(3);
    expect(next[0]).toBe('5.3');
  });

  it('ends without credit on RETREAT', () => {
    const p = reviewer();
    p.do({ type: 'review' });
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
    p.do({ type: 'review' });
    expect(p.save.activity).toEqual(midway);
  });

  it('is pure: the save passed in is untouched', () => {
    const save = reviewer().save;
    const copy = structuredClone(save);
    step(content, save, { type: 'review' }, { day: TODAY, rand });
    expect(save).toEqual(copy);
  });
});

describe('Daily review on Home Island', () => {
  it('puts a ! on the long grass with the REVIEW label, after an open Tide quest', () => {
    const save = mastered(mastered(newSave(TODAY), '5.1', 90), '1.1', 90);
    expect(goalFor(content, save, 'home', TODAY)).toEqual({ kind: 'grass', label: 'REVIEW', line: "Daily review: three quick moves from islands you've done." });
    expect(alertsFor(content, save, 'home', TODAY).grass).toBe(true);
    save.tide = { day: TODAY, branch: 'between', done: false };
    expect(goalFor(content, save, 'home', TODAY).kind).toBe('board');
    expect(alertsFor(content, save, 'home', TODAY).grass).toBe(true);
    save.tide.done = true;
    save.reviewDay = TODAY;
    expect(goalFor(content, save, 'home', TODAY).kind).toBe('boat');
    expect(alertsFor(content, save, 'home', TODAY).grass).toBe(false);
  });

  it('keeps pointing at the review while one is under way, and leaves Island goals alone', () => {
    const p = reviewer();
    p.do({ type: 'review' });
    expect(goalFor(content, p.save, 'home', TODAY).label).toBe('REVIEW');
    expect(goalFor(content, p.save, 'between', TODAY).line).not.toMatch(/waiting in the long grass/);
  });
});
