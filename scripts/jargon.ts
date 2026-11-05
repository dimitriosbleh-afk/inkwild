import { readContentFiles } from '../src/content/files';
import { untaughtTerms } from '../src/content/jargon';

const { files } = await readContentFiles(new URL('../content/', import.meta.url));
const only = process.argv[2];
let total = 0;
for (const f of files.filter((f) => !only || f.skill.id.startsWith(only))) {
  const hits = untaughtTerms(f, files);
  if (!hits.length) continue;
  total += hits.length;
  console.log(`${f.skill.id} ${f.skill.name}`);
  const byTerm = new Map<string, string[]>();
  for (const h of hits) byTerm.set(h.term, [...(byTerm.get(h.term) ?? []), h.where]);
  for (const [term, wheres] of byTerm) console.log(`   ${term} ×${wheres.length}: ${wheres.slice(0, 4).join(', ')}${wheres.length > 4 ? ', …' : ''}`);
}
console.log(`${total} uses of a term the Student hasn't been taught yet`);
