import { readFileSync } from 'node:fs';
import { readContentFiles } from '../src/content/files';
import { BAND_TARGETS, averageOf, readingSentences, missingEncounters, parseSkillList, skillFileProblems, wordCount } from '../src/content/rules';

const root = new URL('../content/', import.meta.url);
const { files } = await readContentFiles(root);
const listed = new Map(parseSkillList(readFileSync(new URL('../docs/curriculum/skill-list.md', import.meta.url), 'utf8')).map((s) => [s.id, s]));
const only = process.argv[2];

for (const f of files.filter((f) => !only || f.skill.id.startsWith(only))) {
  const problems = skillFileProblems(f, listed.get(f.skill.id));
  const short = f.skill.id.startsWith('9.') ? [] : missingEncounters(f);
  const byBand = [1, 2, 3, 4].map((b) => {
    const es = f.encounters.filter((e) => e.band === b);
    const all = es.flatMap((e) => readingSentences(e));
    const texts = es.map((e) => e.text ?? '').filter(Boolean);
    const avg = averageOf(all);
    const words = texts.length ? texts.reduce((n, t) => n + wordCount(t), 0) / texts.length : 0;
    return `B${b}: ${es.length} enc, avg sentence ${avg.toFixed(1)}/${BAND_TARGETS[b as 1].sentence}, avg text ${words.toFixed(0)} words`;
  });
  console.log(`${f.skill.id} ${f.skill.name}: ${problems.length ? `${problems.length} PROBLEMS` : 'ok'}${short.length ? `, short at Band ${short.join(',')}` : ''}`);
  for (const line of byBand) console.log(`   ${line}`);
  for (const p of problems) console.log(`   ! ${p.where}: ${p.problem}`);
}
