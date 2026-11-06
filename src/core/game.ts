import type { BranchId, Content, Encounter, EncounterId, Response, Skill, SkillId, Task } from '../content/types';
import { recordForBand } from './bands';
import { check, checkedBody } from './check';
import { befriended, CHAMPION_WINS, GOLDEN_STREAK, skillOfCreature, variantsOf } from './creatures';
import { tooFast } from './pace';
import { interestWeight, poolKey, poolNear, weighted } from './pick';
import { reviewFor, reviewPhase } from './review';
import { isUnlocked, keeperOpen, masteredAt, unlockedSkills } from './route';
import { addVariant, skillProgress, type Activity, type Day, type Marks, type Outcome, type Save, type SkillProgress, type Variant } from './save';
import { cleanMarks } from './sentence';

export interface Ctx {
  day: Day;
  rand: () => number;
}

export type Action =
  | { type: 'open' }
  | { type: 'begin'; branch: BranchId }
  | { type: 'keeper'; branch: BranchId }
  | { type: 'advance' }
  /** `ms`: how long since the task appeared, so a first answer tapped before the passage could be read doesn't count. */
  | { type: 'answer'; response: Response; ms?: number }
  | { type: 'retreat' }
  /** `marks`: for each checklist item, the words of the Piece the Student tapped to show it. */
  | { type: 'piece'; skill: SkillId; title: string; text: string; marks: Marks }
  | { type: 'receive'; creature: string; variant: Variant }
  /** `marks`: for each check, the words of the sentence the Student tapped to show it. */
  | { type: 'sentence'; skill: SkillId; text: string; marks: Marks }
  /** Start today's Goldie battle, fighting with `creature`: one the Student has befriended. */
  | { type: 'review'; creature: string };

export type GameEvent =
  | { type: 'secondLook'; reason: string }
  /** A first answer too soon to have read the passage: not an attempt, nothing changes. */
  | { type: 'tooFast' }
  | { type: 'continue' }
  | { type: 'resolved'; outcome: Outcome; success: string; reason?: string }
  | { type: 'taught'; skill: SkillId }
  | { type: 'befriended'; skill: SkillId; creature: string; shiny: boolean }
  /** A rarer version of a Creature already befriended. */
  | { type: 'variant'; skill: SkillId; creature: string; variant: Exclude<Variant, 'plain'> }
  | { type: 'evolved'; skill: SkillId; creature: string }
  | { type: 'unlocked'; skill: SkillId }
  | { type: 'keeperOpen'; branch: BranchId }
  | { type: 'hit'; target: 'foe' | 'you'; amount: number }
  | { type: 'badge'; branch: BranchId }
  | { type: 'retreated'; branch: BranchId }
  | { type: 'tide'; branch: BranchId }
  | { type: 'empty'; branch: BranchId }
  | { type: 'received'; creature: string; variant: Variant; already: boolean }
  | { type: 'wrote'; skill: SkillId }
  /** The end of a Goldie battle. `wins` is the fighter's battle wins now; `right` counts rounds right first or second try. */
  | { type: 'battleDone'; won: boolean; creature: string; wins: number; first: number; right: number; of: number };

export interface Step {
  save: Save;
  events: GameEvent[];
}

const RECENT_ATTEMPTS = 10;
const XP_PER_ENCOUNTER = 10;
const XP_PER_SENTENCE = 10;
const SHINY_ODDS = 64;
const TIDE_SHINY_ODDS = 16;
/** Daily review misses in a row that make a Skill rusty. */
export const RUSTY_AFTER = 2;
export const KEEPER_HP = 100;
export const HIT = { first: 25, second: 15, chip: 10, miss: 25 } as const;
/** A Goldie battle: right first try is a full hit, second try a half, and an answer shown lets the Goldie hit you. */
export const GOLDIE_HP = 100;
export const GOLDIE_HIT = { first: 40, second: 20, back: 40 } as const;
/** Rounds right, first or second try, that win a Goldie battle. */
export const BATTLE_TO_WIN = 2;

