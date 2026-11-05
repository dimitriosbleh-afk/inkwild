import { normalise, piecesNeeded, taps, tilesFor } from '../core/check';
import type { SkillFile } from './bank';
import { BANDS, CREW, INTERESTS, type Band, type Body, type Task } from './types';

export interface Problem {
  where: string;
  problem: string;
}

export const ENCOUNTERS_PER_BAND = 6;

/** Word limits for the words around a task, read by every Band, so a nine-year-old can follow them. */
export const LIMITS = { beat: 12, show: 16, why: 14, how: 16, feedback: 20 } as const;

export const BAND_TARGETS: Record<Band, { sentence: number; passage: [number, number] }> = {
  1: { sentence: 12, passage: [60, 120] },
  2: { sentence: 15, passage: [100, 180] },
  3: { sentence: 18, passage: [150, 250] },
  4: { sentence: 22, passage: [200, 350] },
};

const US_SPELLINGS =
  /\b(color|colors|colored|favor|favorite|favorites|honor|neighbor|neighbors|behavior|flavor|humor|rumor|center|centers|theater|liter|liters|realize|realized|organize|organized|recognize|recognized|apologize|apologized|analyze|analyzed|criticize|memorize|gray|mom|moms|traveled|traveling|canceled|jewelry|cozy|donut|aluminum|pajamas|airplane|catalog|defense|offense|plow|mustache|skeptical|fulfill)\b/i;

const WORD_WORK = /\b(spell|spelling|spelt|syllables?|phonemes?|phonics|prefix(es)?|suffix(es)?|morphemes?|root words?|sound it out|handwriting)\b/i;

const TOPICS = new Set<string>([...INTERESTS, 'general']);

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

export function sentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?]["”’']?)\s+(?=["“‘']?[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => wordCount(s) > 0);
}

export function averageSentenceLength(text: string): number {
  const all = sentences(text);
  return all.length === 0 ? 0 : all.reduce((n, s) => n + wordCount(s), 0) / all.length;
}

function textOf(task: Task): string[] {
  const out = [task.frame, task.text, task.prompt, task.success].filter((t): t is string => !!t);
  const b = task.body;
  if (b.format === 'choose' || b.format === 'fix') out.push(...b.options.flatMap((o) => [o.text, o.reason ?? '']));
  if (b.format === 'tapText' || b.format === 'fix')
    out.push(...b.parts.map((p) => (typeof p === 'string' ? p : `${p.tap} ${p.reason ?? ''}`)));
  if (b.format === 'order') out.push(...b.items, b.reason);
  if (b.format === 'build') out.push(...b.tiles, ...b.accept, b.reason);
  if (b.format === 'sort') out.push(...b.bins, ...b.items.flatMap((i) => [i.text, i.reason]));
  return out;
}

function reasonsOf(b: Body): string[] {
  const out: string[] = [];
  if (b.format === 'choose' || b.format === 'fix') out.push(...b.options.flatMap((o) => (o.reason ? [o.reason] : [])));
  if (b.format === 'tapText' || b.format === 'fix') out.push(...taps(b.parts).flatMap((t) => (t.reason ? [t.reason] : [])));
  if (b.format === 'sort') out.push(...b.items.map((i) => i.reason));
  if (b.format === 'order' || b.format === 'build') out.push(b.reason);
  return out;
}

