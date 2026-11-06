import { BRANCH_IDS, type Band, type BranchId, type EncounterId, type Interest, type SkillId } from '../content/types';

export type Day = number;

export type Outcome = 'first' | 'second' | 'shown';

/**
 * The versions of a Creature, rarest last. `plain` is caught by finishing one of its Skill's Encounters, `shiny` is a
 * rare find on a first-try result, `golden` is earned by five first-try results in a row on its Skill, and `champion`
 * by winning three Goldie battles with it.
 */
export const VARIANTS = ['plain', 'shiny', 'golden', 'champion'] as const;
export type Variant = (typeof VARIANTS)[number];

export interface Attempt {
  outcome: Outcome;
  band: Band;
  day: Day;
}

export interface SkillProgress {
  taught: boolean;
  done: number;
  xp: number;
  recent: Attempt[];
  mastered: boolean;
  masteredBand?: Band;
  /** Daily review items in a row not right first try. A right first try puts it back to 0. */
  reviewMisses: number;
  /** Missed in two Daily reviews in a row: it comes back first, after its trap step. Never changes mastery or Band. */
  rusty: boolean;
  /** First-try results in a row on this Skill's Encounters. Any other result puts it back to 0; a too-fast tap changes nothing. */
  streak: number;
}

export interface BranchProgress {
  band: Band;
  placing: number;
  recent: Outcome[];
  keeper: boolean;
  lastDay?: Day;
}

export interface Settings {
  textSize: 0 | 1 | 2;
  spacing: boolean;
  cream: boolean;
  sound: boolean;
  /** Each new crew or Keeper line speaks on its own. HEAR always works. */
  readAloud: boolean;
}

export interface CaptainLook {
  skin: number;
  hair: number;
  hairColour: number;
  outfit: number;
  colour: number;
}

/**
 * For each check or checklist item, in order, the words the Student tapped to show it: indexes into `words(text)`
 * from core/sentence. A check counts as ticked only when it has words.
 */
export type Marks = number[][];

export interface Piece {
  id: string;
  skill: SkillId;
  title: string;
  text: string;
  /** Checklist items with words tapped. Older saves ticked boxes, and have no marks. */
  ticks: boolean[];
  marks: Marks;
  day: Day;
}

/** One sentence of the Student's own from a Write your own card. Kept, never marked. */
export interface Sentence {
  skill: SkillId;
  text: string;
  ticks: boolean[];
  marks: Marks;
  day: Day;
}

export type Activity =
  | { kind: 'teach'; skill: SkillId; step: 0 | 1 | 2; tries: number }
  | { kind: 'encounter'; id: EncounterId; tries: number }
  | {
      kind: 'keeper';
      branch: BranchId;
      id: EncounterId;
      tries: number;
      hp: number;
      foe: number;
      turn: number;
    }
  /**
   * A Goldie battle, which carries the Daily review: one round per Encounter, from Skills across Islands. `fighter` is
   * the Creature the Student picked to fight with, and `rounds` holds how each finished round went. A rusty Skill's
   * item opens on its trap step (`refresher`) before the task.
   */
  | { kind: 'review'; ids: EncounterId[]; at: number; tries: number; rounds: Outcome[]; phase: ReviewPhase; fighter: string };

export type ReviewPhase = 'refresher' | 'task';

export interface Save {
  v: 1;
  started: Day;
  captain?: CaptainLook;
  interests: Interest[];
  settings: Settings;
  branches: Record<BranchId, BranchProgress>;
  skills: Partial<Record<SkillId, SkillProgress>>;
  /** For each Creature id, the variants the Student has, caught or from a Swap. A Skill's Creature counts as caught plain once one of its Encounters is done. */
  variants: Partial<Record<string, Variant[]>>;
  /** Goldie battles won with each Creature, by Creature id. */
  wins: Partial<Record<string, number>>;
  chaptersRead: string[];
  pieces: Piece[];
  sentences: Sentence[];
  daysPlayed: number;
  lastPlayed?: Day;
  tide?: { day: Day; branch: BranchId; done: boolean };
  backupConfirmed?: Day;
  /** The day the last Goldie battle (the Daily review) was finished. */
  reviewDay?: Day;
  seen: Record<string, EncounterId[]>;
  activity?: Activity;
}

