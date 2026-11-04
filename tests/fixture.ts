import { buildContent, type SkillFile } from '../src/content/bank';
import type { Band, Body, Branch, Response, Task } from '../src/content/types';
import { currentTask, step, type Action, type Ctx, type GameEvent } from '../src/core/game';
import { newSave, type Save } from '../src/core/save';

const choose = (n: number): Body => ({
  format: 'choose',
  options: [{ text: 'right' }, { text: 'wrong a', reason: `reason a${n}` }, { text: 'wrong b', reason: `reason b${n}` }],
  answer: 0,
});

const task = (n: number): Task => ({ prompt: `prompt ${n}`, success: `success ${n}`, body: choose(n) });

function skillFile(id: `${number}.${number}`, perBand = 6): SkillFile {
  const encounters: SkillFile['encounters'] = [];
  for (const band of [1, 2, 3, 4] as Band[]) {
    for (let i = 0; i < perBand; i++) {
      encounters.push({ ...task(i), id: `${id}-b${band}-${i}`, band, topic: i % 2 ? 'sport' : 'general' });
    }
  }
  return {
    skill: {
      id,
      name: `Skill ${id}`,
      codes: ['VC2E5LA05'],
      why: 'why',
      how: 'how',
      teach: {
        crew: 'nav',
        iDo: { lines: ['watch me'] },
        weDo: [
          { ...task(100), hint: 'hint 1' },
          { ...task(101), hint: 'hint 2' },
        ],
      },
      creature: { id: `c${id}`, name: `Critter ${id}`, evolved: `Big Critter ${id}`, blurb: '' },
    },
    encounters,
  };
}

export const branches: Branch[] = [
  {
    id: 'sentence',
    number: 5,
    name: 'Sentence building',
    island: 'Quill Isle',
    marked: true,
    keeperAfter: 2,
    keeper: { name: 'Keeper', creature: 'k5' },
  },
  {
    id: 'between',
    number: 1,
    name: 'Reading between the lines',
    island: 'Peer Island',
    marked: true,
    keeperAfter: 1,
    keeper: { name: 'Keeper', creature: 'k1' },
  },
];

const rest: [Branch['id'], number][] = [
  ['whose', 2],
  ['convince', 3],
  ['pictures', 4],
  ['punctuation', 6],
  ['structure', 7],
  ['editing', 8],
  ['workshop', 9],
];
for (const [id, number] of rest) {
  branches.push({
    id,
    number,
    name: id,
    island: id,
    marked: id !== 'workshop',
    keeperAfter: 1,
    keeper: { name: 'Keeper', creature: `k${number}` },
  });
}

export const content = buildContent(branches, [
  skillFile('5.1'),
  skillFile('5.2'),
  skillFile('5.3'),
  skillFile('5.4'),
  skillFile('1.1'),
  skillFile('1.2'),
]);

export function right(body: Body): Response {
  switch (body.format) {
    case 'choose':
      return { format: 'choose', choice: body.answer };
    case 'tapText':
      return { format: 'tapText', tap: body.answer };
    case 'order':
      return { format: 'order', order: body.items.map((_, i) => i) };
    case 'build':
      throw new Error('fixture has no build tasks');
    case 'fix':
      return { format: 'fix', tap: body.spot, choice: body.answer };
    case 'sort':
      return { format: 'sort', bins: body.items.map((i) => i.bin) };
  }
}

export function wrong(body: Body): Response {
  if (body.format !== 'choose') throw new Error('fixture only answers choose tasks wrongly');
  return { format: 'choose', choice: 1 };
}

export class Player {
  save: Save;
  events: GameEvent[] = [];
  day = 100;
  private seed = 1;

  constructor(save?: Save) {
    this.save = save ?? newSave(this.day);
  }

  ctx(): Ctx {
    return {
      day: this.day,
      rand: () => {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
      },
    };
  }

  do(action: Action): GameEvent[] {
    const result = step(content, this.save, action, this.ctx());
    this.save = result.save;
    this.events = result.events;
    return result.events;
  }

  task(): Task {
    if (!this.save.activity) throw new Error('no activity');
    return currentTask(content, this.save.activity);
  }

  answerRight(): GameEvent[] {
    return this.do({ type: 'answer', response: right(this.task().body) });
  }

  answerWrong(): GameEvent[] {
    return this.do({ type: 'answer', response: wrong(this.task().body) });
  }

  learn(branch: Branch['id']): void {
    this.do({ type: 'begin', branch });
    this.do({ type: 'advance' });
    this.answerRight();
    this.answerRight();
  }

  nextEncounter(branch: Branch['id']): void {
    this.do({ type: 'begin', branch });
    while (this.save.activity?.kind === 'teach') {
      this.do({ type: 'advance' });
      this.answerRight();
      this.answerRight();
      this.do({ type: 'begin', branch });
    }
    if (this.save.activity?.kind !== 'encounter') throw new Error(`expected an encounter, got ${this.save.activity?.kind}`);
  }

  encounter(branch: Branch['id'], how: 'first' | 'second' | 'shown'): GameEvent[] {
    this.nextEncounter(branch);
    if (how === 'first') return this.answerRight();
    const first = this.answerWrong();
    const second = how === 'second' ? this.answerRight() : this.answerWrong();
    return [...first, ...second];
  }

  currentEncounterBand(): Band {
    const a = this.save.activity;
    if (a?.kind !== 'encounter' && a?.kind !== 'keeper') throw new Error('no encounter');
    return content.encounter(a.id).band;
  }
}
