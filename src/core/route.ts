import type { Band, BranchId, Content, Skill, SkillId } from '../content/types';
import { skillProgress, type Save, type SkillProgress } from './save';

export const PRACTICE_TO_UNLOCK = 3;
const MASTERY_WINDOW = 5;
const MASTERY_FIRSTS = 4;

export type RouteItem = { kind: 'skill'; skill: Skill } | { kind: 'keeper' };

export function route(content: Content, branch: BranchId): RouteItem[] {
  const skills = content.skillsOf(branch).map((skill): RouteItem => ({ kind: 'skill', skill }));
  const b = content.branch(branch);
  if (!b.marked) return skills;
  return [...skills.slice(0, b.keeperAfter), { kind: 'keeper' }, ...skills.slice(b.keeperAfter)];
}

export function isUnlocked(content: Content, save: Save, id: SkillId): boolean {
  const skill = content.skill(id);
  const skills = content.skillsOf(skill.branch);
  const i = skills.findIndex((s) => s.id === id);
  if (i <= 0) return true;
  const prev = skillProgress(save, skills[i - 1]!.id);
  if (!prev.taught || prev.done < PRACTICE_TO_UNLOCK) return false;
  const b = content.branch(skill.branch);
  if (b.marked && i === b.keeperAfter) return save.branches[skill.branch].keeper;
  return true;
}

export function keeperOpen(content: Content, save: Save, branch: BranchId): boolean {
  const b = content.branch(branch);
  if (!b.marked) return false;
  return content
    .skillsOf(branch)
    .slice(0, b.keeperAfter)
    .every((s) => skillProgress(save, s.id).mastered);
}

export function unlockedSkills(content: Content, save: Save, branch: BranchId): Skill[] {
  return content.skillsOf(branch).filter((s) => isUnlocked(content, save, s.id));
}

export function routePosition(content: Content, save: Save, branch: BranchId): number {
  const items = route(content, branch);
  const firstOpen = items.findIndex((item) =>
    item.kind === 'keeper' ? !save.branches[branch].keeper : !skillProgress(save, item.skill.id).mastered,
  );
  return firstOpen === -1 ? items.length : firstOpen;
}

export function masteredAt(p: SkillProgress, band: Band): boolean {
  const atBand = p.recent.filter((a) => a.band === band).slice(-MASTERY_WINDOW);
  if (atBand.length < MASTERY_WINDOW) return false;
  const firsts = atBand.filter((a) => a.outcome === 'first').length;
  const days = new Set(atBand.map((a) => a.day)).size;
  return firsts >= MASTERY_FIRSTS && days >= 2;
}
