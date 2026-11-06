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

  it('reject a teaching step that is too long', () => {
    expect(problemsAfter((f) => (f.skill.teach.iDo.steps[0]!.say = 'word '.repeat(25))).join()).toMatch(/keep it to 20/);
  });

  it('reject a tap step whose wrong chunk has no nudge', () => {
    expect(
      problemsAfter((f) => {
        const st = f.skill.teach.iDo.steps.find((s) => s.check.kind === 'tap')!;
        const c = st.check;
        if (c.kind !== 'tap') return;
        const wrong = st.show!.filter((p) => typeof p !== 'string').find((_, k) => k !== c.answer);
        if (wrong && typeof wrong !== 'string') delete wrong.nudge;
      }).join(),
    ).toMatch(/needs a nudge/);
  });

  it('reject a lesson that never shows the usual mistake', () => {
    expect(problemsAfter((f) => f.skill.teach.iDo.steps.forEach((s) => delete s.trap)).join()).toMatch(/usual mistake/);
  });

  it('reject a Move card term the lesson never uses as a label', () => {
    expect(problemsAfter((f) => (f.skill.teach.iDo.card.terms[0]!.term = 'NEVER SHOWN')).join()).toMatch(/never used as a label in the lesson steps/);
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

  it('reject Band 3 and 4 judging tasks whose answer is usually the longest option', () => {
    expect(
      problemsAfter((f) => {
        for (const e of f.encounters) {
          const b = e.body;
          if (e.band < 3 || b.format !== 'choose') continue;
          b.options[b.answer]!.text += ' because that is exactly what the text shows the reader at this point';
        }
      }).join(),
    ).toMatch(/at Bands 3 and 4 the answer is the longest/);
  });

  it('reject a Skill whose wrong options keep saying always or never', () => {
    expect(
      problemsAfter((f) => {
        for (const e of f.encounters) {
          const b = e.body;
          if (b.format !== 'choose') continue;
          const wrong = b.options.findIndex((_, i) => i !== b.answer);
          b.options[wrong]!.text = `It always works, ${b.options[wrong]!.text}`;
        }
      }).join(),
    ).toMatch(/always, never or only/);
  });

  it('reject a wrong-answer reason that quotes the right answer', () => {
    expect(
      problemsAfter((f) => {
        const b = choose(f);
        const wrongIdx = b.options.findIndex((_, i) => i !== b.answer);
        b.options[wrongIdx]!.reason = `The answer is ${b.options[b.answer]!.text}.`;
      }).join(),
    ).toMatch(/quotes the right answer/);
  });

  it('reject a We do check with only two options', () => {
    expect(
      problemsAfter((f) => {
        const b = f.skill.teach.weDo[0].body;
        if (b.format !== 'choose') throw new Error('expected choose');
        const right = b.options[b.answer]!;
        b.options = [right, b.options.find((o) => o !== right)!];
        b.answer = 0;
      }).join(),
    ).toMatch(/at least 3 options/);
  });

  it('reject a fix task with only two tappable parts', () => {
    expect(
      problemsAfter((f) => {
        const body = f.encounters.find((x) => x.body.format === 'fix')!.body;
        if (body.format !== 'fix') return;
        const taps = body.parts.filter((p) => typeof p !== 'string');
        const keep = [taps[body.spot], taps.find((_, i) => i !== body.spot)];
        body.parts = body.parts.filter((p) => typeof p === 'string' || keep.includes(p));
        body.spot = body.parts.filter((p) => typeof p !== 'string').indexOf(keep[0]!);
      }).join(),
    ).toMatch(/at least 3 tappable parts/);
  });

  it('reject an accepted sentence the tiles cannot build', () => {
    expect(buildable(['The cat', 'sat.'], 'The cat sat.')).toBe(true);
    expect(buildable(['The cat', 'sat.'], 'The dog sat.')).toBe(false);
  });
});
