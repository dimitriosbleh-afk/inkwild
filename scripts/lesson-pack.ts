import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readContentFiles } from '../src/content/files';
import type { Chunk, Step } from '../src/content/types';

/**
 * Blind check for Tap to learn lessons. `pack` writes every step without its answer, with the steps before it as context,
 * so a solver sees what a student has seen. `compare` scores the solver's answers against the key.
 */
const mode = process.argv[2];
const prefix = process.argv[3] ?? '';
const { files } = await readContentFiles(new URL('../content/', import.meta.url));
const dir = new URL('../.scratch/blind/', import.meta.url);
mkdirSync(dir, { recursive: true });

const chunks = (st: Step) => (st.show ?? []).filter((p): p is Chunk => typeof p !== 'string');
const shown = (st: Step) => (st.show ?? []).map((p) => (typeof p === "string" ? p : `[${p.text}]${p.lit && p.tag ? ` (labelled ${p.tag})` : ""}`)).join(' ').replace(/\s+/g, ' ').trim();
const key = (st: Step): string => {
  const c = st.check;
  if (c.kind === 'tap') return chunks(st)[c.answer]?.text ?? '?';
  if (c.kind === 'yesno') return c.answer ? 'yes' : 'no';
  return c.options[c.answer]?.text ?? '?';
};
const lessons = files.filter((f) => f.skill.id.startsWith(prefix) && f.skill.teach.iDo.steps);

if (mode === 'pack') {
  const tasks = lessons.flatMap((f) =>
    f.skill.teach.iDo.steps.map((st, i) => {
      const c = st.check;
      return {
        id: `${f.skill.id}-step${i + 1}`,
        skill: f.skill.name,
        before: f.skill.teach.iDo.steps.slice(0, i).map((p) => `${p.say} ${p.win}`),
        say: st.say,
        example: st.show ? shown(st) : undefined,
        ask: st.ask,
        answerWith: c.kind === 'tap' ? 'the bracketed chunk to tap, without brackets' : c.kind === 'yesno' ? '"yes" or "no"' : 'the text of one option',
        options: c.kind === 'pick' ? c.options.map((o) => o.text) : undefined,
      };
    }),
  );
  writeFileSync(new URL('lessons.tasks.json', dir), JSON.stringify(tasks, null, 2));
  console.log(`wrote ${tasks.length} lesson steps to .scratch/blind/lessons.tasks.json`);
} else if (mode === 'compare') {
  const answers = JSON.parse(readFileSync(new URL('lessons.answers.json', dir), 'utf8')) as { id: string; answer: string; confidence: string; alsoDefensible?: string | null }[];
  const norm = (t: string) => t.toLowerCase().replace(/^\[|\]$/g, '').replace(/[^a-z0-9' ]/g, '').trim();
  const rows: string[] = [];
  let checked = 0;
  for (const f of lessons)
    f.skill.teach.iDo.steps.forEach((st, i) => {
      const id = `${f.skill.id}-step${i + 1}`;
      const a = answers.find((x) => x.id === id);
      checked++;
      if (!a) return rows.push(`| ${id} | UNANSWERED | |`);
      const ok = norm(String(a.answer)) === norm(key(st));
      if (!ok || a.alsoDefensible || a.confidence !== 'high')
        rows.push(`| ${id} | ${[!ok && 'DISAGREES', a.alsoDefensible && 'SECOND ANSWER', a.confidence !== 'high' && a.confidence].filter(Boolean).join(', ')} | key: ${key(st)}; solver: ${a.answer}${a.alsoDefensible ? `; also: ${a.alsoDefensible}` : ''} |`);
    });
  writeFileSync(new URL('lessons.report.md', dir), ['# Lesson blind check', '', `${checked} steps checked, ${rows.length} flagged.`, '', '| Step | Flag | Detail |', '|---|---|---|', ...rows].join('\n'));
  console.log(`${checked} steps checked, ${rows.length} flagged. See .scratch/blind/lessons.report.md`);
} else console.log('usage: vite-node scripts/lesson-pack.ts pack|compare [prefix]');
