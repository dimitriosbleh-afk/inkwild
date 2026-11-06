import type { BranchId, Content, EncounterId, Skill, Step } from '../content/types';
import { befriended } from './creatures';
import { interestWeight, poolKey, poolNear, unseen, weighted } from './pick';
import { skillProgress, type Day, type ReviewPhase, type Save } from './save';

/** A Daily review, played as a Goldie battle, is three quick Encounters: one round each. */
export const REVIEW_SIZE = 3;
const MIN_MASTERED = 2;

/**
 * Skills with Encounters to bring back: the mastered ones once there are two, else every Skill taught and played at
 * least once, so a new Student can battle too. The Story workshop has no Encounters, so it never comes up.
 */
function reviewable(content: Content, save: Save): Skill[] {
  const playable = content.branches
    .filter((b) => b.marked)
    .flatMap((b) => content.skillsOf(b.id))
    .filter((s) => poolNear(content, s.id, save.branches[s.branch].band).length > 0);
  const mastered = playable.filter((s) => skillProgress(save, s.id).mastered);
  if (mastered.length >= MIN_MASTERED) return mastered;
  return playable.filter((s) => skillProgress(save, s.id).taught && skillProgress(save, s.id).done >= 1);
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

/**
 * Today's Daily review: one Encounter from each picked Skill. With fewer than three Skills to pick from, the most
 * needed come round again with a different Encounter, so a battle still has three rounds. Nothing once today's is done.
 */
export function reviewFor(content: Content, save: Save, today: Day, rand: () => number): EncounterId[] {
  if (save.reviewDay === today) return [];
  const skills = pickSkills(save, reviewable(content, save), rand);
  if (skills.length === 0) return [];
  const weight = interestWeight(save.interests);
  const ids: EncounterId[] = [];
  for (let i = 0; i < REVIEW_SIZE * 2 && ids.length < REVIEW_SIZE; i++) {
    const s = skills[i % skills.length]!;
    const pool = poolNear(content, s.id, save.branches[s.branch].band).filter((e) => !ids.includes(e.id));
    const pick = pool.length ? weighted(unseen(pool, save.seen[poolKey(s.id, pool[0]!.band)]), rand, weight) : undefined;
    if (pick) ids.push(pick.id);
  }
  return ids;
}

/** Whether a Goldie battle is waiting today: there are rounds to play and a Creature to fight with. */
export function reviewDue(content: Content, save: Save, today: Day): boolean {
  return reviewFor(content, save, today, () => 0).length > 0 && befriended(content, save).length > 0;
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
