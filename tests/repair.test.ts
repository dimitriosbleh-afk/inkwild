import { describe, expect, it } from 'vitest';
import { repairSave } from '../src/core/repair';
import { newSave, upgradeSave, type Save } from '../src/core/save';
import { content } from './fixture';

const withActivity = (activity: Save['activity']): Save => ({ ...newSave(100), ...(activity ? { activity } : {}) });

describe('a save from before a content update', () => {
  it('keeps an activity whose Skill and Encounters still exist', () => {
    const save = withActivity({ kind: 'encounter', id: '5.1-b2-0', tries: 1 });
    expect(repairSave(content, save)).toEqual(save);
  });

  it('drops an Encounter that no longer exists, instead of crashing every launch', () => {
    const save = withActivity({ kind: 'encounter', id: '5.1-b2-999', tries: 0 });
    expect(repairSave(content, save).activity).toBeUndefined();
  });

  it('drops teaching for a Skill that no longer exists', () => {
    expect(repairSave(content, withActivity({ kind: 'teach', skill: '5.99', step: 1, tries: 0 })).activity).toBeUndefined();
  });

  it('drops a Goldie battle with any missing round, or one already past its last round', () => {
    const battle = (ids: string[], at: number): Save['activity'] => ({ kind: 'review', ids, at, tries: 0, rounds: [], phase: 'task', fighter: 'c5.1', day: 100 });
    expect(repairSave(content, withActivity(battle(['5.1-b2-0', '5.1-b2-1', '5.1-b2-2'], 1))).activity).toBeDefined();
    expect(repairSave(content, withActivity(battle(['5.1-b2-0', 'gone-b2-1', '5.1-b2-2'], 0))).activity).toBeUndefined();
    expect(repairSave(content, withActivity(battle(['5.1-b2-0'], 1))).activity).toBeUndefined();
  });

  it('keeps everything else, even progress on Skills it no longer knows', () => {
    const save = withActivity({ kind: 'encounter', id: 'gone-b2-1', tries: 0 });
    save.skills['5.99'] = { taught: true, done: 3, xp: 30, recent: [], mastered: false, reviewMisses: 0, rusty: false, streak: 0 };
    save.variants.cgone = ['plain', 'golden'];
    const fixed = repairSave(content, save);
    expect(fixed.skills['5.99']?.xp).toBe(30);
    expect(fixed.variants.cgone).toEqual(['plain', 'golden']);
  });
});

describe('upgrading odd old saves', () => {
  it('survives null or broken legacy Creature lists', () => {
    const stored = { started: 100, shinies: null, received: [null, { creature: 'c5.1', shiny: true }] } as unknown as Save;
    expect(upgradeSave(stored).variants).toEqual({ 'c5.1': ['shiny'] });
  });

  it('fills in fields an old Branch record is missing', () => {
    const stored = { started: 100, branches: { sentence: { band: 3 } } } as unknown as Save;
    expect(upgradeSave(stored).branches.sentence).toEqual({ band: 3, placing: 6, recent: [], keeper: false });
  });

  it('keeps the day a Goldie battle started', () => {
    const stored = withActivity({ kind: 'review', ids: ['5.1-b2-0'], at: 0, tries: 0, rounds: [], phase: 'task', fighter: 'c5.1', day: 99 });
    expect(upgradeSave(JSON.parse(JSON.stringify(stored)) as Save).activity).toMatchObject({ day: 99 });
  });
});
