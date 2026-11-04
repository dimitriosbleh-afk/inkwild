import { mkdirSync, writeFileSync } from 'node:fs';
import { readContentFiles } from '../src/content/files';
import { piecesNeeded } from '../src/core/check';
import type { Body, Encounter, Part } from '../src/content/types';

/** Writes answer-free task sheets for a blind solver. Options are shuffled so authored order can't leak the answer. */
const idsArg = process.argv.find((a) => a.startsWith('--ids='));
const onlyIds = idsArg ? new Set(idsArg.slice(6).split(',')) : undefined;
const prefix = onlyIds ? '' : (process.argv[2] ?? '');
const { files } = await readContentFiles(new URL('../content/', import.meta.url));
const out = new URL('../.scratch/blind/', import.meta.url);
mkdirSync(out, { recursive: true });

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const shuffle = <T>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};
const joinParts = (parts: Part[]) => parts.map((p) => (typeof p === 'string' ? p : `[${p.tap}]`)).join('');

function sheet(body: Body): Record<string, unknown> {
  switch (body.format) {
    case 'choose':
      return { answerWith: 'the text of the one correct option', options: shuffle(body.options.map((o) => o.text)) };
    case 'tapText':
      return { answerWith: 'the bracketed part that answers the prompt', passage: joinParts(body.parts) };
    case 'order':
      return { answerWith: 'every item, in the correct order', items: shuffle(body.items) };
    case 'build':
      return { answerWith: `the full sentence you build, using exactly ${piecesNeeded(body)} of the tiles`, tiles: shuffle(body.tiles) };
    case 'fix':
      return { answerWith: '{ "spot": the bracketed part that is wrong, "replacement": the option that fixes it }', passage: joinParts(body.parts), replacementOptions: shuffle(body.options.map((o) => o.text)) };
    case 'sort':
      return { answerWith: 'an object mapping each item to its bin', bins: body.bins, items: shuffle(body.items.map((i) => i.text)) };
  }
}

const bySkill = new Map<string, Encounter[]>();
for (const f of files.filter((f) => f.skill.id.startsWith(prefix))) {
  bySkill.set(
    f.skill.id,
    f.encounters.map((e) => ({ ...e, skill: f.skill.id })),
  );
}
if (onlyIds) {
  const tasks = [...bySkill.values()].flat().filter((e) => onlyIds.has(e.id)).map((e) => ({ id: e.id, frame: e.frame, text: e.text, prompt: e.prompt, format: e.body.format, ...sheet(e.body) }));
  writeFileSync(new URL('recheck.tasks.json', out), JSON.stringify(tasks, null, 2));
  console.log(`wrote ${tasks.length} tasks to .scratch/blind/recheck.tasks.json`);
  process.exit(0);
}
for (const [skill, encounters] of bySkill) {
  const tasks = encounters.map((e) => ({ id: e.id, frame: e.frame, text: e.text, prompt: e.prompt, format: e.body.format, ...sheet(e.body) }));
  writeFileSync(new URL(`${skill}.tasks.json`, out), JSON.stringify(tasks, null, 2));
}
console.log(`wrote ${bySkill.size} blind sheets to .scratch/blind/`);
