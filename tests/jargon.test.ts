import { describe, expect, it } from 'vitest';
import type { SkillFile } from '../src/content/bank';
import { untaughtTerms } from '../src/content/jargon';
import { readContentFiles } from '../src/content/files';

const { files } = await readContentFiles(new URL('../content/', import.meta.url));
const clauses = files.find((f) => f.skill.id === '5.2')!;
const firstOnIsland = files.find((f) => f.skill.id === '5.1')!;

const withReason = (f: SkillFile, reason: string): SkillFile => {
  const copy = structuredClone(f);
  copy.encounters[0]!.success = reason;
  return copy;
};

describe('taught before used', () => {
  it('flags a term no crew member on the Island has said yet', () => {
    const bad = withReason(firstOnIsland, 'A semicolon joins the two halves.');
    expect(untaughtTerms(bad, files).map((u) => u.term)).toContain('semicolon');
  });

  it('accepts a term once an earlier Skill on the same Island has taught it', () => {
    const later = withReason(clauses, 'Each clause has its own doer.');
    expect(untaughtTerms(later, files).map((u) => u.term)).not.toContain('clause');
  });
});
