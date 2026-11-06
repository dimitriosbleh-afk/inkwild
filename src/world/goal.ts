import crewData from '../../content/crew.json';
import type { Branch, BranchId, Content, CrewId, Skill } from '../content/types';
import { encounterOf } from '../core/game';
import { reviewDue } from '../core/review';
import { keeperOpen, unlockedSkills } from '../core/route';
import { skillProgress, type Activity, type Day, type Save } from '../core/save';
import type { PoiKind } from './scene';

export type Place = BranchId | 'home';
export type Goal = { kind: PoiKind; line: string; label: string };

/** What is waiting on one Island right now. The ! markers and the goal both read from this, so they always agree. */
export interface PlaceState {
  home: boolean;
  open: boolean;
  teachDue: boolean;
  midway: Activity['kind'] | null;
  keeperReady: boolean;
  tide: BranchId | null;
  done: boolean;
  /** Home only: a Daily review is waiting, or one is under way. */
  review: boolean;
}

const crewNames = crewData as Record<CrewId, { name: string }>;

export function activityBranch(content: Content, a: Activity): BranchId {
  if (a.kind === 'keeper') return a.branch;
  const skill = a.kind === 'teach' ? a.skill : content.encounter(encounterOf(a)).skill;
  return content.skill(skill).branch;
}

export const charted = (content: Content, branch: BranchId): boolean => content.skillsOf(branch).length > 0;

/** Every Skill mastered, and the Keeper beaten where there is one. */
export function finished(content: Content, save: Save, branch: BranchId): boolean {
  const all = content.skillsOf(branch).every((sk) => skillProgress(save, sk.id).mastered);
  return all && (!content.branch(branch).marked || save.branches[branch].keeper);
}

/** Share of an Island's Skills mastered. The workshop counts Skills with at least one Piece written. */
export function islandProgress(content: Content, save: Save, branch: BranchId): number {
  const skills = content.skillsOf(branch);
  if (!skills.length) return 0;
  const counts = content.branch(branch).marked
    ? (sk: Skill) => skillProgress(save, sk.id).mastered
    : (sk: Skill) => save.pieces.some((p) => p.skill === sk.id);
  return skills.filter(counts).length / skills.length;
}

/** A Daily review can start, or has started, from Home Island. Another activity left midway comes first. */
export function reviewReady(content: Content, save: Save, today: Day): boolean {
  if (save.activity) return save.activity.kind === 'review';
  return reviewDue(content, save, today);
}

/** A student who hasn't learnt a single move yet is sent to their first island, not to whichever island today's tide picked. */
const started = (save: Save) => Object.values(save.skills).some((p) => p?.taught);

function tideOpen(content: Content, save: Save, today: Day): BranchId | null {
  const t = save.tide;
  return started(save) && t && !t.done && t.day === today && charted(content, t.branch) ? t.branch : null;
}

export function placeState(content: Content, save: Save, place: Place, today: Day): PlaceState {
  const tide = tideOpen(content, save, today);
  if (place === 'home') return { home: true, open: false, teachDue: false, midway: null, keeperReady: false, tide, done: false, review: reviewReady(content, save, today) };
  const open = charted(content, place);
  const a = save.activity?.kind === 'review' ? undefined : save.activity;
  return {
    home: false,
    open,
    teachDue: open && unlockedSkills(content, save, place).some((sk) => !skillProgress(save, sk.id).taught),
    midway: a && activityBranch(content, a) === place ? a.kind : null,
    keeperReady: open && keeperOpen(content, save, place) && !save.branches[place].keeper,
    tide,
    done: open && finished(content, save, place),
    review: false,
  };
}

/** Which kinds of POI show a !. The goal's own POI always does. */
export function alertsFor(content: Content, save: Save, place: Place, today: Day): Record<PoiKind, boolean> {
  const st = placeState(content, save, place, today);
  const goal = goalFor(content, save, place, today);
  const alerts: Record<PoiKind, boolean> = {
    crew: st.teachDue || st.midway === 'teach',
    grass: st.home ? !!st.tide || st.review : st.open && (!st.teachDue || (st.midway !== null && st.midway !== 'teach')),
    keeper: st.keeperReady,
    boat: false,
    sign: false,
    hut: false,
    board: false,
  };
  alerts[goal.kind] = true;
  return alerts;
}

/** The Island to sail to next: today's Tide quest, else the last Island played if unfinished, else the first unfinished one. */
export function nextIsland(content: Content, save: Save, today: Day, except?: BranchId): Branch | undefined {
  const unfinished = (id: BranchId | null | undefined): id is BranchId => !!id && id !== except && charted(content, id) && !finished(content, save, id);
  const candidates = [tideOpen(content, save, today), lastPlayed(content, save), ...content.branches.map((b) => b.id)];
  const id = candidates.find(unfinished);
  return id ? content.branch(id) : undefined;
}

