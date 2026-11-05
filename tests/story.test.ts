import { describe, expect, it } from 'vitest';
import { unlockedChapters, unreadChapters, type Chapter } from '../src/story/chapters';
import { content, Player } from './fixture';

const text = { 1: 'a', 2: 'b', 3: 'c', 4: 'd' } as const;
const chapters: Chapter[] = [
  { id: 'prologue', order: 0, title: 'Prologue', unlock: { kind: 'start' }, bands: text },
  { id: 'reef-1', order: 1, title: 'Reef arrival', unlock: { kind: 'arrive', branch: 'sentence' }, bands: text },
  { id: 'reef-2', order: 2, title: 'Reef badge', unlock: { kind: 'badge', branch: 'sentence' }, bands: text },
];

describe('Chapters', () => {
  it('opens the prologue at the start and an Island chapter once the Student plays there', () => {
    const p = new Player();
    expect(unlockedChapters(content, p.save, chapters).map((c) => c.id)).toEqual(['prologue']);
    p.learn('sentence');
    p.encounter('sentence', 'first');
    expect(unlockedChapters(content, p.save, chapters).map((c) => c.id)).toEqual(['prologue', 'reef-1']);
  });

  it('opens the badge chapter only after the Keeper is beaten', () => {
    const p = new Player();
    p.save.branches.sentence.keeper = true;
    expect(unlockedChapters(content, p.save, chapters).map((c) => c.id)).toContain('reef-2');
  });

  it('opens a main-story chapter once enough badges are won, on any Islands', () => {
    const p = new Player();
    const twist: Chapter = { id: 'twist', order: 50, title: 'Twist', unlock: { kind: 'badges', count: 2 }, bands: text };
    p.save.branches.sentence.keeper = true;
    expect(unlockedChapters(content, p.save, [twist])).toEqual([]);
    p.save.branches.between.keeper = true;
    expect(unlockedChapters(content, p.save, [twist]).map((c) => c.id)).toEqual(['twist']);
  });

  it('lists only chapters not yet read', () => {
    const p = new Player();
    p.save.chaptersRead = ['prologue'];
    expect(unreadChapters(content, p.save, chapters)).toEqual([]);
  });
});