/** Whether a Goldie battle's rounds win it. */
export function battleWon(rounds: readonly Outcome[]): boolean {
  return rounds.filter((o) => o !== 'shown').length >= BATTLE_TO_WIN;
}

/** Each side's HP after these rounds, out of GOLDIE_HP. */
export function battleHp(rounds: readonly Outcome[]): { you: number; foe: number } {
  const dealt = (o: Outcome) => (o === 'first' ? GOLDIE_HIT.first : o === 'second' ? GOLDIE_HIT.second : 0);
  const foe = rounds.reduce((hp, o) => hp - dealt(o), GOLDIE_HP);
  const you = GOLDIE_HP - rounds.filter((o) => o === 'shown').length * GOLDIE_HIT.back;
  return { you: Math.max(0, you), foe: Math.max(0, foe) };
}

/** A Skill's first-try streak after one more result. */
export function streakAfter(streak: number, outcome: Outcome): number {
  return outcome === 'first' ? streak + 1 : 0;
}

/** XP for one Encounter: the Creature slipped away when the answer had to be shown, so that earns none. */
export function xpFor(outcome: Outcome): number {
  return outcome === 'shown' ? 0 : XP_PER_ENCOUNTER;
}

export function step(content: Content, current: Save, action: Action, ctx: Ctx): Step {
  const save = structuredClone(current);
  const events: GameEvent[] = [];
  const run = new Run(content, save, ctx, events);
  run.act(action);
  return { save, events };
}

export function currentTask(content: Content, activity: Activity): Task {
  if (activity.kind === 'teach') {
    const teach = content.skill(activity.skill).teach;
    const task = teach.weDo[activity.step === 2 ? 1 : 0];
    return task;
  }
  return content.encounter(encounterOf(activity));
}

/** The Encounter on screen in any activity but teaching. */
export function encounterOf(activity: Exclude<Activity, { kind: 'teach' }>): EncounterId {
  return activity.kind === 'review' ? activity.ids[activity.at]! : activity.id;
}

export function tideBranch(content: Content, save: Save, ctx: Ctx): BranchId {
  const marked = content.branches.filter((b) => b.marked && content.skillsOf(b.id).length > 0);
  const oldest = Math.min(...marked.map((b) => save.branches[b.id].lastDay ?? -Infinity));
  const neglected = marked.filter((b) => (save.branches[b.id].lastDay ?? -Infinity) === oldest);
  return neglected[Math.floor(ctx.rand() * neglected.length)]!.id;
}

class Run {
  constructor(
    private content: Content,
    private save: Save,
    private ctx: Ctx,
    private events: GameEvent[],
  ) {}

  act(action: Action): void {
    switch (action.type) {
      case 'open':
        return this.open();
      case 'begin':
        return this.begin(action.branch);
      case 'keeper':
        return this.startKeeper(action.branch);
      case 'advance':
        return this.advance();
      case 'answer':
        return this.answer(action.response, action.ms);
      case 'retreat':
        return this.retreat();
      case 'piece':
        return this.piece(action);
      case 'receive':
        return this.receive(action.creature, action.variant);
      case 'sentence':
        return this.sentence(action);
      case 'review':
        return this.startReview(action.creature);
    }
  }

  private open(): void {
    if (this.save.tide?.day === this.ctx.day) return;
    this.save.tide = { day: this.ctx.day, branch: tideBranch(this.content, this.save, this.ctx), done: false };
  }

  private begin(branch: BranchId): void {
    if (this.save.activity) return;
    const skills = unlockedSkills(this.content, this.save, branch);
    const untaught = skills.find((s) => !skillProgress(this.save, s.id).taught);
    if (untaught) {
      this.save.activity = { kind: 'teach', skill: untaught.id, step: 0, tries: 0 };
      return;
    }
    const skill = this.pickSkill(skills);
    const encounter = skill && this.pickEncounter([skill]);
    if (!encounter) {
      this.events.push({ type: 'empty', branch });
      return;
    }
    this.save.activity = { kind: 'encounter', id: encounter.id, tries: 0 };
  }