function lastPlayed(content: Content, save: Save): BranchId | undefined {
  if (save.activity && save.activity.kind !== 'review') return activityBranch(content, save.activity);
  let best: BranchId | undefined, bestDay = -Infinity;
  for (const b of content.branches) {
    const day = save.branches[b.id].lastDay ?? -Infinity;
    if (day > bestDay) [best, bestDay] = [b.id, day];
  }
  return best;
}

const LABELS: Record<PoiKind, string> = { grass: 'LONG GRASS', crew: 'CREW', keeper: 'KEEPER', boat: 'DOCK', sign: 'SIGN', hut: 'HUT', board: 'BOARD' };

interface Ctx {
  content: Content;
  save: Save;
  today: Day;
  st: PlaceState;
  branch: Branch | undefined;
}

type Rule = { when: (c: Ctx) => boolean; kind: PoiKind; line: (c: Ctx) => string; label?: string };

const crewName = (c: Ctx) => {
  const first = c.branch && c.content.skillsOf(c.branch.id)[0];
  return crewNames[first?.teach.crew ?? 'nav'].name;
};
const keeperName = (c: Ctx) => c.branch?.keeper.name ?? 'the Keeper';
const sailTo = (c: Ctx) => {
  const next = nextIsland(c.content, c.save, c.today, c.branch?.id);
  return next ? `sail to ${next.island}` : 'sail home';
};
const writing = (c: Ctx) => !!c.branch && !c.branch.marked;

/** First match wins, so order is priority. */
const ISLAND_RULES: Rule[] = [
  { when: (c) => c.st.midway === 'teach', kind: 'crew', line: (c) => `Finish learning your new move with ${crewName(c)}!` },
  { when: (c) => c.st.midway === 'keeper', kind: 'keeper', line: (c) => `Your battle with ${keeperName(c)} isn't over. Go back and finish it!` },
  { when: (c) => c.st.midway === 'encounter', kind: 'grass', line: () => 'A creature is still waiting in the long grass. Go back and find it!' },
  { when: (c) => !c.st.open, kind: 'boat', line: (c) => `The crew is still mapping this island. Walk to the dock and ${sailTo(c)}.` },
  { when: (c) => c.st.teachDue, kind: 'crew', line: (c) => (writing(c) ? `Talk to ${crewName(c)}. There's a new way to write to learn!` : `Talk to ${crewName(c)}. There's a new move to learn!`) },
  { when: (c) => c.st.keeperReady, kind: 'keeper', line: (c) => `You're ready! Battle ${keeperName(c)}!` },
  { when: (c) => c.st.done, kind: 'boat', line: (c) => `Island done! Walk to the dock and ${sailTo(c)}.` },
  { when: writing, kind: 'grass', line: () => 'Your writing spot is in the long grass. Go and write your next story!' },
  { when: () => true, kind: 'grass', line: () => 'A wild creature is hiding in the long grass. Go and find it!' },
];

const HOME_RULES: Rule[] = [
  { when: (c) => !started(c.save) && !!nextIsland(c.content, c.save, c.today), kind: 'boat', line: (c) => `Your first rescue starts on ${nextIsland(c.content, c.save, c.today)!.island}. Walk to the dock and set sail!` },
  { when: (c) => !!c.st.tide, kind: 'board', line: (c) => `Today's tide quest is on ${c.content.branch(c.st.tide!).island}. Check the notice board!` },
  { when: (c) => c.st.review, kind: 'grass', line: () => "Daily review: three quick moves from islands you've done.", label: 'REVIEW' },
  { when: (c) => !!nextIsland(c.content, c.save, c.today), kind: 'boat', line: (c) => `Walk to the dock and ${sailTo(c)}!` },
  { when: () => true, kind: 'boat', line: () => 'Every island is done! Walk to the dock and sail anywhere for a rematch.' },
];

export function goalFor(content: Content, save: Save, place: Place, today: Day): Goal {
  const c: Ctx = { content, save, today, st: placeState(content, save, place, today), branch: place === 'home' ? undefined : content.branch(place) };
  const rule = (place === 'home' ? HOME_RULES : ISLAND_RULES).find((r) => r.when(c))!;
  return { kind: rule.kind, line: rule.line(c), label: rule.label ?? (rule.kind === 'crew' ? crewName(c).toUpperCase() : LABELS[rule.kind]) };
}
