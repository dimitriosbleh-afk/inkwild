import { BRANCH_IDS, type Band, type BranchId, type EncounterId, type Interest, type SkillId } from '../content/types';

export type Day = number;

export type Outcome = 'first' | 'second' | 'shown';

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
}

export interface CaptainLook {
  skin: number;
  hair: number;
  hairColour: number;
  outfit: number;
  colour: number;
}

export interface Piece {
  id: string;
  skill: SkillId;
  title: string;
  text: string;
  ticks: boolean[];
  day: Day;
}

/** One sentence of the Student's own from a Write your own card. Kept, never marked. */
export interface Sentence {
  skill: SkillId;
  text: string;
  ticks: boolean[];
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
  /** The Daily review: Encounters from mastered Skills across Islands. `firsts` counts right-first-try answers so far. */
  | { kind: 'review'; ids: EncounterId[]; at: number; tries: number; firsts: number };

export interface Save {
  v: 1;
  started: Day;
  captain?: CaptainLook;
  interests: Interest[];
  settings: Settings;
  branches: Record<BranchId, BranchProgress>;
  skills: Partial<Record<SkillId, SkillProgress>>;
  shinies: string[];
  received: { creature: string; shiny: boolean }[];
  chaptersRead: string[];
  pieces: Piece[];
  sentences: Sentence[];
  daysPlayed: number;
  lastPlayed?: Day;
  tide?: { day: Day; branch: BranchId; done: boolean };
  backupConfirmed?: Day;
  /** The day the last Daily review was finished. */
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
    settings: { textSize: 0, spacing: false, cream: false, sound: false },
    branches,
    skills: {},
    shinies: [],
    received: [],
    chaptersRead: [],
    pieces: [],
    sentences: [],
    daysPlayed: 0,
    seen: {},
  };
}

/**
 * A save as stored, which may come from before a field existed. Every field newSave sets is filled in when missing,
 * so add a default there when Save gains a field.
 */
export function upgradeSave(stored: Partial<Save> & Pick<Save, 'started'>): Save {
  const fresh = newSave(stored.started);
  return { ...fresh, ...stored, settings: { ...fresh.settings, ...stored.settings }, branches: { ...fresh.branches, ...stored.branches } };
}

export function skillProgress(save: Save, id: SkillId): SkillProgress {
  return save.skills[id] ?? { taught: false, done: 0, xp: 0, recent: [], mastered: false };
}
