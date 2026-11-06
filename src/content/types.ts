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
  /**
   * `proof` lists the passage sentences (from sentencesOf, counted from 0) any of which proves the answer. `proofAsk`
   * replaces "Tap the sentence that shows it." when the proof is a particular marker, such as a sound word only Dash uses.
   */
  | { format: 'choose'; options: Choice[]; answer: number; proof?: number[]; proofAsk?: string }
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

/** A piece of an example sentence. A tagged chunk is labelled (for example MAIN CLAUSE) once the step is won, or from the start if lit. */
export interface Chunk {
  text: string;
  tag?: string;
  lit?: boolean;
  /** Said when a student taps this chunk and it isn't the answer. */
  nudge?: string;
}
export type Show = (string | Chunk)[];

/** What the student must do before a teaching step lets them move on. A tap answer counts Chunks only, from 0. */
export type Check =
  | { kind: 'tap'; answer: number }
  | { kind: 'yesno'; answer: boolean; nudge: string }
  | { kind: 'pick'; options: Choice[]; answer: number };

export interface Step {
  say: string;
  show?: Show;
  ask: string;
  check: Check;
  win: string;
  /** This step shows the mistake students usually make and why it's wrong. */
  trap?: boolean;
}

/** The reminder a student can open mid-task: what each term means, two labelled examples, and the quick test. */
export interface MoveCard {
  terms: { term: string; means: string }[];
  examples: Show[];
  test: string;
}

export interface Teach {
  crew: CrewId;
  /** Tap to learn: short steps, each with one thing to do before moving on, then the Move card. */
  iDo: { steps: Step[]; card: MoveCard };
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

/**
 * Your turn to write: one sentence of the student's own that uses the move. Never marked; the student ticks their own
 * checks, then sees a model. `given` holds short sentences to combine or rewrite, which works for weak writers too.
 */
export interface WriteTask {
  ask: string;
  given?: string[];
  starter?: string;
  checks: string[];
  model: string;
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
  /** Story workshop Skills only: a short mentor text, the writing prompt, and the Student's own checklist. Never marked. */
  workshop?: { mentor: string; ask: string; checklist: string[] };
  /** Every marked Skill has one; the Story workshop is writing already. */
  write?: WriteTask;
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
  | { format: 'choose'; choice: number; proof?: number }
  | { format: 'tapText'; tap: number }
  | { format: 'order'; order: number[] }
  | { format: 'build'; tiles: number[] }
  | { format: 'fix'; tap: number; choice?: number }
  | { format: 'sort'; bins: number[] };
