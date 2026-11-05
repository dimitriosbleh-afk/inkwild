import type { Band, BranchId, Content } from '../content/types';
import { route, routePosition } from '../core/route';
import type { Save } from '../core/save';

/** When a Chapter opens: at the start, on first playing an Island, on beating its Keeper, or on finishing its route (the Heist). */
export type Unlock =
  | { kind: 'start' }
  | { kind: 'arrive' | 'badge' | 'heist'; branch: BranchId }
  | { kind: 'badges'; count: number }
  | { kind: 'finale' };

export interface Chapter {
  id: string;
  order: number;
  title: string;
  unlock: Unlock;
  /** The same Chapter at each reading Band, so every Student reads the same plot at their own level. */
  bands: Record<Band, string>;
}

function opened(content: Content, save: Save, u: Unlock): boolean {
  switch (u.kind) {
    case 'start':
      return true;
    case 'arrive':
      return save.branches[u.branch].lastDay !== undefined;
    case 'badge':
      return save.branches[u.branch].keeper;
    case 'heist':
      return content.skillsOf(u.branch).length > 0 && routePosition(content, save, u.branch) >= route(content, u.branch).length;
    case 'badges':
      return content.branches.filter((b) => save.branches[b.id].keeper).length >= u.count;
    case 'finale':
      return content.branches.filter((b) => b.marked).every((b) => save.branches[b.id].keeper);
  }
}

export function unlockedChapters(content: Content, save: Save, chapters: Chapter[]): Chapter[] {
  return chapters.filter((c) => opened(content, save, c.unlock)).sort((a, b) => a.order - b.order);
}

/** Chapters are read at the Student's reading Band: their Band on Reading between the lines. */
export function readingBand(save: Save): Band {
  return save.branches.between.band;
}

export function unreadChapters(content: Content, save: Save, chapters: Chapter[]): Chapter[] {
  const read = new Set(save.chaptersRead);
  return unlockedChapters(content, save, chapters).filter((c) => !read.has(c.id));
}
