import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { readContentFiles } from '../src/content/files';
import { taps } from '../src/core/check';
import type { Encounter } from '../src/content/types';

/** The teacher's ten-task spot check for one Island: the Encounters the blind solve was least sure about. */
const branchNo = process.argv[2] ?? '5';
const root = new URL('../content/', import.meta.url);
const { branches, files } = await readContentFiles(root);
const branch = branches.find((b) => String(b.number) === branchNo)!;
const scoresPath = new URL('../.scratch/blind/uncertainty.json', import.meta.url);
const scores: Record<string, number> = existsSync(scoresPath) ? JSON.parse(readFileSync(scoresPath, 'utf8')) : {};

const encounters: Encounter[] = files
  .filter((f) => f.skill.id.startsWith(`${branchNo}.`))
  .flatMap((f) => f.encounters.map((e) => ({ ...e, skill: f.skill.id })));
const ranked = [...encounters].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0) || b.band - a.band || a.id.localeCompare(b.id));
const picked = ranked.filter((e) => (scores[e.id] ?? 0) > 0).slice(0, 10);
const skillsUsed = new Set(picked.map((e) => e.skill));
for (const e of ranked) {
  if (picked.length >= 10) break;
  if (picked.includes(e) || skillsUsed.has(e.skill)) continue;
  picked.push(e);
  skillsUsed.add(e.skill);
}

function answerOf(e: Encounter): string {
  const b = e.body;
  switch (b.format) {
    case 'choose':
      return `Options: ${b.options.map((o, i) => (i === b.answer ? `**${o.text}** (answer)` : o.text)).join(' / ')}`;
    case 'tapText':
      return `Tap: **${taps(b.parts)[b.answer]!.tap}** in "${b.parts.map((p) => (typeof p === 'string' ? p : p.tap)).join('')}"`;
    case 'order':
      return `Order: ${b.items.map((x, i) => `${i + 1}. ${x}`).join(' ')}`;
    case 'build':
      return `Pieces: ${b.tiles.join(' | ')}\n\nAnswer: **${b.accept.join('** or **')}**`;
    case 'fix':
      return `Text: "${b.parts.map((p) => (typeof p === 'string' ? p : p.tap)).join('')}"\n\nWrong spot: **${taps(b.parts)[b.spot]!.tap}**, fix: **${b.options[b.answer]!.text}** (other fixes: ${b.options.filter((_, i) => i !== b.answer).map((o) => o.text).join(', ')})`;
    case 'sort':
      return b.items.map((it) => `- ${it.text} → **${b.bins[it.bin]}**`).join('\n');
  }
}

const out = [
  `# Spot check: ${branch.island} (${branch.name})`,
  '',
  'These are the 10 Encounters the automatic checks were least sure about. For each, tick **OK**, or write what is wrong. Two right answers, a confusing prompt, or a wrong answer are all worth a note.',
  '',
  ...picked.flatMap((e, n) => [
    `## ${n + 1}. ${e.id} (Band ${e.band})`,
    '',
    e.text ? `> ${e.text}` : '',
    '',
    `**${e.prompt}**`,
    '',
    answerOf(e),
    '',
    `Why: ${e.success}`,
    '',
    '☐ OK   ☐ Needs a fix: ______________________________________',
    '',
  ]),
].join('\n');
const path = new URL(`../.scratch/inkwild/spot-check-island-${branchNo}.md`, import.meta.url);
writeFileSync(path, out);
console.log(`wrote ${picked.length} Encounters to ${path.pathname}`);
