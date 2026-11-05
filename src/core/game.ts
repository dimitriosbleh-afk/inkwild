import type { Band, BranchId, Content, Encounter, Response, Skill, SkillId, Task } from '../content/types';
import { BANDS } from '../content/types';
import { recordForBand } from './bands';
import { check } from './check';
import { isUnlocked, keeperOpen, masteredAt, unlockedSkills } from './route';
import { skillProgress, type Activity, type Day, type Outcome, type Save } from './save';

export interface Ctx {
  day: Day;
  rand: () => number;
}

export type Action =
  | { type: 'open' }
  | { type: 'begin'; branch: BranchId }
  | { type: 'keeper'; branch: BranchId }
  | { type: 'advance' }
  | { type: 'answer'; response: Response }
  | { type: 'retreat' }
  | { type: 'piece'; skill: SkillId; title: string; text: string; ticks: boolean[] }
  | { type: 'receive'; creature: string; shiny: boolean };

export type GameEvent =
  | { type: 'secondLook'; reason: string }
  | { type: 'continue' }
  | { type: 'resolved'; outcome: Outcome; success: string; reason?: string }
  | { type: 'taught'; skill: SkillId }
  | { type: 'befriended'; skill: SkillId; creature: string; shiny: boolean }
  | { type: 'evolved'; skill: SkillId; creature: string }
  | { type: 'unlocked'; skill: SkillId }
  | { type: 'keeperOpen'; branch: BranchId }
  | { type: 'hit'; target: 'foe' | 'you'; amount: number }
  | { type: 'badge'; branch: BranchId }
  | { type: 'retreated'; branch: BranchId }
  | { type: 'tide'; branch: BranchId }
  | { type: 'empty'; branch: BranchId }
  | { type: 'received'; creature: string; shiny: boolean; already: boolean };

export interface Step {
  save: Save;
  events: GameEvent[];
}

const RECENT_ATTEMPTS = 10;
const XP_PER_ENCOUNTER = 10;
const SHINY_ODDS = 64;
const TIDE_SHINY_ODDS = 16;
export const KEEPER_HP = 100;
export const HIT = { first: 25, second: 15, chip: 10, miss: 25 } as const;

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
  return content.encounter(activity.id);
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
        return this.answer(action.response);
      case 'retreat':
        return this.retreat();
      case 'piece':
        return this.piece(action);
      case 'receive':
        return this.receive(action.creature, action.shiny);
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

  private nearSide(branch: BranchId): Skill[] {
    return this.content.skillsOf(branch).slice(0, this.content.branch(branch).keeperAfter);
  }

  private advance(): void {
    const a = this.save.activity;
    if (a?.kind === 'teach' && a.step === 0) this.save.activity = { ...a, step: 1, tries: 0 };
  }

  /** A finished Piece: kept on the iPad, never judged. Finishing one befriends and evolves that prompt's Creature. */
  private piece(a: Extract<Action, { type: 'piece' }>): void {
    const skill = this.content.skill(a.skill);
    if (!skill.workshop || !isUnlocked(this.content, this.save, skill.id) || !a.text.trim()) return;
    const before = this.openState(skill.branch);
    const p = skillProgress(this.save, skill.id);
    this.save.pieces.push({ id: `${skill.id}-${this.save.pieces.length + 1}`, skill: skill.id, title: a.title.trim() || skill.name, text: a.text, ticks: a.ticks, day: this.ctx.day });
    if (p.done === 0) this.events.push({ type: 'befriended', skill: skill.id, creature: skill.creature.id, shiny: false });
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

  /** A Swap gives a copy: the giver keeps theirs. A Creature already owned (or already received) adds nothing new. */
  private receive(creature: string, shiny: boolean): void {
    const skill = this.content.branches.flatMap((b) => this.content.skillsOf(b.id)).find((s) => s.creature.id === creature);
    if (!skill) return;
    const owned = (this.save.skills[skill.id]?.done ?? 0) > 0;
    const had = this.save.received.find((r) => r.creature === creature);
    const already = (owned && (!shiny || this.save.shinies.includes(creature))) || (!!had && (had.shiny || !shiny));
    if (!already) {
      if (owned && shiny) this.save.shinies.push(creature);
      else if (had) had.shiny = true;
      else this.save.received.push({ creature, shiny });
    }
    this.events.push({ type: 'received', creature, shiny, already });
  }

  private retreat(): void {
    const a = this.save.activity;
    if (a?.kind !== 'keeper') return;
    delete this.save.activity;
    this.events.push({ type: 'retreated', branch: a.branch });
  }

  private answer(response: Response): void {
    const a = this.save.activity;
    if (!a || (a.kind === 'teach' && a.step === 0)) return;
    const task = currentTask(this.content, a);
    const verdict = check(task.body, response);
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

  private record(encounter: Encounter, outcome: Outcome): void {
    const { content, save, ctx } = this;
    const skill = content.skill(encounter.skill);
    const branch = save.branches[skill.branch];
    const before = this.openState(skill.branch);
    const p = skillProgress(save, skill.id);
    const tide = save.tide?.day === ctx.day && save.tide.branch === skill.branch;

    if (p.done === 0) {
      const odds = tide ? TIDE_SHINY_ODDS : SHINY_ODDS;
      const shiny = ctx.rand() < 1 / odds;
      if (shiny) save.shinies.push(skill.creature.id);
      this.events.push({ type: 'befriended', skill: skill.id, creature: skill.creature.id, shiny });
    }

    const updated = {
      ...p,
      done: p.done + 1,
      xp: p.xp + XP_PER_ENCOUNTER * (tide ? 2 : 1),
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
    const pool = this.poolNear(skill.id, band);
    if (pool.length === 0) return undefined;
    const key = poolKey(skill.id, pool[0]!.band);
    const seen = new Set(this.save.seen[key] ?? []);
    let fresh = pool.filter((e) => !seen.has(e.id));
    if (fresh.length === 0) {
      this.save.seen[key] = [];
      fresh = pool;
    }
    const interests = new Set<string>(this.save.interests);
    return weighted(fresh, this.ctx.rand, (e) => (interests.has(e.topic) ? 3 : 1));
  }

  private poolNear(skill: SkillId, band: Band): Encounter[] {
    const byDistance = [...BANDS].sort((x, y) => Math.abs(x - band) - Math.abs(y - band) || x - y);
    for (const b of byDistance) {
      const pool = this.content.pool(skill, b);
      if (pool.length > 0) return pool;
    }
    return [];
  }
}

export function poolKey(skill: SkillId, band: Band): string {
  return `${skill}|${band}`;
}

function weighted<T>(items: T[], rand: () => number, weight: (item: T) => number): T | undefined {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let r = rand() * total;
  for (const item of items) {
    r -= weight(item);
    if (r < 0) return item;
  }
  return items.at(-1);
}
