import { describe, expect, it } from 'vitest';
import { buildContent } from '../src/content/bank';
import type { SkillId } from '../src/content/types';
import { newSave, type Save } from '../src/core/save';
import { alertsFor, goalFor, islandProgress } from '../src/world/goal';
import { branches, content, Player } from './fixture';

const TODAY = 100;

function master(save: Save, ...ids: SkillId[]): Save {
  for (const id of ids) save.skills[id] = { taught: true, done: 6, xp: 60, recent: [], mastered: true, reviewMisses: 0, rusty: false };
  return save;
}

describe('goal on an Island', () => {
  it('sends a fresh Student to the crew first', () => {
    const goal = goalFor(content, newSave(TODAY), 'sentence', TODAY);
    expect(goal).toMatchObject({ kind: 'crew', label: 'TULLY' });
    expect(goal.line).toContain('Tully');
  });

  it('sends the Student into the long grass once a Skill is taught', () => {
    const p = new Player();
    p.learn('sentence');
    expect(goalFor(content, p.save, 'sentence', TODAY)).toMatchObject({ kind: 'grass', label: 'LONG GRASS' });
  });

  it('points at the Keeper once the near side is mastered', () => {
    const goal = goalFor(content, master(newSave(TODAY), '5.1', '5.2'), 'sentence', TODAY);
    expect(goal.kind).toBe('keeper');
    expect(goal.line).toMatch(/ready.*Keeper/);
  });

  it('sends a Student back to finish an Encounter left midway', () => {
    const p = new Player();
    p.learn('sentence');
    p.do({ type: 'begin', branch: 'sentence' });
    expect(goalFor(content, p.save, 'sentence', TODAY).kind).toBe('grass');
  });

  it('sends the Student to the dock and names the next Island when this one is done', () => {
    const save = master(newSave(TODAY), '5.1', '5.2', '5.3', '5.4');
    save.branches.sentence.keeper = true;
    const goal = goalFor(content, save, 'sentence', TODAY);
    expect(goal).toMatchObject({ kind: 'boat', label: 'DOCK' });
    expect(goal.line).toContain('Peer Island');
  });

  it('words workshop grass around writing', () => {
    const prompt = (id: `${number}.${number}`) => ({
      skill: {
        ...content.skill('5.1'),
        id,
        teach: { ...content.skill('5.1').teach, crew: 'artist' as const },
        creature: { id: `w${id}`, name: 'Inky', evolved: 'Big Inky', blurb: '' },
        workshop: { mentor: 'Once.', ask: 'Write.', checklist: ['Hooks'] },
      },
      encounters: [],
    });
    const bank = buildContent(branches, [prompt('9.1'), prompt('9.2')]);
    const save = newSave(TODAY);
    save.skills['9.1'] = { taught: true, done: 0, xp: 0, recent: [], mastered: false, reviewMisses: 0, rusty: false };
    const goal = goalFor(bank, save, 'workshop', TODAY);
    expect(goal.kind).toBe('grass');
    expect(goal.line).toMatch(/writ/i);
  });

  it('always shows a ! on the goal', () => {
    const save = master(newSave(TODAY), '5.1', '5.2', '5.3', '5.4');
    save.branches.sentence.keeper = true;
    expect(alertsFor(content, save, 'sentence', TODAY).boat).toBe(true);
  });
});

describe('goal on Home Island', () => {
  it('sends the Student to the dock with an Island to sail to', () => {
    const goal = goalFor(content, newSave(TODAY), 'home', TODAY);
    expect(goal).toMatchObject({ kind: 'boat', label: 'DOCK' });
    expect(goal.line).toContain('Quill Isle');
  });

  it('prefers the last Island played while it is unfinished', () => {
    const save = newSave(TODAY);
    save.branches.between.lastDay = TODAY - 1;
    expect(goalFor(content, save, 'home', TODAY).line).toContain('Peer Island');
  });

  it('sends a brand-new student to their first island, not to the Tide quest', () => {
    const save = newSave(TODAY);
    save.tide = { day: TODAY, branch: 'between', done: false };
    const goal = goalFor(content, save, 'home', TODAY);
    expect(goal.kind).toBe('boat');
    expect(goal.line).toContain('first rescue');
  });

  it('points at the notice board when a Tide quest is open', () => {
    const save = newSave(TODAY);
    save.skills['1.1'] = { taught: true, done: 0, xp: 0, recent: [], mastered: false, reviewMisses: 0, rusty: false };
    save.tide = { day: TODAY, branch: 'between', done: false };
    const goal = goalFor(content, save, 'home', TODAY);
    expect(goal.kind).toBe('board');
    expect(goal.line).toContain('Peer Island');
  });

  it('ignores yesterday’s Tide quest', () => {
    const save = newSave(TODAY);
    save.tide = { day: TODAY - 1, branch: 'between', done: false };
    expect(goalFor(content, save, 'home', TODAY).kind).toBe('boat');
  });
});

describe('island progress', () => {
  it('is mastered Skills over Skills', () => {
    expect(islandProgress(content, master(newSave(TODAY), '5.1'), 'sentence')).toBe(0.25);
    expect(islandProgress(content, newSave(TODAY), 'whose')).toBe(0);
  });
});
