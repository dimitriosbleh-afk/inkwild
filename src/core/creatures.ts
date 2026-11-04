import type { BranchId, Content, SkillId } from '../content/types';
import { type Save } from './save';

export interface Befriended {
  creature: string;
  skill: SkillId;
  branch: BranchId;
  name: string;
  level: number;
  evolved: boolean;
  shiny: boolean;
  received: boolean;
}

const XP_PER_LEVEL = 30;

export function levelFor(xp: number): number {
  return 1 + Math.floor(xp / XP_PER_LEVEL);
}

export function befriended(content: Content, save: Save): Befriended[] {
  const shinies = new Set(save.shinies);
  const own: Befriended[] = [];
  const ownIds = new Set<string>();
  for (const branch of content.branches) {
    for (const skill of content.skillsOf(branch.id)) {
      const p = save.skills[skill.id];
      if (!p || p.done === 0) continue;
      ownIds.add(skill.creature.id);
      own.push({
        creature: skill.creature.id,
        skill: skill.id,
        branch: branch.id,
        name: p.mastered ? skill.creature.evolved : skill.creature.name,
        level: levelFor(p.xp),
        evolved: p.mastered,
        shiny: shinies.has(skill.creature.id),
        received: false,
      });
    }
  }
  const creatureSkill = new Map(
    content.branches.flatMap((b) => content.skillsOf(b.id).map((s) => [s.creature.id, s] as const)),
  );
  const received = save.received
    .filter((r) => !ownIds.has(r.creature))
    .flatMap((r): Befriended[] => {
      const skill = creatureSkill.get(r.creature);
      if (!skill) return [];
      return [
        {
          creature: r.creature,
          skill: skill.id,
          branch: skill.branch,
          name: skill.creature.name,
          level: 1,
          evolved: false,
          shiny: r.shiny,
          received: true,
        },
      ];
    });
  return [...own, ...received];
}
