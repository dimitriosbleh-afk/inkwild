import type { BranchId, Content, Skill, SkillId } from '../content/types';
import { skillProgress, type Save } from './save';

/** Fewest words of their own before DONE lights up on a Write your own card. */
export const SENTENCE_MIN_WORDS = 4;

export const wordCount = (text: string): number => text.split(/\s+/).filter(Boolean).length;

/** Words the Student wrote themselves: a starter they kept doesn't count towards DONE. */
export function ownWords(text: string, starter?: string): number {
  const t = text.trim();
  const s = starter?.trim();
  return wordCount(s && t.startsWith(s) ? t.slice(s.length) : t);
}

/** A taught Skill with a write task waits for the Student's own sentence until they have written one. */
export function owesSentence(content: Content, save: Save, id: SkillId): boolean {
  return !!content.skill(id).write && skillProgress(save, id).taught && !save.sentences.some((s) => s.skill === id);
}

/** The first Skill on an Island still waiting for a sentence, if any. */
export function owedOn(content: Content, save: Save, branch: BranchId): Skill | undefined {
  return content.skillsOf(branch).find((s) => owesSentence(content, save, s.id));
}
