import { chapters, content } from '../app/content';
import { unreadChapters } from '../story/chapters';
import { Store } from '../app/store';
import { creatureCanvas } from '../art/creatures';
import type { BranchId, SkillId } from '../content/types';
import type { GameEvent } from '../core/game';
import { h } from './dom';
import { burst } from './fx';
import { blip } from './sound';

export type Screen =
  | { name: 'firstRun' }
  | { name: 'restore' }
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'island'; branch: BranchId }
  | { name: 'activity'; branch: BranchId }
  | { name: 'guide' }
  | { name: 'settings' }
  | { name: 'backup' }
  | { name: 'progress' }
  | { name: 'story'; chapter?: string }
  | { name: 'write'; skill: SkillId }
  | { name: 'pieces' }
  | { name: 'swap' };

export type ScreenView = { el: HTMLElement; stop?: () => void };
export type ScreenFn = (app: App, screen: never) => ScreenView;

export class App {
  store: Store;
  private current?: ScreenView;
  private moments: HTMLElement[] = [];
  private showing = false;
  lastBranch: BranchId = 'sentence';

  constructor(
    private root: HTMLElement,
    private screens: { [K in Screen['name']]: (app: App, screen: Extract<Screen, { name: K }>) => ScreenView },
  ) {
    this.store = new Store();
    this.applySettings();
    this.store.listen((events) => this.queueMoments(events));
  }

  start(): void {
    for (const c of unreadChapters(content, this.store.save, chapters)) if (c.unlock.kind !== 'start') this.announced.add(c.id);
    if (this.store.isNew) return this.go({ name: 'firstRun' });
    this.store.dispatch({ type: 'open' });
    this.go({ name: 'home' });
  }

  go<S extends Screen>(screen: S): void {
    this.current?.stop?.();
    const fn = this.screens[screen.name] as (app: App, s: S) => ScreenView;
    this.current = fn(this, screen);
    this.current.el.classList.add('screen');
    this.root.replaceChildren(this.current.el);
    if (screen.name === 'island' || screen.name === 'activity') this.lastBranch = screen.branch;
  }

  applySettings(): void {
    const s = this.store.save.settings;
    document.body.classList.remove('size-0', 'size-1', 'size-2');
    document.body.classList.add(`size-${s.textSize}`);
    document.body.classList.toggle('spacing', s.spacing);
    document.body.classList.toggle('cream', s.cream);
  }

  sfx(kind: Parameters<typeof blip>[0]): void {
    if (this.store.save.settings.sound) blip(kind);
  }

  private announced = new Set<string>();

  private queueMoments(events: GameEvent[]): void {
    for (const e of events) {
      const m = this.moment(e);
      if (m) this.moments.push(m);
    }
    for (const c of unreadChapters(content, this.store.save, chapters)) {
      if (this.announced.has(c.id)) continue;
      this.announced.add(c.id);
      this.moments.push(h('div', {}, h('h2', {}, 'NEW CHAPTER!'), h('div', { style: 'font-size:48px;margin:8px' }, '📖'), h('p', { class: 'note' }, `"${c.title}" is waiting in your Logbook.`)));
    }
    if (!this.showing) setTimeout(() => this.nextMoment(), 450);
  }

  private nextMoment(): void {
    const next = this.moments.shift();
    if (!next) {
      this.showing = false;
      return;
    }
    this.showing = true;
    const close = h('button', { class: 'big', onclick: () => (overlay.remove(), this.nextMoment()) }, 'NICE!');
    const overlay = h('div', { class: 'overlay' }, h('div', { class: 'panel pop' }, next, h('div', { class: 'actions', style: 'justify-content:center' }, close)));
    document.body.append(overlay);
    const art = overlay.querySelector('canvas');
    if (art) setTimeout(() => burst(art), 120);
    this.sfx('fanfare');
  }

  private skillCreature(skill: SkillId) {
    return content.skill(skill).creature;
  }

  private moment(e: GameEvent): HTMLElement | null {
    switch (e.type) {
      case 'befriended': {
        const c = this.skillCreature(e.skill);
        return h(
          'div',
          {},
          h('h2', {}, e.shiny ? `A SHINY ${c.name.toUpperCase()}!` : `${c.name.toUpperCase()} JOINED YOUR CREW!`),
          creatureCanvas(c.id, { scale: 9, shiny: e.shiny }),
          h('p', { class: 'note' }, c.blurb),
        );
      }
      case 'evolved': {
        const c = this.skillCreature(e.skill);
        return h(
          'div',
          {},
          h('h2', {}, `${c.name.toUpperCase()} EVOLVED!`),
          creatureCanvas(c.id, { scale: 9, evolved: true, shiny: this.store.save.shinies.includes(c.id) }),
          h('p', { class: 'note' }, `It's now ${c.evolved}. You've got this move down.`),
        );
      }
      case 'unlocked':
        return h('div', {}, h('h2', {}, 'NEW MOVE UNLOCKED'), h('p', { class: 'note' }, content.skill(e.skill).name));
      case 'keeperOpen': {
        const b = content.branch(e.branch);
        return h('div', {}, h('h2', {}, `${b.keeper.name.toUpperCase()} WANTS A BATTLE`), h('p', { class: 'note' }, `You've mastered the first half of ${b.island}. Challenge the Keeper from the island page.`));
      }
      case 'badge': {
        const b = content.branch(e.branch);
        return h('div', {}, h('h2', {}, 'BADGE WON!'), h('div', { style: 'font-size:60px;margin:10px' }, '★'), h('p', { class: 'note' }, `You beat ${b.keeper.name}. The far side of ${b.island} is open.`));
      }
      case 'tide':
        return h('div', {}, h('h2', {}, 'TIDE QUEST DONE'), h('p', { class: 'note' }, 'Double XP today on this island, and a better chance of finding a shiny.'));
      default:
        return null;
    }
  }
}
