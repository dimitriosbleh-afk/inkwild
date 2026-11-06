import type { Band, Content, Encounter, Interest, SkillId } from '../content/types';
import { BANDS } from '../content/types';

export function poolKey(skill: SkillId, band: Band): string {
  return `${skill}|${band}`;
}

/** The Skill's Encounters at the Band nearest the one asked for, preferring the easier Band on a tie. */
export function poolNear(content: Content, skill: SkillId, band: Band): Encounter[] {
  const byDistance = [...BANDS].sort((x, y) => Math.abs(x - band) - Math.abs(y - band) || x - y);
  for (const b of byDistance) {
    const pool = content.pool(skill, b);
    if (pool.length > 0) return pool;
  }
  return [];
}

/** The Encounters in a pool not yet seen, or the whole pool once every one has been. */
export function unseen(pool: Encounter[], seen: readonly string[] | undefined): Encounter[] {
  const had = new Set(seen ?? []);
  const fresh = pool.filter((e) => !had.has(e.id));
  return fresh.length ? fresh : pool;
}

/** Encounters on a topic the Student picked come up three times as often. */
export const interestWeight = (interests: readonly Interest[]) => {
  const liked = new Set<string>(interests);
  return (e: Encounter) => (liked.has(e.topic) ? 3 : 1);
};

export function weighted<T>(items: T[], rand: () => number, weight: (item: T) => number): T | undefined {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let r = rand() * total;
  for (const item of items) {
    r -= weight(item);
    if (r < 0) return item;
  }
  return items.at(-1);
}
