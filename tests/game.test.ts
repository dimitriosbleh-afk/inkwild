import { describe, expect, it } from 'vitest';
import { befriended } from '../src/core/creatures';
import { HIT, KEEPER_HP } from '../src/core/game';
import { newSave, type Save } from '../src/core/save';
import { content, Player } from './fixture';

const types = (events: { type: string }[]) => events.map((e) => e.type);

function settled(band: 1 | 2 | 3 | 4) {
  const save = newSave(100);
  save.branches.sentence = { band, placing: 0, recent: [], keeper: false };
  save.branches.between = { band, placing: 0, recent: [], keeper: false };
  return new Player(save);
}

describe('Teach sequence', () => {
  it('teaches the first Skill before any Encounter', () => {
    const p = new Player();
    p.do({ type: 'begin', branch: 'sentence' });
    expect(p.save.activity).toMatchObject({ kind: 'teach', skill: '5.1', step: 0 });

    p.answerRight();
    expect(p.save.activity).toMatchObject({ kind: 'teach', step: 0 });

    p.do({ type: 'advance' });
    expect(p.task().prompt).toBe('prompt 100');
    p.answerRight();
    expect(p.task().prompt).toBe('prompt 101');
    expect(types(p.answerRight())).toContain('taught');

    p.do({ type: 'begin', branch: 'sentence' });
    expect(p.save.activity?.kind).toBe('encounter');
  });

  it('does not count We do answers towards Bands or creatures', () => {
    const p = new Player();
    p.learn('sentence');
    expect(p.save.branches.sentence.recent).toEqual([]);
    expect(befriended(content, p.save)).toEqual([]);
  });
});

describe('Second look', () => {
  it('gives the reason for the chosen wrong option, then another try', () => {
    const p = new Player();
    p.learn('sentence');
    p.do({ type: 'begin', branch: 'sentence' });
    const id = p.save.activity;
    expect(p.answerWrong()).toEqual([{ type: 'secondLook', reason: expect.stringMatching(/^reason a/) }]);
    expect(p.save.activity).toMatchObject({ kind: 'encounter' });
    expect(p.save.activity).toEqual({ ...id, tries: 1 });
    const events = p.answerRight();
    expect(events[0]).toMatchObject({ type: 'resolved', outcome: 'second' });
    expect(p.save.activity).toBeUndefined();
  });

  it('shows the answer with its reason after two wrong tries, and nothing is lost', () => {
    const p = new Player();
    p.learn('sentence');
    const events = p.encounter('sentence', 'shown');
    expect(events.find((e) => e.type === 'resolved')).toMatchObject({ outcome: 'shown', reason: expect.any(String) });
    expect(befriended(content, p.save)).toHaveLength(1);
  });
});

describe('route', () => {
  it('unlocks the next Skill after its Teach sequence and three Encounters', () => {
    const p = settled(2);
    p.learn('sentence');
    p.encounter('sentence', 'first');
    p.encounter('sentence', 'shown');
    expect(types(p.encounter('sentence', 'second'))).toContain('unlocked');
    p.do({ type: 'begin', branch: 'sentence' });
    expect(p.save.activity).toMatchObject({ kind: 'teach', skill: '5.2' });
  });

  it('keeps far-side Skills locked until the Keeper is beaten', () => {
    const p = masterNearSide();
    const unlocked = p.save.skills['5.3'];
    expect(unlocked).toBeUndefined();
    p.do({ type: 'begin', branch: 'sentence' });
    expect(p.save.activity?.kind).toBe('encounter');
    expect(content.encounter((p.save.activity as { id: string }).id).skill).not.toBe('5.3');
  });
});