function bodyProblems(b: Body): string[] {
  const out: string[] = [];
  const reasoned = (options: { reason?: string }[], answer: number, what: string) => {
    if (answer < 0 || answer >= options.length) out.push(`${what} answer ${answer} is out of range`);
    options.forEach((o, i) => {
      if (i !== answer && !o.reason?.trim()) out.push(`${what} ${i} is wrong but has no reason`);
      if (i === answer && o.reason) out.push(`${what} ${i} is the answer but has a reason`);
    });
  };
  switch (b.format) {
    case 'choose': {
      if (b.options.length < 2 || b.options.length > 4) out.push('choose needs 2 to 4 options');
      reasoned(b.options, b.answer, 'option');
      const texts = b.options.map((o) => normalise(o.text).toLowerCase());
      if (new Set(texts).size !== texts.length) out.push('two options have the same text');
      break;
    }
    case 'tapText': {
      const t = taps(b.parts);
      if (t.length < 2) out.push('tapText needs at least 2 tappable parts');
      reasoned(t, b.answer, 'tap');
      break;
    }
    case 'order':
      if (b.items.length < 3) out.push('order needs at least 3 items');
      if (new Set(b.items).size !== b.items.length) out.push('order items must all differ');
      if (!b.reason.trim()) out.push('order needs a reason');
      break;
    case 'build': {
      if (b.accept.length === 0) out.push('build needs at least one accepted sentence');
      if (!b.reason.trim()) out.push('build needs a reason');
      const needed = piecesNeeded(b);
      for (const a of b.accept) {
        const used = tilesFor(b.tiles, a);
        if (!used) out.push(`accepted sentence cannot be built from the tiles: "${a}"`);
        else if (used.length !== needed) out.push(`accepted sentence uses ${used.length} pieces but the first uses ${needed}: "${a}"`);
      }
      break;
    }
    case 'fix': {
      const t = taps(b.parts);
      if (t.length < 2) out.push('fix needs at least 2 tappable parts');
      reasoned(t, b.spot, 'spot');
      reasoned(b.options, b.answer, 'fix option');
      break;
    }
    case 'sort':
      if (b.bins.length < 2 || b.bins.length > 4) out.push('sort needs 2 to 4 bins');
      if (b.items.length < 3) out.push('sort needs at least 3 items');
      b.items.forEach((item, i) => {
        if (item.bin < 0 || item.bin >= b.bins.length) out.push(`sort item ${i} has no such bin`);
        if (!item.reason.trim()) out.push(`sort item ${i} needs a reason`);
      });
      break;
  }
  return out;
}

export function buildable(tiles: string[], sentence: string): boolean {
  return tilesFor(tiles, sentence) !== undefined;
}

/** Skills whose broken sentences are long on purpose: a run-on is one long sentence by design. */
const LONG_ON_PURPOSE = new Set(['5.13', '8.2']);
const skillOf = (where: string) => where.split(' ')[0] ?? '';

/** Every sentence a Student reads in a task, so the Band check can't be dodged by moving text out of the passage. */
export function readingSentences(task: Task): string[] {
  const b = task.body;
  const pieces = [task.text ?? ''];
  if (b.format === 'tapText' || b.format === 'fix') pieces.push(b.parts.map((p) => (typeof p === 'string' ? p : p.tap)).join(''));
  if (b.format === 'build') pieces.push(b.accept[0] ?? '');
  if (b.format === 'sort') pieces.push(...b.items.map((i) => i.text));
  if (b.format === 'order') pieces.push(...b.items);
  if (b.format === 'choose') pieces.push(...b.options.map((o) => o.text).filter((t) => wordCount(t) >= 5));
  return pieces.filter((t) => t.trim()).flatMap((t) => sentences(t.replace(/___/g, 'blank')));
}

export function averageOf(all: string[]): number {
  return all.length === 0 ? 0 : all.reduce((n, s) => n + wordCount(s), 0) / all.length;
}

