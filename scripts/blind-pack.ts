import { mkdirSync, writeFileSync } from 'node:fs';
import { readContentFiles } from '../src/content/files';
import { piecesNeeded, sentencesOf } from '../src/core/check';
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
/** Tappable parts in brackets; repeated texts get #1, #2 so a solver can say which one they mean. */
const joinParts = (parts: Part[]) => {
  const taps = parts.filter((p): p is { tap: string } => typeof p !== 'string').map((p) => p.tap);
  const seen = new Map<string, number>();
  return parts
    .map((p) => {
      if (typeof p === 'string') return p;
      if (taps.filter((t) => t === p.tap).length < 2) return `[${p.tap}]`;
      const n = (seen.get(p.tap) ?? 0) + 1;
      seen.set(p.tap, n);
      return `[${p.tap}#${n}]`;
    })
    .join('');
};

function sheet(body: Body): Record<string, unknown> {
  switch (body.format) {
    case 'choose':
      return body.proof
        ? { answerWith: '{ "option": the text of the one correct option, "proof": the number of the sentence in "sentences" that proves it }', ...(body.proofAsk ? { proofAsk: body.proofAsk } : {}), options: shuffle(body.options.map((o) => o.text)) }
        : { answerWith: 'the text of the one correct option', options: shuffle(body.options.map((o) => o.text)) };
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

const weDoTasks = (f: (typeof files)[number]): Encounter[] =>
  f.skill.teach.weDo.map((t, i) => ({ ...t, id: `${f.skill.id}-weDo${i + 1}`, skill: f.skill.id, band: 1, topic: 'general' }) as Encounter);
const bySkill = new Map<string, Encounter[]>();
for (const f of files.filter((f) => f.skill.id.startsWith(prefix))) {
  bySkill.set(
    f.skill.id,
    f.encounters.map((e) => ({ ...e, skill: f.skill.id })),
  );
}
if (onlyIds) {
  // We do tasks have no id of their own; a recheck names them 5.3-weDo1.
  for (const f of files) bySkill.get(f.skill.id)?.push(...weDoTasks(f));
  const tasks = [...bySkill.values()].flat().filter((e) => onlyIds.has(e.id)).map((e) => ({ id: e.id, frame: e.frame, text: e.text, ...(e.body.format === 'choose' && e.body.proof && e.text ? { sentences: sentencesOf(e.text).map((t, i) => `${i}: ${t}`) } : {}), prompt: e.prompt, format: e.body.format, ...sheet(e.body) }));
  writeFileSync(new URL('recheck.tasks.json', out), JSON.stringify(tasks, null, 2));
  console.log(`wrote ${tasks.length} tasks to .scratch/blind/recheck.tasks.json`);
  process.exit(0);
}
for (const [skill, encounters] of bySkill) {
  const tasks = encounters.map((e) => ({ id: e.id, frame: e.frame, text: e.text, ...(e.body.format === 'choose' && e.body.proof && e.text ? { sentences: sentencesOf(e.text).map((t, i) => `${i}: ${t}`) } : {}), prompt: e.prompt, format: e.body.format, ...sheet(e.body) }));
  writeFileSync(new URL(`${skill}.tasks.json`, out), JSON.stringify(tasks, null, 2));
}
console.log(`wrote ${bySkill.size} blind sheets to .scratch/blind/`);