describe('Bands', () => {
  it('starts every Branch at Band 2', () => {
    const p = new Player();
    p.learn('sentence');
    p.nextEncounter('sentence');
    expect(p.currentEncounterBand()).toBe(2);
  });

  it('moves up after two first-try Encounters while placing', () => {
    const p = new Player();
    p.learn('sentence');
    p.encounter('sentence', 'first');
    p.encounter('sentence', 'first');
    p.nextEncounter('sentence');
    expect(p.currentEncounterBand()).toBe(3);
  });

  it('moves down after two Encounters needing a Second look while placing', () => {
    const p = new Player();
    p.learn('sentence');
    p.encounter('sentence', 'second');
    p.encounter('sentence', 'shown');
    p.nextEncounter('sentence');
    expect(p.currentEncounterBand()).toBe(1);
  });

  it('after placement, moves up only after five of the last six are first try', () => {
    const p = settled(2);
    p.learn('sentence');
    for (const how of ['second', 'first', 'first', 'first', 'second', 'first'] as const) p.encounter('sentence', how);
    p.nextEncounter('sentence');
    expect(p.currentEncounterBand()).toBe(2);
    p.answerRight();
    p.nextEncounter('sentence');
    expect(p.currentEncounterBand()).toBe(3);
  });

  it('after placement, moves down after three Encounters needing the answer shown', () => {
    const p = settled(3);
    p.learn('sentence');
    p.encounter('sentence', 'shown');
    p.encounter('sentence', 'first');
    p.encounter('sentence', 'shown');
    p.nextEncounter('sentence');
    expect(p.currentEncounterBand()).toBe(3);
    p.answerWrong();
    p.answerWrong();
    p.nextEncounter('sentence');
    expect(p.currentEncounterBand()).toBe(2);
  });

  it('adapts each Branch on its own', () => {
    const p = new Player();
    p.learn('sentence');
    p.encounter('sentence', 'first');
    p.encounter('sentence', 'first');
    p.learn('between');
    p.nextEncounter('between');
    expect(p.currentEncounterBand()).toBe(2);
  });
});

describe('mastery and Creatures', () => {
  it('befriends the Skill’s Creature on its first Encounter', () => {
    const p = settled(4);
    p.learn('sentence');
    const events = p.encounter('sentence', 'shown');
    expect(events).toContainEqual(expect.objectContaining({ type: 'befriended', creature: 'c5.1' }));
    expect(befriended(content, p.save).map((c) => c.name)).toEqual(['Critter 5.1']);
  });

  it('needs four of five first try spread over two days before a Creature evolves', () => {
    const p = settled(4);
    p.learn('sentence');
    for (let i = 0; i < 5; i++) expect(types(p.encounter('sentence', 'first'))).not.toContain('evolved');
    p.day += 1;
    const events = onSkill(p, '5.1', 'first');
    expect(types(events)).toContain('evolved');
    expect(befriended(content, p.save).find((c) => c.skill === '5.1')).toMatchObject({
      name: 'Big Critter 5.1',
      evolved: true,
    });
  });

  it('never takes mastery away when the Band drops', () => {
    const p = masterNearSide();
    for (let i = 0; i < 3; i++) onSkill(p, '5.1', 'shown');
    expect(p.save.branches.sentence.band).toBe(3);
    expect(befriended(content, p.save).find((c) => c.skill === '5.1')?.evolved).toBe(true);
  });
});

describe('Keeper battles', () => {
  it('opens once every near-side Skill is mastered', () => {
    const p = settled(4);
    p.do({ type: 'keeper', branch: 'sentence' });
    expect(p.save.activity).toBeUndefined();
    const all = masterNearSide();
    expect(all.save.activity).toBeUndefined();
    all.do({ type: 'keeper', branch: 'sentence' });
    expect(all.save.activity).toMatchObject({ kind: 'keeper', hp: KEEPER_HP, foe: KEEPER_HP });
  });

  it('awards the badge and opens the far side when the Keeper falls', () => {
    const p = masterNearSide();
    p.do({ type: 'keeper', branch: 'sentence' });
    const events = [];
    for (let i = 0; i < KEEPER_HP / HIT.first; i++) events.push(...p.answerRight());
    expect(types(events)).toContain('badge');
    expect(events).toContainEqual({ type: 'unlocked', skill: '5.3' });
    expect(p.save.branches.sentence.keeper).toBe(true);
    expect(p.save.activity).toBeUndefined();
  });

  it('retreats on a loss and keeps every Creature', () => {
    const p = masterNearSide();
    const kept = () => befriended(content, p.save).map((c) => [c.creature, c.evolved]);
    const before = kept();
    p.do({ type: 'keeper', branch: 'sentence' });
    const events = [];
    for (let i = 0; i < KEEPER_HP / HIT.miss; i++) events.push(...p.answerWrong(), ...p.answerWrong());
    expect(types(events)).toContain('retreated');
    expect(p.save.branches.sentence.keeper).toBe(false);
    expect(kept()).toEqual(before);
  });
});