  private startKeeper(branch: BranchId): void {
    if (this.save.activity || !keeperOpen(this.content, this.save, branch)) return;
    const encounter = this.pickEncounter(this.nearSide(branch));
    if (!encounter) {
      this.events.push({ type: 'empty', branch });
      return;
    }
    this.save.activity = {
      kind: 'keeper',
      branch,
      id: encounter.id,
      tries: 0,
      hp: KEEPER_HP,
      foe: KEEPER_HP,
      turn: 1,
    };
  }

  private startReview(creature: string): void {
    if (this.save.activity || !befriended(this.content, this.save).some((c) => c.creature === creature)) return;
    const ids = reviewFor(this.content, this.save, this.ctx.day, this.ctx.rand);
    if (ids.length === 0) return;
    this.save.activity = { kind: 'review', ids, at: 0, tries: 0, rounds: [], phase: reviewPhase(this.content, this.save, ids[0]!), fighter: creature };
  }

  /** A Write your own sentence: kept on the iPad, never marked, worth a little XP. */
  private sentence(a: Extract<Action, { type: 'sentence' }>): void {
    const text = a.text.trim();
    const p = skillProgress(this.save, a.skill);
    const write = this.content.skill(a.skill).write;
    if (!write || !p.taught || !text) return;
    const marks = cleanMarks(a.marks, write.checks.length, text);
    this.save.sentences.push({ skill: a.skill, text, ticks: marks.map((m) => m.length > 0), marks, day: this.ctx.day });
    this.save.skills[a.skill] = { ...p, xp: p.xp + XP_PER_SENTENCE };
    this.events.push({ type: 'wrote', skill: a.skill });
  }

  private nearSide(branch: BranchId): Skill[] {
    return this.content.skillsOf(branch).slice(0, this.content.branch(branch).keeperAfter);
  }

  /** Past the I do into the We do, or past a rusty Skill's refresher into its review item. */
  private advance(): void {
    const a = this.save.activity;
    if (a?.kind === 'teach' && a.step === 0) this.save.activity = { ...a, step: 1, tries: 0 };
    if (a?.kind === 'review' && a.phase === 'refresher') this.save.activity = { ...a, phase: 'task' };
  }

  /** A finished Piece: kept on the iPad, never judged. Finishing one befriends and evolves that prompt's Creature. */
  private piece(a: Extract<Action, { type: 'piece' }>): void {
    const skill = this.content.skill(a.skill);
    if (!skill.workshop || !isUnlocked(this.content, this.save, skill.id) || !a.text.trim()) return;
    const before = this.openState(skill.branch);
    const p = skillProgress(this.save, skill.id);
    const marks = cleanMarks(a.marks, skill.workshop.checklist.length, a.text);
    this.save.pieces.push({
      id: `${skill.id}-${this.save.pieces.length + 1}`,
      skill: skill.id,
      title: a.title.trim() || skill.name,
      text: a.text,
      ticks: marks.map((m) => m.length > 0),
      marks,
      day: this.ctx.day,
    });
    if (p.done === 0) {
      addVariant(this.save, skill.creature.id, 'plain');
      this.events.push({ type: 'befriended', skill: skill.id, creature: skill.creature.id, shiny: false });
    }
    const firstFinish = !p.mastered;
    this.save.skills[skill.id] = { ...p, taught: true, done: p.done + 1, xp: p.xp + 30, mastered: true };
    if (firstFinish) this.events.push({ type: 'evolved', skill: skill.id, creature: skill.creature.id });
    if (this.save.lastPlayed !== this.ctx.day) {
      this.save.daysPlayed += 1;
      this.save.lastPlayed = this.ctx.day;
    }
    this.save.branches[skill.branch].lastDay = this.ctx.day;
    const all = this.content.skillsOf(skill.branch).every((sk) => skillProgress(this.save, sk.id).mastered);
    if (all && !this.save.branches[skill.branch].keeper) {
      this.save.branches[skill.branch].keeper = true;
      this.events.push({ type: 'badge', branch: skill.branch });
    }
    this.announceUnlocks(skill.branch, before);
  }

