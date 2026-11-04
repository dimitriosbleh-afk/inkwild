export const BRANCH_IDS = [
  'between',
  'whose',
  'convince',
  'pictures',
  'sentence',
  'punctuation',
  'structure',
  'editing',
  'workshop',
] as const;
export type BranchId = (typeof BRANCH_IDS)[number];

export type Band = 1 | 2 | 3 | 4;
export const BANDS: readonly Band[] = [1, 2, 3, 4];

export const INTERESTS = [
  'sport',
  'animals',
  'space',
  'gross-science',
  'gaming',
  'art',
  'music',
  'ocean',
  'spooky',
  'funny',
  'food',
  'robots',
] as const;
export type Interest = (typeof INTERESTS)[number];
export type Topic = Interest | 'general';

export type SkillId = `${number}.${number}`;
export type EncounterId = string;

export interface Branch {
  id: BranchId;
  number: number;
  name: string;
  island: string;
  marked: boolean;
  keeperAfter: number;
  keeper: { name: string; creature: string };
}

export interface Choice {
  text: string;
  reason?: string;
}

export type Part = string | { tap: string; reason?: string };

export type Body =
  | { format: 'choose'; options: Choice[]; answer: number }
  | { format: 'tapText'; parts: Part[]; answer: number }
  | { format: 'order'; items: string[]; reason: string }
  | { format: 'build'; tiles: string[]; accept: string[]; reason: string }
  | { format: 'fix'; parts: Part[]; spot: number; options: Choice[]; answer: number }
  | { format: 'sort'; bins: string[]; items: { text: string; bin: number; reason: string }[] };

export type Format = Body['format'];

export interface Task {
  frame?: string;
  text?: string;
  prompt: string;
  success: string;
  body: Body;
}

export interface Encounter extends Task {
  id: EncounterId;
  skill: SkillId;
  band: Band;
  topic: Topic;
}

export interface Teach {
  crew: CrewId;
  /** One short beat at a time. `show` is an example; wrap the parts to light up in **double stars**. */
  iDo: { beats: { say: string; show?: string }[] };
  weDo: [Task & { hint: string }, Task & { hint: string }];
}

export const CREW = ['nav', 'engineer', 'gamer', 'rescuer', 'artist', 'joker'] as const;
export type CrewId = (typeof CREW)[number];

export interface CreatureDef {
  id: string;
  name: string;
  evolved: string;
  blurb: string;
}

export interface Skill {
  id: SkillId;
  branch: BranchId;
  order: number;
  name: string;
  codes: string[];
  why: string;
  how: string;
  teach: Teach;
  creature: CreatureDef;
}

export interface Content {
  branches: Branch[];
  branch: (id: BranchId) => Branch;
  skillsOf: (id: BranchId) => Skill[];
  skill: (id: SkillId) => Skill;
  encounter: (id: EncounterId) => Encounter;
  pool: (skill: SkillId, band: Band) => Encounter[];
}

export type Response =
  | { format: 'choose'; choice: number }
  | { format: 'tapText'; tap: number }
  | { format: 'order'; order: number[] }
  | { format: 'build'; tiles: number[] }
  | { format: 'fix'; tap: number; choice?: number }
  | { format: 'sort'; bins: number[] };
