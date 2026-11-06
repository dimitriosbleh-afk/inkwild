import { describe, expect, it } from 'vitest';
import { buildContent } from '../src/content/bank';
import { readContentFiles } from '../src/content/files';
import { BRANCH_IDS, type Response, type Task } from '../src/content/types';
import { befriended } from '../src/core/creatures';
import { currentTask, step, type Action } from '../src/core/game';
import { newSave, upgradeSave, VARIANTS, type Save } from '../src/core/save';
import { tilesFor } from '../src/core/check';

/**
 * Thousands of random taps through the real content: whatever a Student does, in any order, across days, the game
 * never throws, and the Save always survives being written and read back unchanged.
 */
const { branches, files } = await readContentFiles(new URL('../content/', import.meta.url));
const content = buildContent(branches, files);
const allSkills = content.branches.flatMap((b) => content.skillsOf(b.id));

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;

function rightResponse(task: Task, r: () => number): Response {
  const b = task.body;
  switch (b.format) {
    case 'choose':
      return { format: 'choose', choice: b.answer, ...(b.proof?.length && task.text ? { proof: pick(r, b.proof) } : {}) };
    case 'tapText':
      return { format: 'tapText', tap: b.answer };
    case 'order':
      return { format: 'order', order: b.items.map((_, i) => i) };
    case 'build':
      return { format: 'build', tiles: tilesFor(b.tiles, b.accept[0]!) ?? [] };
    case 'fix':
      return { format: 'fix', tap: b.spot, choice: b.answer };
    case 'sort':
      return { format: 'sort', bins: b.items.map((i) => i.bin) };
  }
}

function anyResponse(task: Task, r: () => number): Response {
  if (r() < 0.55) return rightResponse(task, r);
  const b = task.body;
  const n = (k: number) => Math.floor(r() * Math.max(1, k));
  switch (b.format) {
    case 'choose':
      return { format: 'choose', choice: n(b.options.length), ...(r() < 0.5 ? { proof: n(12) } : {}) };
    case 'tapText':
      return { format: 'tapText', tap: n(8) };
    case 'order':
      return { format: 'order', order: [...b.items.keys()].sort(() => r() - 0.5) };
    case 'build':
      return { format: 'build', tiles: [...b.tiles.keys()].sort(() => r() - 0.5).slice(0, n(b.tiles.length) + 1) };
    case 'fix':
      return { format: 'fix', tap: n(8), ...(r() < 0.6 ? { choice: n(b.options.length) } : {}) };
    case 'sort':
      return { format: 'sort', bins: b.items.map(() => n(b.bins.length)) };
  }
}

function randomAction(save: Save, r: () => number): Action {
  const roll = r();
  const a = save.activity;
  if (a && roll < 0.7) {
    const task = currentTask(content, a);
    if (r() < 0.15) return { type: 'advance' };
    return { type: 'answer', response: anyResponse(task, r), ms: r() < 0.1 ? 50 : 30_000 };
  }
  const branch = pick(r, BRANCH_IDS);
  const mine = befriended(content, save);
  const kinds: (() => Action)[] = [
    () => ({ type: 'open' }),
    () => ({ type: 'begin', branch }),
    () => ({ type: 'begin', branch }),
    () => ({ type: 'begin', branch }),
    () => ({ type: 'keeper', branch }),
    () => ({ type: 'advance' }),
    () => ({ type: 'retreat' }),
    () => ({ type: 'receive', creature: pick(r, allSkills).creature.id, variant: pick(r, VARIANTS) }),
    () => ({ type: 'review', creature: mine.length && r() < 0.9 ? pick(r, mine).creature : 'nobody' }),
    () => ({ type: 'sentence', skill: pick(r, allSkills).id, text: 'Mo ran because the bell rang.', marks: [] }),
  ];
  return pick(r, kinds)();
}

function checkSave(save: Save): void {
  const again = upgradeSave(JSON.parse(JSON.stringify(save)) as Save);
  expect(again).toEqual(save);
  expect(upgradeSave(JSON.parse(JSON.stringify(again)) as Save)).toEqual(again);
  for (const [, vs] of Object.entries(save.variants)) {
    expect(vs).toEqual(VARIANTS.filter((v) => vs!.includes(v)));
  }
  for (const p of Object.values(save.skills)) {
    expect(p!.xp).toBeGreaterThanOrEqual(0);
    expect(p!.streak).toBeGreaterThanOrEqual(0);
    expect(p!.done).toBeGreaterThanOrEqual(0);
  }
  if (save.activity) expect(() => currentTask(content, save.activity!)).not.toThrow();
}

describe("random play", () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    it(`survives 1000 random actions (seed ${seed})`, () => {
      const r = rng(seed);
      let day = 20_000;
      let save = newSave(day);
      save.captain = { skin: 0, hair: 0, hairColour: 0, outfit: 0, colour: 0 };
      const trail: string[] = [];
      const seen = new Map<string, number>();
      for (let i = 0; i < 1000; i++) {
        if (r() < 0.02) day += 1 + Math.floor(r() * 3);
        const action = randomAction(save, r);
        trail.push(JSON.stringify(action).slice(0, 80));
        try {
          const out = step(content, save, action, { day, rand: r });
          save = out.save;
          for (const e of out.events) seen.set(e.type, (seen.get(e.type) ?? 0) + 1);
          checkSave(save);
        } catch (err) {
          throw new Error(`seed ${seed}, action ${i}: ${(err as Error).message}\nlast actions:\n${trail.slice(-6).join('\n')}`);
        }
      }
      expect(Object.keys(save.skills).length).toBeGreaterThan(0);
      if (process.env.FUZZ_STATS) console.log(seed, JSON.stringify(Object.fromEntries(seen)));
    });
  }
});
