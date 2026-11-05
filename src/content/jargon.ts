import type { SkillFile } from './bank';
import type { Body, Task } from './types';

/**
 * Grammar and literature terms a Student may not know yet. Each matches its plural and simple variants.
 * Words taught before Level 5 (noun, verb, adjective, sentence, paragraph, full stop, comma) are left out on purpose.
 */
export const TERMS: Record<string, RegExp> = {
  clause: /\bclauses?\b/i,
  'main clause': /\bmain clauses?\b/i,
  'dependent clause': /\bdependent( clauses?)?\b/i,
  'simple sentence': /\bsimple sentences?\b/i,
  compound: /\bcompound\b/i,
  complex: /\bcomplex\b/i,
  conjunction: /\bconjunctions?\b/i,
  'noun group': /\bnoun groups?\b/i,
  'verb group': /\bverb groups?\b/i,
  adverbial: /\badverbials?\b/i,
  adverb: /\badverbs?\b/i,
  preposition: /\bprepositions?(al)?\b/i,
  pronoun: /\bpronouns?\b/i,
  tense: /(past|present|future|verb|the|same|wrong|right) tenses?|tenses|tense (slips?|changes?|shifts?)/i,
  modality: /\bmodal(ity|s)?\b/i,
  cohesion: /\bcohesi(on|ve)\b/i,
  nominalisation: /\bnominali[sz]ation\b/i,
  possessive: /\bpossessive\b/i,
  contraction: /\bcontractions?\b/i,
  'direct speech': /\bdirect speech\b/i,
  'reported speech': /\b(reported|indirect) speech\b/i,
  semicolon: /\bsemicolons?\b/i,
  colon: /\bcolons?\b/i,
  ellipsis: /\bellipsis\b/i,
  'topic sentence': /\btopic sentences?\b/i,
  connective: /\bconnectives?\b/i,
  register: /\bregister\b/i,
  formal: /\b(in)?formal\b/i,
  simile: /\bsimiles?\b/i,
  metaphor: /\bmetaphors?\b/i,
  personification: /\bpersonification\b/i,
  'figurative language': /\bfigurative\b/i,
  'evaluative language': /\bevaluative\b/i,
  'rhetorical question': /\brhetorical\b/i,
  emotive: /\bemotive\b/i,
  'point of view': /(first|second|third)[- ]person/i,
  orientation: /\borientation\b/i,
  complication: /\bcomplication\b/i,
  resolution: /\bresolution\b/i,
  infer: /\binfer(ence|ring|red)?s?\b/i,
  'camera angle': /\b(camera )?angles?\b/i,
  salience: /\bsalien(ce|t)\b/i,
  vector: /\bvectors?\b/i,
};

export interface Untaught {
  term: string;
  where: string;
}

/** Every Student-facing line of a Task except the story text itself, which can use any word it likes. */
function taskLines(t: Task, label: string): [string, string][] {
  const out: [string, string][] = [[`${label} prompt`, t.prompt], [`${label} success`, t.success]];
  if (t.frame) out.push([`${label} frame`, t.frame]);
  const hint = (t as Task & { hint?: string }).hint;
  if (hint) out.push([`${label} hint`, hint]);
  return [...out, ...bodyLines(t.body, label)];
}

function bodyLines(b: Body, label: string): [string, string][] {
  const tapReasons = (parts: (string | { reason?: string })[]) =>
    parts.flatMap((p) => (typeof p === 'object' && p.reason ? [[`${label} reason`, p.reason] as [string, string]] : []));
  switch (b.format) {
    case 'choose':
      return b.options.flatMap((o) => [[`${label} option`, o.text], ...(o.reason ? [[`${label} reason`, o.reason]] : [])] as [string, string][]);
    case 'tapText':
      return tapReasons(b.parts);
    case 'order':
    case 'build':
      return [[`${label} reason`, b.reason]];
    case 'fix':
      return [...tapReasons(b.parts), ...b.options.flatMap((o) => (o.reason ? [[`${label} reason`, o.reason] as [string, string]] : []))];
    case 'sort':
      return [...b.bins.map((x) => [`${label} pile`, x] as [string, string]), ...b.items.map((i) => [`${label} reason`, i.reason] as [string, string])];
  }
}

/** A term counts as taught once a crew member says it in the I do of this Skill or an earlier Skill on the same Island. */
function taughtBy(file: SkillFile, files: SkillFile[]): Set<string> {
  const [branch, order] = file.skill.id.split('.').map(Number);
  const earlier = files.filter((f) => {
    const [b, o] = f.skill.id.split('.').map(Number);
    return b === branch && o! <= order!;
  });
  const said = earlier.flatMap((f) => f.skill.teach.iDo.beats.map((b) => b.say)).join(' ');
  return new Set(Object.entries(TERMS).filter(([, re]) => re.test(said)).map(([term]) => term));
}

/** Terms a Skill shows a Student before any crew member has explained them. */
export function untaughtTerms(file: SkillFile, files: SkillFile[]): Untaught[] {
  const taught = taughtBy(file, files);
  const lines: [string, string][] = [
    ['why', file.skill.why],
    ...file.skill.teach.weDo.flatMap((t, i) => taskLines(t, `weDo ${i + 1}`)),
    ...file.encounters.flatMap((e) => taskLines(e, e.id)),
  ];
  const out: Untaught[] = [];
  for (const [where, text] of lines)
    for (const [term, re] of Object.entries(TERMS)) if (!taught.has(term) && re.test(text)) out.push({ term, where });
  return out;
}