  /** A Swap gives a copy of one variant: the giver keeps theirs. A variant already owned adds nothing new. */
  private receive(creature: string, variant: Variant): void {
    const skill = skillOfCreature(this.content, creature);
    if (!skill) return;
    const already = variantsOf(this.save, skill).includes(variant);
    if (!already) addVariant(this.save, creature, variant);
    this.events.push({ type: 'received', creature, variant, already });
  }

  /** A rarer variant, said once when it is new. */
  private earn(skill: SkillId, creature: string, variant: Exclude<Variant, 'plain'>): void {
    if (addVariant(this.save, creature, variant)) this.events.push({ type: 'variant', skill, creature, variant });
  }

  /** One more result on a Skill's Encounters, for its first-try streak. Five in a row earns its golden Creature. */
  private streak(skill: SkillId, p: SkillProgress, outcome: Outcome): SkillProgress {
    const streak = streakAfter(p.streak, outcome);
    if (streak >= GOLDEN_STREAK) this.earn(skill, this.content.skill(skill).creature.id, 'golden');
    return { ...p, streak };
  }

  /** Leaving a Keeper battle or a Daily review early. A review left early gives no credit and can be started again. */
  private retreat(): void {
    const a = this.save.activity;
    if (a?.kind === 'review') {
      delete this.save.activity;
      return;
    }
    if (a?.kind !== 'keeper') return;
    delete this.save.activity;
    this.events.push({ type: 'retreated', branch: a.branch });
  }

  private answer(response: Response, ms: number | undefined): void {
    const a = this.save.activity;
    if (!a || (a.kind === 'teach' && a.step === 0) || (a.kind === 'review' && a.phase === 'refresher')) return;
    const task = currentTask(this.content, a);
    if (tooFast(task, a, ms)) {
      this.events.push({ type: 'tooFast' });
      return;
    }
    const verdict = check(checkedBody(task), response);
    if (verdict.kind === 'continue') {
      this.events.push({ type: 'continue' });
      return;
    }
    if (verdict.kind === 'wrong' && a.tries === 0) {
      a.tries = 1;
      this.events.push({ type: 'secondLook', reason: verdict.reason });
      return;
    }
    const outcome: Outcome = verdict.kind === 'wrong' ? 'shown' : a.tries === 0 ? 'first' : 'second';
    this.events.push({
      type: 'resolved',
      outcome,
      success: task.success,
      ...(verdict.kind === 'wrong' ? { reason: verdict.reason } : {}),
    });
    if (a.kind === 'teach') return a.step === 0 ? undefined : this.teachDone(a.skill, a.step);
    if (a.kind === 'review') return this.reviewTurn(a, outcome);
    const encounter = this.content.encounter(a.id);
    this.record(encounter, outcome);
    if (a.kind === 'keeper') return this.keeperTurn(a, outcome);
    delete this.save.activity;
  }

  private teachDone(skill: SkillId, stepDone: 1 | 2): void {
    if (stepDone === 1) {
      this.save.activity = { kind: 'teach', skill, step: 2, tries: 0 };
      return;
    }
    delete this.save.activity;
    this.save.skills[skill] = { ...skillProgress(this.save, skill), taught: true };
    this.events.push({ type: 'taught', skill });
  }

