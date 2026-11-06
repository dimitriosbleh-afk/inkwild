import type { BranchId, Content, EncounterId, Skill, Step } from '../content/types';
import { interestWeight, poolKey, poolNear, unseen, weighted } from './pick';
import { skillProgress, type Day, type ReviewPhase, type Save } from './save';

/** A Daily review is three quick Encounters, one each from Skills mastered a while ago. */
export const REVIEW_SIZE = 3;
const MIN_MASTERED = 2;

/** Mastered Skills with Encounters to bring back. The Story workshop has none, so it never comes up. */
function reviewable(content: Content, save: Save): Skill[] {
  return content.branches
    .filter((b) => b.marked)
    .flatMap((b) => content.skillsOf(b.id))
    .filter((s) => skillProgress(save, s.id).mastered && poolNear(content, s.id, save.branches[s.branch].band).length > 0);
}

/** The day of the Skill's newest attempt. A Skill with none (restored from a Backup code) counts as longest ago. */
function lastPractised(save: Save, skill: Skill): number {
  const days = skillProgress(save, skill.id).recent.map((a) => a.day);
  return days.length ? Math.max(...days) : -Infinity;
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** How urgently a Skill needs bringing back: rusty first, then one missed in its last review, then the rest. */
function need(save: Save, skill: Skill): number {
  const p = skillProgress(save, skill.id);
  return p.rusty ? 0 : p.reviewMisses > 0 ? 1 : 2;
}

/**
 * Up to three Skills. Rusty Skills come first, then ones missed last time, whatever their Island. The rest are
 * longest unpractised first, one per Island before any Island gets a second.
 */
function pickSkills(save: Save, skills: Skill[], rand: () => number): Skill[] {
  const day = (s: Skill) => lastPractised(save, s);
  const byDay = (a: Skill, b: Skill) => (day(a) === day(b) ? 0 : day(a) < day(b) ? -1 : 1);
  const order = shuffle(skills, rand).sort((a, b) => need(save, a) - need(save, b) || byDay(a, b));
  const picked = order.filter((s) => need(save, s) < 2).slice(0, REVIEW_SIZE);
  const islands = new Set<BranchId>(picked.map((s) => s.branch));
  for (const s of order) {
    if (picked.length < REVIEW_SIZE && !picked.includes(s) && !islands.has(s.branch)) {
      picked.push(s);
      islands.add(s.branch);
    }
  }
  for (const s of order) if (picked.length < REVIEW_SIZE && !picked.includes(s)) picked.push(s);
  return picked;
}

/** Today's Daily review: nothing until two Skills are mastered, and nothing once today's is done. */
export function reviewFor(content: Content, save: Save, today: Day, rand: () => number): EncounterId[] {
  if (save.reviewDay === today) return [];
  const skills = reviewable(content, save);
  if (skills.length < MIN_MASTERED) return [];
  const weight = interestWeight(save.interests);
  return pickSkills(save, skills, rand).flatMap((s) => {
    const pool = poolNear(content, s.id, save.branches[s.branch].band);
    const pick = weighted(unseen(pool, save.seen[poolKey(s.id, pool[0]!.band)]), rand, weight);
    return pick ? [pick.id] : [];
  });
}

/** Whether a Daily review is waiting today. */
export function reviewDue(content: Content, save: Save, today: Day): boolean {
  return reviewFor(content, save, today, () => 0).length > 0;
}

/** The I do step that shows the mistake students usually make: what a rusty Skill replays before its review item. */
export function trapStep(skill: Skill): Step | undefined {
  return skill.teach.iDo.steps.find((s) => s.trap);
}

/** A review item opens on its Skill's trap step when the Skill is rusty and has one. */
export function reviewPhase(content: Content, save: Save, id: EncounterId): ReviewPhase {
  const skill = content.skill(content.encounter(id).skill);
  return skillProgress(save, skill.id).rusty && trapStep(skill) ? 'refresher' : 'task';
}