describe('Tide quest and streak', () => {
  it('points at the open Island the Student has neglected, never an uncharted one', () => {
    const p = settled(2);
    p.learn('sentence');
    p.encounter('sentence', 'first');
    p.day += 1;
    p.do({ type: 'open' });
    expect(p.save.tide?.branch).toBe('between');
  });

  it('pays the Tide quest bonus once, on that Branch only', () => {
    const p = settled(2);
    p.save.tide = { day: p.day, branch: 'between', done: false };
    p.learn('sentence');
    expect(types(p.encounter('sentence', 'first'))).not.toContain('tide');
    p.learn('between');
    expect(types(p.encounter('between', 'first'))).toContain('tide');
    expect(types(p.encounter('between', 'first'))).not.toContain('tide');
  });

  it('counts days played, pausing over missed days instead of resetting', () => {
    const p = settled(2);
    p.learn('sentence');
    p.encounter('sentence', 'first');
    p.encounter('sentence', 'first');
    p.day += 5;
    p.encounter('sentence', 'first');
    expect(p.save.daysPlayed).toBe(2);
  });
});

describe('Encounter selection', () => {
  it('does not repeat an Encounter until its pool is used up', () => {
    const p = settled(4);
    p.learn('sentence');
    const ids = [];
    for (let i = 0; i < 3; i++) {
      p.do({ type: 'begin', branch: 'sentence' });
      ids.push((p.save.activity as { id: string }).id);
      p.answerRight();
    }
    expect(new Set(ids).size).toBe(3);
  });
});

function onSkill(p: Player, skill: string, how: 'first' | 'second' | 'shown') {
  for (let guard = 0; guard < 200; guard++) {
    p.do({ type: 'begin', branch: 'sentence' });
    const a = p.save.activity;
    if (a?.kind === 'teach') {
      p.do({ type: 'advance' });
      p.answerRight();
      p.answerRight();
      continue;
    }
    if (a?.kind === 'encounter' && content.encounter(a.id).skill === skill) {
      if (how === 'first') return p.answerRight();
      const first = p.answerWrong();
      return [...first, ...(how === 'second' ? p.answerRight() : p.answerWrong())];
    }
    p.answerRight();
  }
  throw new Error(`never drew skill ${skill}`);
}

function masterNearSide(): Player {
  const p = settled(4);
  for (const skill of ['5.1', '5.2']) {
    for (let i = 0; i < 4; i++) onSkill(p, skill, 'first');
    p.day += 1;
    for (let i = 0; i < 2; i++) onSkill(p, skill, 'first');
  }
  return p;
}

describe('Story workshop', () => {
  it('keeps a finished Piece, befriends its Creature, and opens the next prompt', async () => {
    const { buildContent } = await import('../src/content/bank');
    const { step } = await import('../src/core/game');
    const { branches } = await import('./fixture');
    const prompt = (id: `${number}.${number}`) => ({
      skill: {
        id,
        name: `Prompt ${id}`,
        codes: ['VC2E5LE05'],
        why: 'why',
        how: 'how',
        teach: { crew: 'artist' as const, iDo: { steps: [{ say: 'watch me', ask: 'Is it?', check: { kind: 'yesno' as const, answer: true, nudge: 'look' }, win: 'yes' }], card: { terms: [], examples: [], test: 'test' } }, weDo: [content.skill('5.1').teach.weDo[0], content.skill('5.1').teach.weDo[1]] as [never, never] },
        creature: { id: `w${id}`, name: `Inky ${id}`, evolved: `Big Inky ${id}`, blurb: '' },
        workshop: { mentor: 'Once upon a time.', ask: 'Write an opening.', checklist: ['It hooks the reader'] },
      },
      encounters: [],
    });
    const bank = buildContent(branches, [prompt('9.1'), prompt('9.2')]);
    const ctx = { day: 100, rand: () => 0.5 };
    let save = new Player().save;
    const before = step(bank, save, { type: 'piece', skill: '9.2', title: 'Too soon', text: 'x', ticks: [true] }, ctx);
    expect(before.save.pieces).toEqual([]);
    const done = step(bank, save, { type: 'piece', skill: '9.1', title: 'My hook', text: 'The door creaked.', ticks: [true] }, ctx);
    save = done.save;
    expect(save.pieces).toMatchObject([{ skill: '9.1', title: 'My hook', text: 'The door creaked.' }]);
    expect(done.events.map((e) => e.type)).toEqual(expect.arrayContaining(['befriended', 'evolved', 'unlocked']));
    const last = step(bank, save, { type: 'piece', skill: '9.2', title: 'End', text: 'The end.', ticks: [true] }, ctx);
    expect(last.events.map((e) => e.type)).toContain('badge');
  });
});

