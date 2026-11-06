import type { Branch, BranchId, Content, Skill, SkillId } from '../content/types';
import { VARIANTS, type Save, type Variant } from './save';

export interface Befriended {
  creature: string;
  skill: SkillId;
  branch: BranchId;
  name: string;
  level: number;
  evolved: boolean;
  /** Every variant the Student has, in VARIANTS order. Never empty. */
  variants: Variant[];
  /** The rarest variant the Student has: how the Creature is drawn. */
  look: Variant;
  /** Only from a Swap: its Skill has no Encounter done yet. */
  received: boolean;
  /** Goldie battles won with it. */
  wins: number;
}

const XP_PER_LEVEL = 30;
/** Goldie battle wins that make a Creature a Champion. */
export const CHAMPION_WINS = 3;
/** First-try results in a row on a Skill that earn its Creature's golden variant. */
export const GOLDEN_STREAK = 5;

export function levelFor(xp: number): number {
  return 1 + Math.floor(xp / XP_PER_LEVEL);
}

/** The variants of a Skill's Creature the Student has. Finishing one of its Encounters always counts as the plain one. */
export function variantsOf(save: Save, skill: Skill): Variant[] {
  const stored = save.variants[skill.creature.id] ?? [];
  const caught = (save.skills[skill.id]?.done ?? 0) > 0;
  return VARIANTS.filter((v) => stored.includes(v) || (v === 'plain' && caught));
}

/** The rarest of some variants. */
export function rarest(variants: readonly Variant[]): Variant {
  return [...VARIANTS].reverse().find((v) => variants.includes(v)) ?? 'plain';
}

/** Every Skill with a Creature, in Island order. */
export function creatureSkills(content: Content): Skill[] {
  return content.branches.flatMap((b) => content.skillsOf(b.id));
}

export function skillOfCreature(content: Content, creature: string): Skill | undefined {
  return creatureSkills(content).find((s) => s.creature.id === creature);
}

export function befriended(content: Content, save: Save): Befriended[] {
  const own: Befriended[] = [];
  const received: Befriended[] = [];
  for (const skill of creatureSkills(content)) {
    const variants = variantsOf(save, skill);
    if (variants.length === 0) continue;
    const p = save.skills[skill.id];
    const caught = !!p && p.done > 0;
    (caught ? own : received).push({
      creature: skill.creature.id,
      skill: skill.id,
      branch: skill.branch,
      name: caught && p.mastered ? skill.creature.evolved : skill.creature.name,
      level: caught ? levelFor(p.xp) : 1,
      evolved: caught && p.mastered,
      variants,
      look: rarest(variants),
      received: !caught,
      wins: save.wins[skill.creature.id] ?? 0,
    });
  }
  return [...own, ...received];
}

/** One Creature in the Field Guide: a Skill's own, or a Keeper's partner, met by beating that Keeper. */
export type GuideEntry =
  | { kind: 'skill'; creature: string; branch: BranchId; skill: Skill; caught: Befriended | undefined }
  | { kind: 'keeper'; creature: string; branch: BranchId; name: string; keeper: string; met: boolean };

export interface GuideIsland {
  branch: Branch;
  entries: GuideEntry[];
}

export interface GuideCounts {
  caught: number;
  total: number;
  shiny: number;
  golden: number;
  champion: number;
}

/** A Keeper's partner Creature's id, as its art is keyed. */
export const keeperCreature = (branch: Branch): string => branch.keeper.creature.toLowerCase();

/** Every Creature there is, grouped by Island: the Skills' Creatures, then the Keeper's partner where there is a Keeper. */
export function fieldGuide(content: Content, save: Save): GuideIsland[] {
  const mine = new Map(befriended(content, save).map((c) => [c.creature, c]));
  return content.branches
    .filter((b) => content.skillsOf(b.id).length > 0)
    .map((branch) => {
      const entries: GuideEntry[] = content.skillsOf(branch.id).map((skill) => ({ kind: 'skill', creature: skill.creature.id, branch: branch.id, skill, caught: mine.get(skill.creature.id) }));
      if (branch.marked && branch.keeper.creature) {
        entries.push({ kind: 'keeper', creature: keeperCreature(branch), branch: branch.id, name: branch.keeper.creature, keeper: branch.keeper.name, met: save.branches[branch.id].keeper });
      }
      return { branch, entries };
    });
}

export function guideCounts(islands: GuideIsland[]): GuideCounts {
  const entries = islands.flatMap((i) => i.entries);
  const has = (v: Variant) => entries.filter((e) => e.kind === 'skill' && e.caught?.variants.includes(v)).length;
  return {
    caught: entries.filter((e) => (e.kind === 'skill' ? !!e.caught : e.met)).length,
    total: entries.length,
    shiny: has('shiny'),
    golden: has('golden'),
    champion: has('champion'),
  };
}

/** A Skill's move as a Student would say it: the part of its name before any colon, such as "Find it". */
export function moveName(skill: Skill): string {
  return skill.name.split(':')[0]!.trim();
}

/** How to get a variant of a Skill's Creature, in kid words, with how far along the Student is. */
export function variantHint(content: Content, save: Save, skill: Skill, variant: Variant): string {
  const move = moveName(skill);
  const p = save.skills[skill.id];
  switch (variant) {
    case 'plain':
      return `Plain: find it in the long grass on ${content.branch(skill.branch).island}.`;
    case 'shiny':
      return `Shiny: a rare find when you get ${move} right first try. Tide quest days are luckier!`;
    case 'golden': {
      const on = Math.min(p?.streak ?? 0, GOLDEN_STREAK - 1);
      return `Golden: get ${GOLDEN_STREAK} right first try in a row on ${move}.${on > 0 ? ` You're on ${on}.` : ''}`;
    }
    case 'champion': {
      const wins = Math.min(save.wins[skill.creature.id] ?? 0, CHAMPION_WINS - 1);
      return `Champion: win ${CHAMPION_WINS} Goldie battles with ${skill.creature.name}.${wins > 0 ? ` ${wins} won so far.` : ''}`;
    }
  }
}