  private keeperTurn(a: Extract<Activity, { kind: 'keeper' }>, outcome: Outcome): void {
    const toFoe = outcome === 'first' ? HIT.first : outcome === 'second' ? HIT.second : 0;
    const toYou = outcome === 'second' ? HIT.chip : outcome === 'shown' ? HIT.miss : 0;
    if (toFoe) this.events.push({ type: 'hit', target: 'foe', amount: toFoe });
    if (toYou) this.events.push({ type: 'hit', target: 'you', amount: toYou });
    const foe = a.foe - toFoe;
    const hp = a.hp - toYou;
    if (foe <= 0) {
      delete this.save.activity;
      const progress = this.save.branches[a.branch];
      if (!progress.keeper) {
        const before = this.openState(a.branch);
        progress.keeper = true;
        this.events.push({ type: 'badge', branch: a.branch });
        this.announceUnlocks(a.branch, before);
      }
      return;
    }
    if (hp <= 0) {
      delete this.save.activity;
      this.events.push({ type: 'retreated', branch: a.branch });
      return;
    }
    const next = this.pickEncounter(this.nearSide(a.branch));
    if (!next) {
      delete this.save.activity;
      this.events.push({ type: 'empty', branch: a.branch });
      return;
    }
    this.save.activity = { ...a, id: next.id, tries: 0, hp, foe, turn: a.turn + 1 };
  }

  /**
   * One round of a Goldie battle, which is one Daily review answer. It gives XP and notes the attempt so this Skill
   * waits longest for its next review, but never moves the Band, placement or mastery, and never counts as play on that
   * Island. A miss counts towards rusty: two in a row and the Skill comes back first, after its trap step, until it is
   * right first try again. It counts towards the Skill's first-try streak like any of its Encounters.
   */
  private reviewTurn(a: Extract<Activity, { kind: 'review' }>, outcome: Outcome): void {
    const { content, save, ctx } = this;
    const encounter = content.encounter(encounterOf(a));
    const p = this.streak(encounter.skill, skillProgress(save, encounter.skill), outcome);
    const misses = outcome === 'first' ? 0 : p.reviewMisses + 1;
    save.skills[encounter.skill] = {
      ...p,
      xp: p.xp + xpFor(outcome),
      recent: [...p.recent, { outcome, band: encounter.band, day: ctx.day }].slice(-RECENT_ATTEMPTS),
      reviewMisses: misses,
      rusty: misses === 0 ? false : p.rusty || misses >= RUSTY_AFTER,
    };
    const key = poolKey(encounter.skill, encounter.band);
    save.seen[key] = [...(save.seen[key] ?? []), encounter.id];
    if (save.lastPlayed !== ctx.day) {
      save.daysPlayed += 1;
      save.lastPlayed = ctx.day;
    }
    if (outcome === 'shown') this.events.push({ type: 'hit', target: 'you', amount: GOLDIE_HIT.back });
    else this.events.push({ type: 'hit', target: 'foe', amount: outcome === 'first' ? GOLDIE_HIT.first : GOLDIE_HIT.second });
    const rounds = [...a.rounds, outcome];
    const next = a.ids[a.at + 1];
    if (next) {
      save.activity = { ...a, at: a.at + 1, tries: 0, rounds, phase: reviewPhase(content, save, next) };
      return;
    }
    delete save.activity;
    save.reviewDay = ctx.day;
    this.battleDone(a.fighter, rounds);
  }

  /** A win counts for the fighter, if it is still one of the Student's Creatures. The third makes it a Champion. */
  private battleDone(fighter: string, rounds: Outcome[]): void {
    const won = battleWon(rounds);
    const skill = skillOfCreature(this.content, fighter);
    const counts = !!skill && variantsOf(this.save, skill).length > 0;
    const wins = (this.save.wins[fighter] ?? 0) + (won && counts ? 1 : 0);
    if (counts) this.save.wins[fighter] = wins;
    const first = rounds.filter((o) => o === 'first').length;
    const right = rounds.filter((o) => o !== 'shown').length;
    this.events.push({ type: 'battleDone', won, creature: fighter, wins, first, right, of: rounds.length });
    if (skill && counts && wins >= CHAMPION_WINS) this.earn(skill.id, fighter, 'champion');
  }

