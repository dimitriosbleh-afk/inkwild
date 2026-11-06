import { readContentFiles } from '../src/content/files';
import { sentencesOf } from '../src/core/check';

/** Prints an Encounter's passage as numbered sentences, so a writer can set `proof` by number. Usage: sentences.ts 1.2-b3-4 [more ids] */
const { files } = await readContentFiles(new URL('../content/', import.meta.url));
for (const id of process.argv.slice(2)) {
  const e = files.flatMap((f) => f.encounters).find((x) => x.id === id);
  if (!e?.text) {
    console.log(`${id}: no passage`);
    continue;
  }
  console.log(`${id}`);
  sentencesOf(e.text).forEach((s, i) => console.log(`  ${i}: ${s}`));
}
