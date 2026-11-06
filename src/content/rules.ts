import { normalise, piecesNeeded, taps, tilesFor } from '../core/check';
import type { SkillFile } from './bank';
import { BANDS, CREW, INTERESTS, type Band, type Body, type Chunk, type Show, type Task, type Teach } from './types';

export interface Problem {
  where: string;
  problem: string;
}

export const ENCOUNTERS_PER_BAND = 6;

/** Word limits for the words around a task, read by every Band, so a nine-year-old can follow them. */
export const LIMITS = { say: 20, ask: 14, show: 24, means: 16, why: 14, how: 16, feedback: 20 } as const;

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
      const texts = b.options.map((o) => normalise(o.text));
      if (new Set(texts).size !== texts.length) out.push('two options have the same text');
      break;
    }
    case 'tapText': {
      const t = taps(b.parts);
      if (t.length < 3) out.push('tapText needs at least 3 tappable parts, so a guess is right no more than a third of the time');
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
      if (t.length < 3) out.push('fix needs at least 3 tappable parts, so a guess is right no more than a third of the time');
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
  leaks(task).forEach(add);
  for (const t of textOf(task)) {
    const us = t.match(US_SPELLINGS);
    if (us) add(`US spelling "${us[0]}"`);
  }
  if (/\bdrag/i.test(task.prompt)) add('prompt says drag, but students tap to place: say "match", "put" or "tap"');
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
  out.push(...teachProblems(s.teach.iDo, id));
  if (wordCount(s.why) > LIMITS.why) add(id, `why is ${wordCount(s.why)} words; keep it to ${LIMITS.why}`);
  if (wordCount(s.how) > LIMITS.how) add(id, `how is ${wordCount(s.how)} words; keep it to ${LIMITS.how}`);
  s.teach.weDo.forEach((t, i) => {
    if (!t.hint.trim()) add(`${id} we do ${i + 1}`, 'needs a hint');
    const b = t.body;
    if ((b.format === 'choose' || b.format === 'fix') && b.options.length < 3) add(`${id} we do ${i + 1}`, 'a We do check needs at least 3 options, or a guess passes half the time');
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
  out.push(...tells(file).map((problem) => ({ where: id, problem })));
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
    const b = e.body;
    const passage = e.text ?? (b.format === 'tapText' || b.format === 'fix' ? b.parts.map((p) => (typeof p === 'string' ? p : p.tap)).join('') : '');
    if (reading && passage && sentences(passage).length >= 3) {
      const [lo, hi] = BAND_TARGETS[e.band].passage;
      const n = wordCount(passage);
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

/**
 * Answers must not give themselves away by their shape. If the right option is the longest (or the shortest)
 * in most of a Skill's choose tasks, a Student can win by picking on length without reading.
 */
export function tells(file: SkillFile): string[] {
  const chooses = file.encounters.flatMap((e) => (e.body.format === 'choose' ? [e.body] : []));
  const sorts = file.encounters.flatMap((e) => (e.body.format === 'sort' ? [e.body] : []));
  const even = sorts.filter((b) => new Set(b.bins.map((_, k) => b.items.filter((i) => i.bin === k).length)).size === 1).length;
  const evenProblem = sorts.length >= 3 && even / sorts.length > 0.75 ? [`${even} of ${sorts.length} sorts split evenly across their bins; make some uneven so students can't count instead of read`] : [];
  if (chooses.length < 6) return [...evenProblem, ...lastSlot(file)];
  const unique = (pick: (lens: number[]) => number) =>
    chooses.filter((b) => {
      const lens = b.options.map((o) => wordCount(o.text) * 100 + o.text.length);
      const target = pick(lens);
      return lens[b.answer] === target && lens.filter((l) => l === target).length === 1;
    }).length;
  const out: string[] = [...evenProblem, ...lastSlot(file)];
  const longest = unique((l) => Math.max(...l));
  const shortest = unique((l) => Math.min(...l));
  if (longest / chooses.length > 0.5) out.push(`the answer is the longest option in ${longest} of ${chooses.length} choose tasks; even out option lengths`);
  if (shortest / chooses.length > 0.5) out.push(`the answer is the shortest option in ${shortest} of ${chooses.length} choose tasks; even out option lengths`);
  return out;
}

/** Fix tasks whose wrong part sits last more often than not teach students to tap the end without reading. */
function lastSlot(file: SkillFile): string[] {
  const fixes = file.encounters.flatMap((e) => (e.body.format === 'fix' ? [e.body] : []));
  const last = fixes.filter((b) => b.spot === taps(b.parts).length - 1).length;
  return fixes.length >= 4 && last / fixes.length > 0.5 ? [`the wrong part is the last tap in ${last} of ${fixes.length} fix tasks; move some earlier`] : [];
}

const words = (t: string) => ` ${t.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim()} `;

/** A Second look that quotes the right answer hands it over instead of making the student think again. */
export function leaks(task: Task): string[] {
  const b = task.body;
  const quotes = (reason: string | undefined, answer: string) => !!reason && answer.trim().length >= 3 && words(reason).includes(words(answer));
  const wrongs: [string | undefined, string][] = [];
  if (b.format === 'choose' || b.format === 'fix') {
    const right = b.options[b.answer]?.text;
    if (right) b.options.forEach((o, i) => i !== b.answer && wrongs.push([o.reason, right]));
  }
  if (b.format === 'tapText' || b.format === 'fix') {
    const t = taps(b.parts);
    const answer = b.format === 'tapText' ? b.answer : b.spot;
    const right = t[answer]?.tap;
    if (right) t.forEach((p, i) => i !== answer && wrongs.push([p.reason, right]));
  }
  return wrongs.some(([r, a]) => quotes(r, a)) ? ['a wrong-answer reason quotes the right answer; make it point at the clue instead'] : [];
}

const showText = (show: Show) => show.map((p) => (typeof p === 'string' ? p : p.text)).join('');

/** Tap to learn: every step makes the student do something, nudges every wrong move, and the lesson names the usual mistake. */
export function teachProblems(iDo: Teach['iDo'], id: string): Problem[] {
  const out: Problem[] = [];
  const steps = iDo.steps ?? [];
  const add = (where: string, problem: string) => out.push({ where: `${id} ${where}`, problem });
  if (steps.length < 4 || steps.length > 8) add('I do', `needs 4 to 8 steps, not ${steps.length}`);
  if (!steps.some((st) => st.trap)) add('I do', 'one step must show the usual mistake and why it is wrong (trap: true)');
  let twoWay = 0;
  steps.forEach((st, i) => {
    const where = `I do step ${i + 1}`;
    const long = (label: string, text: string, max: number) => wordCount(text) > max && add(where, `${label} is ${wordCount(text)} words; keep it to ${max}`);
    long('say', st.say, LIMITS.say);
    long('ask', st.ask, LIMITS.ask);
    long('win', st.win, LIMITS.feedback);
    if (st.show) long('example', showText(st.show), LIMITS.show);
    const chunks = (st.show ?? []).filter((p): p is Chunk => typeof p !== 'string');
    for (const c of chunks) if (c.nudge) long('nudge', c.nudge, LIMITS.feedback);
    const c = st.check;
    if (c.kind === 'tap') {
      if (chunks.length < 2) add(where, 'a tap check needs at least 2 chunks to tap');
      if (c.answer < 0 || c.answer >= chunks.length) add(where, `tap answer ${c.answer} is not one of the ${chunks.length} chunks`);
      if (chunks.some((ch, k) => k !== c.answer && !ch.nudge)) add(where, 'every chunk that is not the answer needs a nudge');
      if (chunks.length === 2) twoWay++;
    }
    if (c.kind === 'yesno') {
      twoWay++;
      long('nudge', c.nudge, LIMITS.feedback);
    }
    if (c.kind === 'pick') {
      if (c.options.length < 2) add(where, 'a pick check needs at least 2 options');
      if (c.answer < 0 || c.answer >= c.options.length) add(where, `pick answer ${c.answer} is not one of the options`);
      if (c.options.some((o, k) => k !== c.answer && !o.reason)) add(where, 'every option that is not the answer needs a reason');
      if (c.options.length === 2) twoWay++;
    }
    const lines = [st.say, st.ask, st.win, ...(st.show ? [showText(st.show)] : []), ...chunks.flatMap((ch) => [ch.nudge ?? '']), ...(c.kind === 'yesno' ? [c.nudge] : []), ...(c.kind === 'pick' ? c.options.flatMap((o) => [o.text, o.reason ?? '']) : [])];
    for (const t of lines) {
      const us = t.match(US_SPELLINGS);
      if (us) add(where, `US spelling "${us[0]}"`);
      const ww = t.match(WORD_WORK);
      if (ww) add(where, `word work ("${ww[0]}") is out of scope`);
      if (t === st.ask && /\bdrag/i.test(t)) add(where, 'students tap, never drag');
    }
  });
  if (twoWay > steps.length / 2) add('I do', `${twoWay} of ${steps.length} steps are a two-way choice; give more steps three or more things to tap`);
  const card = iDo.card;
  if (!card) add('Move card', 'missing');
  else {
    if (card.terms.length < 2 || card.terms.length > 5) add('Move card', `needs 2 to 5 terms, not ${card.terms.length}`);
    if (card.examples.length !== 2) add('Move card', 'needs exactly 2 labelled examples');
    if (wordCount(card.test) > LIMITS.feedback) add('Move card', `test is ${wordCount(card.test)} words; keep it to ${LIMITS.feedback}`);
    // The card reminds; it must not be the first place a student meets a term.
    const tags = new Set(steps.flatMap((st) => st.show ?? []).flatMap((p) => (typeof p !== 'string' && p.tag ? [p.tag] : [])));
    for (const t of card.terms) {
      if (wordCount(t.means) > LIMITS.means) add('Move card', `"${t.term}" means is ${wordCount(t.means)} words; keep it to ${LIMITS.means}`);
      if (!tags.has(t.term)) add('Move card', `term "${t.term}" is never used as a label in the lesson steps, so the card would be the first place a student meets it`);
    }
  }
  return out;
}