  private record(encounter: Encounter, outcome: Outcome): void {
    const { content, save, ctx } = this;
    const skill = content.skill(encounter.skill);
    const branch = save.branches[skill.branch];
    const before = this.openState(skill.branch);
    const p = skillProgress(save, skill.id);
    const tide = save.tide?.day === ctx.day && save.tide.branch === skill.branch;
    const creature = skill.creature.id;

    // A shiny is only ever found on a first-try result, and only until the Student has one.
    const hadShiny = (save.variants[creature] ?? []).includes('shiny');
    const shiny = outcome === 'first' && !hadShiny && ctx.rand() < 1 / (tide ? TIDE_SHINY_ODDS : SHINY_ODDS);
    if (p.done === 0) {
      addVariant(save, creature, 'plain');
      if (shiny) addVariant(save, creature, 'shiny');
      this.events.push({ type: 'befriended', skill: skill.id, creature, shiny });
    } else if (shiny) this.earn(skill.id, creature, 'shiny');

    const updated = {
      ...this.streak(skill.id, p, outcome),
      done: p.done + 1,
      xp: p.xp + xpFor(outcome) * (tide ? 2 : 1),
      recent: [...p.recent, { outcome, band: encounter.band, day: ctx.day }].slice(-RECENT_ATTEMPTS),
    };
    recordForBand(branch, outcome);
    if (!updated.mastered && masteredAt(updated, encounter.band)) {
      updated.mastered = true;
      updated.masteredBand = encounter.band;
      this.events.push({ type: 'evolved', skill: skill.id, creature: skill.creature.id });
    }
    save.skills[skill.id] = updated;

    const key = poolKey(skill.id, encounter.band);
    save.seen[key] = [...(save.seen[key] ?? []), encounter.id];
    branch.lastDay = ctx.day;
    if (save.lastPlayed !== ctx.day) {
      save.daysPlayed += 1;
      save.lastPlayed = ctx.day;
    }
    if (tide && save.tide && !save.tide.done) {
      save.tide.done = true;
      this.events.push({ type: 'tide', branch: skill.branch });
    }
    this.announceUnlocks(skill.branch, before);
  }

  private openState(branch: BranchId): Set<string> {
    const open = new Set<string>(unlockedSkills(this.content, this.save, branch).map((s) => s.id));
    if (keeperOpen(this.content, this.save, branch)) open.add('keeper');
    return open;
  }

  private announceUnlocks(branch: BranchId, before: Set<string>): void {
    for (const s of this.content.skillsOf(branch)) {
      if (!before.has(s.id) && isUnlocked(this.content, this.save, s.id)) {
        this.events.push({ type: 'unlocked', skill: s.id });
      }
    }
    if (!before.has('keeper') && keeperOpen(this.content, this.save, branch) && !this.save.branches[branch].keeper) {
      this.events.push({ type: 'keeperOpen', branch });
    }
  }

  private pickSkill(skills: Skill[]): Skill | undefined {
    const newest = skills.at(-1);
    return weighted(skills, this.ctx.rand, (s) => {
      if (skillProgress(this.save, s.id).mastered) return 1;
      return s === newest ? 3 : 2;
    });
  }

  private pickEncounter(skills: Skill[]): Encounter | undefined {
    const skill = weighted(skills, this.ctx.rand, () => 1);
    if (!skill) return undefined;
    const band = this.save.branches[skill.branch].band;
    const pool = poolNear(this.content, skill.id, band);
    if (pool.length === 0) return undefined;
    const key = poolKey(skill.id, pool[0]!.band);
    const seen = new Set(this.save.seen[key] ?? []);
    let fresh = pool.filter((e) => !seen.has(e.id));
    if (fresh.length === 0) {
      this.save.seen[key] = [];
      fresh = pool;
    }
    return weighted(fresh, this.ctx.rand, interestWeight(this.save.interests));
  }
}
