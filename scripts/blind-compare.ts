import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { readContentFiles } from '../src/content/files';
import { normalise, taps } from '../src/core/check';
import type { Encounter } from '../src/content/types';

/** Compares a blind solver's answers with the key. Any mismatch, low confidence or second defensible answer is flagged. */
interface Answer {
  id: string;
  answer: unknown;
  confidence: 'high' | 'medium' | 'low';
  alsoDefensible?: string | null;
  note?: string;
}

const { files } = await readContentFiles(new URL('../content/', import.meta.url));
const dir = new URL('../.scratch/blind/', import.meta.url);
const same = (a: unknown, b: string) => typeof a === 'string' && normalise(a).toLowerCase() === normalise(b).toLowerCase();

function agrees(e: Encounter, answer: unknown): boolean {
  const b = e.body;
  switch (b.format) {
    case 'choose':
      return same(answer, b.options[b.answer]!.text);
    case 'tapText':
      return same(answer, taps(b.parts)[b.answer]!.tap);
    case 'order':
      return Array.isArray(answer) && answer.length === b.items.length && b.items.every((it, i) => same(answer[i], it));
    case 'build':
      return b.accept.some((a) => same(answer, a));
    case 'fix': {
      const a = answer as { spot?: string; replacement?: string } | null;
      return !!a && same(a.spot, taps(b.parts)[b.spot]!.tap) && same(a.replacement, b.options[b.answer]!.text);
    }
    case 'sort': {
      const a = answer as Record<string, string> | null;
      return !!a && b.items.every((it) => {
        const key = Object.keys(a).find((k) => normalise(k) === normalise(it.text)) ?? Object.keys(a).find((k) => same(k, it.text));
        return key !== undefined && same(a[key], b.bins[it.bin]!);
      });
    }
  }
}

const { readdirSync } = await import('node:fs');
const recheck = new Map<string, Answer>(
  readdirSync(dir)
    .filter((f) => /^recheck.*\.answers\.json$/.test(f))
    .sort()
    .flatMap((f) => (JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as Answer[]).map((a) => [a.id, a] as const)),
);
const rows: { id: string; flag: string; detail: string; score: number }[] = [];
let checked = 0;
for (const f of files) {
  const path = new URL(`${f.skill.id}.answers.json`, dir);
  if (!existsSync(path)) continue;
  const answers = JSON.parse(readFileSync(path, 'utf8')) as Answer[];
  for (const e of f.encounters) {
    const a = recheck.get(e.id) ?? answers.find((x) => x.id === e.id);
    checked++;
    const enc = { ...e, skill: f.skill.id } as Encounter;
    if (!a) {
      rows.push({ id: e.id, flag: 'UNANSWERED', detail: '', score: 3 });
      continue;
    }
    const ok = agrees(enc, a.answer);
    const flags = [!ok && 'DISAGREES', a.alsoDefensible && 'SECOND ANSWER', a.confidence !== 'high' && `CONFIDENCE ${a.confidence}`].filter(Boolean) as string[];
    const score = (ok ? 0 : 3) + (a.alsoDefensible ? 2 : 0) + (a.confidence === 'low' ? 2 : a.confidence === 'medium' ? 1 : 0);
    rows.push({ id: e.id, flag: flags.join(', ') || 'ok', detail: [!ok && `solver said ${JSON.stringify(a.answer)}`, a.alsoDefensible && `also: ${a.alsoDefensible}`, a.note].filter(Boolean).join(' | '), score });
  }
}
rows.sort((x, y) => y.score - x.score);
const flagged = rows.filter((r) => r.score >= 2);
const report = [
  `# Blind solve report`,
  ``,
  `${checked} Encounters checked, ${flagged.length} flagged for rewrite.`,
  ``,
  `| Encounter | Flag | Detail |`,
  `|---|---|---|`,
  ...rows.filter((r) => r.score > 0).map((r) => `| ${r.id} | ${r.flag} | ${r.detail.replace(/\|/g, '/')} |`),
].join('\n');
writeFileSync(new URL('report.md', dir), report);
writeFileSync(new URL('uncertainty.json', dir), JSON.stringify(Object.fromEntries(rows.map((r) => [r.id, r.score]))));
console.log(`${checked} checked, ${flagged.length} flagged. See .scratch/blind/report.md`);
