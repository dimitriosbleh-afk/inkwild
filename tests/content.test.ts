import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildContent } from '../src/content/bank';
import { readContentFiles } from '../src/content/files';
import { parseSkillList, skillFileProblems } from '../src/content/rules';
import { BRANCH_IDS } from '../src/content/types';
import { LAYOUTS, CURRENT_VERSION, layoutOf } from '../src/backup/code';

const root = new URL('../content/', import.meta.url);
const { branches, files } = await readContentFiles(root);
const listed = new Map(
  parseSkillList(readFileSync(new URL('../docs/curriculum/skill-list.md', import.meta.url), 'utf8')).map((s) => [s.id, s]),
);

describe('content bank', () => {
  it('defines all nine Branches in order', () => {
    expect(branches.map((b) => b.id)).toEqual([...BRANCH_IDS]);
  });

  it('builds into one consistent bank', () => {
    expect(() => buildContent(branches, files)).not.toThrow();
  });

  it('passes every rule check', () => {
    const problems = files.flatMap((f) => skillFileProblems(f, listed.get(f.skill.id)));
    expect(problems.map((p) => `${p.where}: ${p.problem}`)).toEqual([]);
  });

  it('keeps every Branch route within the published Backup code layout', () => {
    const layout = layoutOf(buildContent(branches, files));
    for (const b of BRANCH_IDS) {
      const listedCount = [...listed.keys()].filter((id) => id.startsWith(`${branches.find((x) => x.id === b)!.number}.`)).length;
      const full = b === 'workshop' ? listedCount : listedCount + 1;
      expect(LAYOUTS[CURRENT_VERSION]![b], b).toBe(full);
      expect(layout[b], b).toBeLessThanOrEqual(full);
    }
  });

  it('gives every Skill its own Creature', () => {
    const ids = files.map((f) => f.skill.creature.id);
    const names = files.flatMap((f) => [f.skill.creature.name, f.skill.creature.evolved]);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  it('writes a skill file only for Skills on the signed-off list', () => {
    expect(files.map((f) => f.skill.id).filter((id) => !listed.has(id))).toEqual([]);
  });
});

describe('story chapters', () => {
  it('passes every chapter check', async () => {
    const { readdirSync, readFileSync: read } = await import('node:fs');
    const { chapterProblems } = await import('../src/content/rules');
    const dir = new URL('../content/chapters/', import.meta.url);
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
    const ids = new Set(branches.map((b) => b.id));
    const problems = files.flatMap((f) => chapterProblems(JSON.parse(read(new URL(f, dir), 'utf8')), ids));
    expect(problems.map((p) => `${p.where}: ${p.problem}`)).toEqual([]);
  });
});
