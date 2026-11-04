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
    };

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
  daysPlayed: number;
  lastPlayed?: Day;
  tide?: { day: Day; branch: BranchId; done: boolean };
  backupConfirmed?: Day;
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
    daysPlayed: 0,
    seen: {},
  };
}

export function skillProgress(save: Save, id: SkillId): SkillProgress {
  return save.skills[id] ?? { taught: false, done: 0, xp: 0, recent: [], mastered: false };
}