function taskProblems(task: Task, where: string, band?: Band): Problem[] {
  const out: Problem[] = [];
  const add = (problem: string) => out.push({ where, problem });
  if (!task.prompt.trim()) add('empty prompt');
  if (!task.success.trim()) add('empty success line');
  if (wordCount(task.success) > LIMITS.feedback) add(`success line is ${wordCount(task.success)} words; keep it to ${LIMITS.feedback}`);
  for (const r of reasonsOf(task.body)) {
    if (wordCount(r) > LIMITS.feedback) add(`a reason is ${wordCount(r)} words; keep it to ${LIMITS.feedback}: "${r.slice(0, 40)}..."`);
  }
  bodyProblems(task.body).forEach(add);
  for (const t of textOf(task)) {
    const us = t.match(US_SPELLINGS);
    if (us) add(`US spelling "${us[0]}"`);
  }
  if (/drag/i.test(task.prompt)) add('prompt says drag, but students tap to place: say "match", "put" or "tap"');
  const ww = task.prompt.match(WORD_WORK);
  if (ww) add(`word work in the prompt ("${ww[0]}")`);
  const reading = readingSentences(task);
  if (band && reading.length && !LONG_ON_PURPOSE.has(skillOf(where))) {
    const avg = averageOf(reading);
    if (avg > BAND_TARGETS[band].sentence) {
      add(`average sentence length ${avg.toFixed(1)} is over the Band ${band} target of ${BAND_TARGETS[band].sentence}`);
    }
  }
  return out;
}

export function skillFileProblems(file: SkillFile, listed?: { name: string; codes: string[] }): Problem[] {
  const id = file.skill.id;
  const out: Problem[] = [];
  const add = (where: string, problem: string) => out.push({ where, problem });
  const s = file.skill;
  if (!/^\d\.\d+$/.test(id)) add(id, 'skill id must look like 5.3');
  if (listed) {
    if (s.name !== listed.name) add(id, `name "${s.name}" differs from the Skill list "${listed.name}"`);
    if (s.codes.join(',') !== listed.codes.join(',')) add(id, `codes ${s.codes} differ from the Skill list ${listed.codes}`);
  } else add(id, 'not on the Skill list');
  if (!s.why.trim() || !s.how.trim()) add(id, 'needs a WHY line and a HOW line');
  if (!CREW.includes(s.teach.crew)) add(id, `unknown crew member ${s.teach.crew}`);
  const beats = s.teach.iDo.beats ?? [];
  if (beats.length < 3 || beats.length > 5) add(id, `I do needs 3 to 5 beats, not ${beats.length}`);
  beats.forEach((b, i) => {
    if (wordCount(b.say) > LIMITS.beat) add(`${id} I do beat ${i + 1}`, `says ${wordCount(b.say)} words; keep it to ${LIMITS.beat}`);
    if (b.show && wordCount(b.show.replace(/\*/g, '')) > LIMITS.show) add(`${id} I do beat ${i + 1}`, `example is ${wordCount(b.show)} words; keep it to ${LIMITS.show}`);
  });
  if (wordCount(s.why) > LIMITS.why) add(id, `why is ${wordCount(s.why)} words; keep it to ${LIMITS.why}`);
  if (wordCount(s.how) > LIMITS.how) add(id, `how is ${wordCount(s.how)} words; keep it to ${LIMITS.how}`);
  s.teach.weDo.forEach((t, i) => {
    if (!t.hint.trim()) add(`${id} we do ${i + 1}`, 'needs a hint');
    out.push(...taskProblems(t, `${id} we do ${i + 1}`));
  });
  if (!s.creature.id || !s.creature.name || !s.creature.evolved) add(id, 'creature needs id, name and evolved name');

  if (id.startsWith('9.')) {
    const w = s.workshop;
    if (!w) add(id, 'Story workshop Skills need a workshop prompt');
    else {
      const n = wordCount(w.mentor);
      if (n < 50 || n > 160) add(id, `mentor text is ${n} words; aim for 50 to 160`);
      if (wordCount(w.ask) > 30) add(id, `writing prompt is ${wordCount(w.ask)} words; keep it to 30`);
      if (w.checklist.length < 3 || w.checklist.length > 4) add(id, 'checklist needs 3 or 4 ticks');
      w.checklist.forEach((c, i) => wordCount(c) > 10 && add(id, `checklist item ${i + 1} is over 10 words`));
    }
    if (file.encounters.length > 0) add(id, 'Story workshop Skills are never marked, so they have no Encounters');
  } else if (s.workshop) add(id, 'only Story workshop Skills have a workshop prompt');
  const reading = READING_BRANCHES.has(id.split('.')[0]!);
  for (const band of BANDS) {
    const es = file.encounters.filter((e) => e.band === band);
    if (es.length === 0) continue;
    const formats = new Set(es.map((e) => e.body.format)).size;
    if (formats < 3) add(`${id} Band ${band}`, `uses ${formats} formats; use at least 3`);
    const topics = new Map<string, number>();
    for (const e of es) if (e.topic !== 'general') topics.set(e.topic, (topics.get(e.topic) ?? 0) + 1);
    for (const [topic, n] of topics) if (n > 2) add(`${id} Band ${band}`, `topic ${topic} used ${n} times; at most 2`);
  }
  const ids = new Set<string>();
  for (const e of file.encounters) {
    const where = `${id} ${e.id}`;
    if (!e.id.startsWith(`${id}-`)) add(where, `encounter id must start with "${id}-"`);
    if (ids.has(e.id)) add(where, 'duplicate encounter id');
    ids.add(e.id);
    if (!BANDS.includes(e.band)) add(where, `band ${e.band} is not 1 to 4`);
    if (!TOPICS.has(e.topic)) add(where, `unknown topic ${e.topic}`);
    out.push(...taskProblems(e, where, e.band));
    if (e.body.format === 'choose' && e.band >= 3 && e.body.options.length < 4) add(where, `Band ${e.band} choose needs 4 options, has ${e.body.options.length}`);
    if (reading && e.text && sentences(e.text).length >= 3) {
      const [lo, hi] = BAND_TARGETS[e.band].passage;
      const n = wordCount(e.text);
      if (n < lo * 0.85 || n > hi * 1.15) add(where, `passage is ${n} words; Band ${e.band} wants ${lo} to ${hi}`);
    }
  }
  return out;
}

