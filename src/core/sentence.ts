import type { BranchId, Content, Skill, SkillId } from '../content/types';
import { PRACTICE_TO_UNLOCK } from './route';
import { skillProgress, type Marks, type Save } from './save';

/** Fewest words of their own before DONE lights up on a Write your own card. */
export const SENTENCE_MIN_WORDS = 4;

/** The Student's words, in order. Marks on a Sentence or Piece index into this. */
export const words = (text: string): string[] => text.split(/\s+/).filter(Boolean);

export const wordCount = (text: string): number => words(text).length;

/** The same words split into paragraphs, so a Piece keeps its shape. Flattened, it is exactly `words(text)`. */
export const paragraphWords = (text: string): string[][] => text.split(/\n+/).map(words).filter((p) => p.length > 0);

/** Words the Student wrote themselves: a starter they kept doesn't count towards DONE. */
export function ownWords(text: string, starter?: string): number {
  const t = text.trim();
  const s = starter?.trim();
  return wordCount(s && t.startsWith(s) ? t.slice(s.length) : t);
}

/** One list of tapped words per check: in range, once each, in reading order. A check with no list gets none. */
export function cleanMarks(marks: Marks, checks: number, text: string): Marks {
  const n = wordCount(text);
  return Array.from({ length: checks }, (_, i) => [...new Set(marks[i] ?? [])].filter((w) => Number.isInteger(w) && w >= 0 && w < n).sort((a, b) => a - b));
}

/**
 * A Skill with a write task waits for the Student's own sentence once they have used the move: taught, and played
 * enough Encounters to open the next Skill. It stops waiting once one is written.
 */
export function owesSentence(content: Content, save: Save, id: SkillId): boolean {
  const p = skillProgress(save, id);
  return !!content.skill(id).write && p.taught && p.done >= PRACTICE_TO_UNLOCK && !save.sentences.some((s) => s.skill === id);
}

/** The first Skill on an Island still waiting for a sentence, if any. */
export function owedOn(content: Content, save: Save, branch: BranchId): Skill | undefined {
  return content.skillsOf(branch).find((s) => owesSentence(content, save, s.id));
}