describe('Write your own', () => {
  it('keeps the sentence, gives a little XP, and says so', async () => {
    const { newSave: fresh } = await import('../src/core/save');
    const p = new Player(fresh(100));
    p.learn('sentence');
    const xp = p.save.skills['5.1']!.xp;
    const events = p.do({ type: 'sentence', skill: '5.1', text: '  When the bell rang, we ran outside.  ', ticks: [true] });
    expect(events).toEqual([{ type: 'wrote', skill: '5.1' }]);
    expect(p.save.sentences).toEqual([{ skill: '5.1', text: 'When the bell rang, we ran outside.', ticks: [true], day: 100 }]);
    expect(p.save.skills['5.1']!.xp).toBeGreaterThan(xp);
    expect(p.save.skills['5.1']!.mastered).toBe(false);
  });

  it('ignores a sentence for a Skill not yet taught, or an empty one', () => {
    const p = new Player();
    expect(p.do({ type: 'sentence', skill: '5.1', text: 'Too soon for this one.', ticks: [] })).toEqual([]);
    p.learn('sentence');
    expect(p.do({ type: 'sentence', skill: '5.1', text: '   ', ticks: [] })).toEqual([]);
    expect(p.save.sentences).toEqual([]);
  });

  it('is owed once a Skill with a write task is taught, until one is written', async () => {
    const { owedOn, owesSentence } = await import('../src/core/sentence');
    const p = new Player();
    expect(owesSentence(content, p.save, '5.1')).toBe(false);
    p.learn('sentence');
    expect(owesSentence(content, p.save, '5.1')).toBe(true);
    expect(owedOn(content, p.save, 'sentence')?.id).toBe('5.1');
    expect(owedOn(content, p.save, 'between')).toBeUndefined();
    p.do({ type: 'sentence', skill: '5.1', text: 'My own sentence goes here.', ticks: [false] });
    expect(owesSentence(content, p.save, '5.1')).toBe(false);
    expect(owedOn(content, p.save, 'sentence')).toBeUndefined();
  });

  it('is never owed for a Skill without a write task', async () => {
    const { owesSentence } = await import('../src/core/sentence');
    const save = new Player().save;
    save.skills['5.1'] = { taught: true, done: 0, xp: 0, recent: [], mastered: false };
    const { write: _, ...noWrite } = content.skill('5.1');
    const bank = { ...content, skill: () => noWrite };
    expect(owesSentence(bank, save, '5.1')).toBe(false);
  });

  it('counts only the Student’s own words, not a starter they kept', async () => {
    const { ownWords } = await import('../src/core/sentence');
    expect(ownWords('Although it was raining,', 'Although it was raining,')).toBe(0);
    expect(ownWords('Although it was raining, we still played footy.', 'Although it was raining,')).toBe(4);
    expect(ownWords('We played footy in the rain.', 'Although it was raining,')).toBe(6);
  });
});

describe('loading an older save', () => {
  it('fills in fields added since, such as sentences', async () => {
    const { upgradeSave } = await import('../src/core/save');
    const old = structuredClone(new Player().save) as Partial<Save> & Pick<Save, 'started'>;
    delete old.sentences;
    const loaded = upgradeSave(old);
    expect(loaded.sentences).toEqual([]);
    expect(loaded.started).toBe(old.started);
  });
});
