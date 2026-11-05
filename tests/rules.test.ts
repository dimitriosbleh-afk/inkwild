import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SkillFile } from '../src/content/bank';
import { buildable, parseSkillList, skillFileProblems } from '../src/content/rules';

const good = JSON.parse(readFileSync(new URL('../content/skills/5.3.json', import.meta.url), 'utf8')) as SkillFile;
const listed = parseSkillList(readFileSync(new URL('../docs/curriculum/skill-list.md', import.meta.url), 'utf8')).find(
  (s) => s.id === '5.3',
);

function problemsAfter(edit: (f: SkillFile) => void): string[] {
  const f = structuredClone(good);
  edit(f);
  return skillFileProblems(f, listed).map((p) => p.problem);
}

const choose = (f: SkillFile) => {
  const b = f.encounters[0]!.body;
  if (b.format !== 'choose') throw new Error('expected choose');
  return b;
};

describe('content rule checks', () => {
  it('pass the hand-written model Skill', () => {
    expect(problemsAfter(() => {})).toEqual([]);
  });

  it('reject a wrong option with no reason', () => {
    expect(problemsAfter((f) => delete choose(f).options[1]!.reason)).toContain('option 1 is wrong but has no reason');
  });

  it('reject an answer that is not one of the options', () => {
    expect(problemsAfter((f) => (choose(f).answer = 7))).toContain('option answer 7 is out of range');
  });

  it('reject US spelling anywhere a Student reads', () => {
    expect(problemsAfter((f) => (f.encounters[0]!.success = 'Nice color choice.'))).toContain('US spelling "color"');
  });

  it('reject word work', () => {
    expect(problemsAfter((f) => (f.encounters[0]!.prompt = 'How do you spell it?'))).toContain(
      'word work in the prompt ("spell")',
    );
  });

  it('reject a sentence too long for its Band', () => {
    const long = `${'word '.repeat(30).trim()}.`;
    expect(problemsAfter((f) => (f.encounters[0]!.text = long)).join()).toMatch(/over the Band 1 target/);
  });

  it('reject a name or codes that drift from the signed-off Skill list', () => {
    expect(problemsAfter((f) => (f.skill.codes = ['VC2E6LA05'])).join()).toMatch(/differ from the Skill list/);
  });

  it('reject a Band with fewer than three formats', () => {
    const one = problemsAfter((f) => {
      const model = f.encounters.find((e) => e.band === 1 && e.body.format === 'choose')!;
      f.encounters = f.encounters.map((e) => (e.band === 1 ? { ...model, id: e.id } : e));
    });
    expect(one.join()).toMatch(/uses 1 formats/);
  });

  it('reject a topic used three times in one Band', () => {
    expect(problemsAfter((f) => f.encounters.filter((e) => e.band === 2).forEach((e) => (e.topic = 'space'))).join()).toMatch(/topic space used/);
  });

  it('reject a hard-Band choose with only three options', () => {
    expect(problemsAfter((f) => {
      const e = f.encounters.find((x) => x.band === 3 && x.body.format === 'choose')!;
      if (e.body.format === 'choose') e.body.options.pop();
    }).join()).toMatch(/needs 4 options/);
  });

  it('reject a Teach beat that is too long', () => {
    expect(problemsAfter((f) => (f.skill.teach.iDo.beats[0]!.say = 'word '.repeat(20))).join()).toMatch(/keep it to 12/);
  });

  it('reject a Skill whose right answers are usually the longest option', () => {
    expect(
      problemsAfter((f) =>
        f.encounters.forEach((e) => {
          if (e.body.format === 'choose') e.body.options[e.body.answer]!.text += ' and that is the very long right answer';
        }),
      ).join(),
    ).toMatch(/longest option/);
  });

  it('reject an accepted sentence the tiles cannot build', () => {
    expect(buildable(['The cat', 'sat.'], 'The cat sat.')).toBe(true);
    expect(buildable(['The cat', 'sat.'], 'The dog sat.')).toBe(false);
  });
});
