import { readFileSync } from 'node:fs';
import { readingSentences, averageOf, wordCount, BAND_TARGETS } from '../src/content/rules';
const f = JSON.parse(readFileSync(process.argv[2]!, 'utf8'));
for (const e of f.encounters) {
  const s = readingSentences(e);
  const avg = averageOf(s);
  const b = e.body;
  let passage = e.text ?? '';
  if (b.format === 'tapText') passage = b.parts.map((p: any) => (typeof p === 'string' ? p : p.tap)).join('');
  const w = wordCount(passage);
  const [lo, hi] = BAND_TARGETS[e.band as 1].passage;
  const flag = (w < lo || w > hi ? ' LEN!' : '') + (avg > BAND_TARGETS[e.band as 1].sentence ? ' AVG!' : '');
  console.log(`${e.id} ${b.format} words=${w} [${lo}-${hi}] avg=${avg.toFixed(1)}/${BAND_TARGETS[e.band as 1].sentence} max=${Math.max(...s.map(wordCount))}${flag}`);
}
