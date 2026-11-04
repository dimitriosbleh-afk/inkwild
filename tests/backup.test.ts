import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ALPHABET,
  capacityFits,
  CURRENT_VERSION,
  LAYOUTS,
  parseCode,
  restorable,
  restore,
  toCode,
  type Restorable,
} from '../src/backup/code';
import { befriended } from '../src/core/creatures';
import { BRANCH_IDS, type Band } from '../src/content/types';
import { content, Player } from './fixture';

const layout = LAYOUTS[CURRENT_VERSION]!;

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function randomRestorable(rand: () => number): Restorable {
  return Object.fromEntries(
    BRANCH_IDS.map((b) => [
      b,
      {
        position: Math.floor(rand() * (layout[b] + 1)),
        band: b === 'workshop' ? 2 : ((1 + Math.floor(rand() * 4)) as Band),
      },
    ]),
  ) as Restorable;
}

const samples = (() => {
  const rand = rng(42);
  const all = Array.from({ length: 300 }, () => randomRestorable(rand));
  const extreme = (position: 'min' | 'max', band: Band) =>
    Object.fromEntries(
      BRANCH_IDS.map((b) => [b, { position: position === 'min' ? 0 : layout[b], band: b === 'workshop' ? 2 : band }]),
    ) as Restorable;
  return [extreme('min', 1), extreme('max', 4), ...all];
})();

describe('Backup code', () => {
  it('is 12 characters in three groups of four, from the 29 unambiguous symbols', () => {
    for (const data of samples) expect(toCode(data)).toMatch(/^[2346789A-HJKMNP-RT-Z]{4}-[^-]{4}-[^-]{4}$/);
    for (const ch of 'O0I1LS5') expect(ALPHABET).not.toContain(ch);
    expect(ALPHABET).toHaveLength(29);
  });

  it('round-trips every restorable Save', () => {
    for (const data of samples) {
      const parsed = parseCode(toCode(data));
      expect(parsed).toEqual({ ok: true, version: CURRENT_VERSION, data });
    }
  });

  it('catches every single mis-copied character', () => {
    for (const data of samples.slice(0, 40)) {
      const code = toCode(data).replace(/-/g, '');
      for (let i = 0; i < code.length; i++) {
        for (const ch of ALPHABET) {
          if (ch === code[i]) continue;
          const bad = code.slice(0, i) + ch + code.slice(i + 1);
          expect(parseCode(bad).ok, `${code} -> ${bad}`).toBe(false);
        }
      }
    }
  });

  it('catches every swap of two neighbouring characters', () => {
    for (const data of samples) {
      const code = toCode(data).replace(/-/g, '');
      for (let i = 0; i < code.length - 1; i++) {
        if (code[i] === code[i + 1]) continue;
        const bad = code.slice(0, i) + code[i + 1] + code[i] + code.slice(i + 2);
        expect(parseCode(bad).ok, `${code} -> ${bad}`).toBe(false);
      }
    }
  });

  it('forgives lower case, spaces and missing dashes', () => {
    const code = toCode(samples[5]!);
    expect(parseCode(code.toLowerCase().replace(/-/g, ' '))).toMatchObject({ ok: true });
    expect(parseCode(code.replace(/-/g, ''))).toMatchObject({ ok: true });
  });

  it('names a look-alike character the code never uses', () => {
    const code = toCode(samples[3]!);
    expect(parseCode(`O${code.slice(1)}`)).toEqual({ ok: false, problem: 'character', character: 'O' });
    expect(parseCode(code.slice(0, 10))).toEqual({ ok: false, problem: 'length' });
  });

  it('fits the whole Skill list into 11 data characters', () => {
    expect(capacityFits(layout)).toBe(true);
  });

  it('matches the signed-off Skill list', () => {
    const list = readFileSync(new URL('../docs/curriculum/skill-list.md', import.meta.url), 'utf8');
    for (const [i, b] of BRANCH_IDS.entries()) {
      const skills = list.match(new RegExp(`^\\| ${i + 1}\\.\\d+ \\|`, 'gm'))?.length ?? 0;
      expect(layout[b], b).toBe(b === 'workshop' ? skills : skills + 1);
    }
  });
});

describe('restoring from a Backup code', () => {
  it('brings back Bands, mastered Skills, badges and Creatures', () => {
    const p = new Player();
    p.save.branches.sentence = { band: 4, placing: 0, recent: [], keeper: false };
    for (let day = 0; day < 2; day++) {
      for (let i = 0; i < 6; i++) p.encounter('sentence', 'first');
      p.day += 1;
    }
    const before = restorable(content, p.save);
    expect(before.sentence.position).toBeGreaterThan(0);

    const parsed = parseCode(toCode(before));
    if (!parsed.ok) throw new Error('code did not parse');
    const restored = restore(content, parsed.data, 300);

    expect(restorable(content, restored)).toEqual(before);
    expect(restored.branches.sentence.band).toBe(4);
    const evolved = (s: typeof p.save) =>
      befriended(content, s)
        .filter((c) => c.evolved)
        .map((c) => c.creature);
    expect(evolved(restored)).toEqual(evolved(p.save));
  });

  it('restores a beaten Keeper', () => {
    const data = restorable(content, new Player().save);
    data.sentence = { position: 3, band: 3 };
    const restored = restore(content, data, 300);
    expect(restored.branches.sentence.keeper).toBe(true);
    expect(restorable(content, restored).sentence).toEqual({ position: 3, band: 3 });
  });
});

describe('weekly backup reminder', () => {
  it('waits until the Student has played, then asks every seven days', async () => {
    const { backupDue } = await import('../src/backup/code');
    const p = new Player();
    expect(backupDue(p.save, p.day)).toBe(false);
    p.learn('sentence');
    p.encounter('sentence', 'first');
    expect(backupDue(p.save, p.day)).toBe(true);
    p.save.backupConfirmed = p.day;
    expect(backupDue(p.save, p.day + 6)).toBe(false);
    expect(backupDue(p.save, p.day + 7)).toBe(true);
  });
});