/** Branches whose Encounters are about reading whole texts, so passages are held to the Band's length. */
const READING_BRANCHES = new Set(['1', '2', '3', '4', '7']);

export function missingEncounters(file: SkillFile): Band[] {
  return BANDS.filter((band) => file.encounters.filter((e) => e.band === band).length < ENCOUNTERS_PER_BAND);
}

export interface ListedSkill {
  id: string;
  name: string;
  codes: string[];
}

export function parseSkillList(markdown: string): ListedSkill[] {
  const rows = markdown.matchAll(/^\| (\d\.\d+) \| (.+?) \| (.+?) \|$/gm);
  return [...rows].map(([, id, name, codes]) => ({
    id: id!,
    name: name!.trim(),
    codes: codes!.split(',').map((c) => c.trim()),
  }));
}

export const CHAPTER_WORDS: Record<Band, [number, number]> = { 1: [180, 320], 2: [280, 450], 3: [400, 620], 4: [550, 850] };

/** A Chapter is the same plot at four Bands: each within its length and sentence targets, in Australian spelling. */
export function chapterProblems(c: { id: string; title: string; bands: Record<Band, string>; unlock: { kind: string; branch?: string } }, branchIds: Set<string>): Problem[] {
  const out: Problem[] = [];
  const add = (problem: string) => out.push({ where: `chapter ${c.id}`, problem });
  if (!c.title.trim()) add('needs a title');
  if (c.unlock.branch && !branchIds.has(c.unlock.branch)) add(`unlocks on unknown branch ${c.unlock.branch}`);
  for (const band of BANDS) {
    const text = c.bands[band];
    if (!text?.trim()) {
      add(`missing Band ${band}`);
      continue;
    }
    const [lo, hi] = CHAPTER_WORDS[band];
    const n = wordCount(text);
    if (n < lo || n > hi) add(`Band ${band} is ${n} words; aim for ${lo} to ${hi}`);
    const avg = averageSentenceLength(text);
    if (avg > BAND_TARGETS[band].sentence) add(`Band ${band} sentences average ${avg.toFixed(1)}; keep to ${BAND_TARGETS[band].sentence}`);
    const us = text.match(US_SPELLINGS);
    if (us) add(`Band ${band} US spelling "${us[0]}"`);
  }
  return out;
}