export const PLACEMENT_ENCOUNTERS = 6;

export function newSave(today: Day): Save {
  const branches = {} as Record<BranchId, BranchProgress>;
  for (const id of BRANCH_IDS) {
    branches[id] = { band: 2, placing: PLACEMENT_ENCOUNTERS, recent: [], keeper: false };
  }
  return {
    v: 1,
    started: today,
    interests: [],
    settings: { textSize: 0, spacing: false, cream: false, sound: false, readAloud: false },
    branches,
    skills: {},
    variants: {},
    wins: {},
    chaptersRead: [],
    pieces: [],
    sentences: [],
    daysPlayed: 0,
    seen: {},
  };
}

/** Fields a save had before Creature variants: owned shinies, and Creatures from Swaps. */
interface Legacy {
  shinies?: string[];
  received?: { creature: string; shiny: boolean }[];
}

/**
 * A save as stored, which may come from before a field existed. Every field newSave sets is filled in when missing,
 * so add a default there when Save gains a field.
 */
export function upgradeSave(stored: Partial<Save> & Pick<Save, 'started'> & Legacy): Save {
  const { shinies = [], received = [], ...rest } = stored;
  const fresh = newSave(rest.started);
  const save: Save = { ...fresh, ...rest, settings: { ...fresh.settings, ...rest.settings }, branches: { ...fresh.branches, ...rest.branches } };
  const skills: Save['skills'] = {};
  for (const [id, p] of Object.entries(save.skills) as [SkillId, SkillProgress | undefined][]) if (p) skills[id] = { ...NO_PROGRESS, ...p };
  save.skills = skills;
  save.sentences = save.sentences.map((s) => ({ ...s, marks: s.marks ?? [] }));
  save.pieces = save.pieces.map((p) => ({ ...p, marks: p.marks ?? [] }));
  save.variants = structuredClone(save.variants);
  for (const id of shinies) addVariant(save, id, 'shiny');
  for (const r of received) addVariant(save, r.creature, r.shiny ? 'shiny' : 'plain');
  if (save.activity) save.activity = upgradeActivity(save.activity);
  return save;
}

type StoredReview = Omit<Extract<Activity, { kind: 'review' }>, 'phase' | 'rounds' | 'fighter'> & Partial<Extract<Activity, { kind: 'review' }>> & { firsts?: number };

/**
 * A review under way from before Goldie battles: it gets a trap-step phase, and rounds from its first-try count (the
 * rest counted as shown, so nothing is won that wasn't earned). It has no fighter, so `fighter` is left empty: the
 * captain fights, and a win counts for no Creature.
 */
function upgradeActivity(a: Activity): Activity {
  if (a.kind !== 'review') return a;
  const old = a as StoredReview;
  const firsts = old.firsts ?? 0;
  const rounds = old.rounds ?? Array.from({ length: old.at }, (_, i): Outcome => (i < firsts ? 'first' : 'shown'));
  return { kind: 'review', ids: old.ids, at: old.at, tries: old.tries, rounds, phase: old.phase ?? 'task', fighter: old.fighter ?? '' };
}

/** Adds a variant of a Creature, kept in VARIANTS order. True when it is new. */
export function addVariant(save: Save, creature: string, variant: Variant): boolean {
  const had = save.variants[creature] ?? [];
  if (had.includes(variant)) return false;
  save.variants[creature] = VARIANTS.filter((v) => v === variant || had.includes(v));
  return true;
}

const NO_PROGRESS: SkillProgress = { taught: false, done: 0, xp: 0, recent: [], mastered: false, reviewMisses: 0, rusty: false, streak: 0 };

export function skillProgress(save: Save, id: SkillId): SkillProgress {
  return save.skills[id] ?? { ...NO_PROGRESS, recent: [] };
}
