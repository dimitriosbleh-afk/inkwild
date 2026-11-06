import { chapters, content } from '../app/content';
import { unreadChapters } from '../story/chapters';
import { Store } from '../app/store';
import { creatureCanvas } from '../art/creatures';
import { iconCanvas, VARIANT_ICON } from '../art/icons';
import type { BranchId, SkillId } from '../content/types';
import { befriended, CHAMPION_WINS, GOLDEN_STREAK, moveName } from '../core/creatures';
import type { GameEvent } from '../core/game';
import type { Variant } from '../core/save';
import { h } from './dom';
import './collect.css';
import { burst } from './fx';
import { blip } from './sound';
import { hush, setReadAloud } from './speech';

export type Screen =
  | { name: 'firstRun' }
  | { name: 'restore' }
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'island'; branch: BranchId }
  | { name: 'activity'; branch: BranchId; wrote?: boolean }
  | { name: 'sentence'; skill: SkillId }
  | { name: 'guide' }
  | { name: 'battle' }
  | { name: 'settings' }
  | { name: 'backup' }
  | { name: 'progress' }
  | { name: 'story'; chapter?: string }
  | { name: 'write'; skill: SkillId }
  | { name: 'pieces' }
  | { name: 'swap' };

/** Sparkles for a golden or Champion reveal. */
const GOLD = ['#f7c948', '#fff2b8', '#e8b93a', '#ffffff'];

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
    hush();
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
    setReadAloud(s.readAloud);
  }

  sfx(kind: Parameters<typeof blip>[0]): void {
    if (this.store.save.settings.sound) blip(kind);
  }

  /** Chapters already announced on this iPad, so a NEW CHAPTER! pop-up shows once, not every launch. */
  private announced = new Set<string>(JSON.parse(localStorage.getItem('inkwild.announced') ?? '[]') as string[]);

  private queueMoments(events: GameEvent[]): void {
    for (const e of events) {
      const m = this.moment(e);
      if (m) this.moments.push(m);
    }
    for (const c of unreadChapters(content, this.store.save, chapters)) {
      if (this.announced.has(c.id)) continue;
      this.announced.add(c.id);
      localStorage.setItem('inkwild.announced', JSON.stringify([...this.announced]));
      const card = h('div', { 'data-chapter': c.id }, h('h2', {}, 'NEW CHAPTER!'), iconCanvas('book', 6), h('p', { class: 'note' }, `"${c.title}" is waiting in your Logbook.`));
      this.moments.push(card);
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
    const chapter = next.dataset.chapter;
    const close = h('button', { class: chapter ? 'ghost' : 'big', onclick: () => (overlay.remove(), this.nextMoment()) }, chapter ? 'LATER' : 'NICE!');
    // A new chapter is the reason to keep playing, so reading it is the main button, not a detour through the Logbook.
    const read = chapter ? h('button', { class: 'big', onclick: () => (overlay.remove(), (this.showing = false), this.go({ name: 'story', chapter })) }, 'READ IT NOW') : null;
    const overlay = h('div', { class: 'overlay' }, h('div', { class: 'panel pop' }, next, h('div', { class: 'actions', style: 'justify-content:center' }, close, read)));
    document.body.append(overlay);
    const art = overlay.querySelector('canvas');
    // A reveal bursts first and names the Creature after; a golden or Champion one bursts again, in gold.
    const big = next.dataset.reveal === 'big';
    if (art) for (const ms of big ? [120, 520, 920] : [120]) setTimeout(() => burst(art, big ? GOLD : undefined), ms);
    this.sfx('fanfare');
  }

  private skillCreature(skill: SkillId) {
    return content.skill(skill).creature;
  }

  /** A catch moment: the Creature in a sparkle burst, then what it is. Golden and Champion are bigger. */
  private reveal(skill: SkillId, variant: Variant, title: string, line: string): HTMLElement {
    const c = this.skillCreature(skill);
    const mine = befriended(content, this.store.save).find((b) => b.creature === c.id);
    const big = variant === 'golden' || variant === 'champion';
    const name = mine?.name ?? c.name;
    return h(
      'div',
      { class: `reveal${big ? ' reveal-big' : ''}`, 'data-reveal': big ? 'big' : 'small' },
      h('div', { class: 'reveal-stage' }, h('div', { class: 'reveal-rays' }), creatureCanvas(c.id, { scale: big ? 11 : 9, evolved: !!mine?.evolved, variant })),
      h('h2', { class: 'reveal-title' }, variant === 'plain' ? null : iconCanvas(VARIANT_ICON[variant], 3), title),
      h('div', { class: 'reveal-name' }, name.toUpperCase()),
      h('p', { class: 'note' }, line),
    );
  }

  private moment(e: GameEvent): HTMLElement | null {
    switch (e.type) {
      case 'befriended': {
        const c = this.skillCreature(e.skill);
        return e.shiny
          ? this.reveal(e.skill, 'shiny', 'SHINY!', `A rare shiny ${c.name}, caught on a right-first-try answer! ${c.blurb}`)
          : this.reveal(e.skill, 'plain', 'NEW CREATURE!', `${c.name} joined your crew! ${c.blurb}`);
      }
      case 'variant': {
        const c = this.skillCreature(e.skill);
        const move = moveName(content.skill(e.skill));
        if (e.variant === 'shiny') return this.reveal(e.skill, 'shiny', 'SHINY!', `You got ${move} right first try, and a rare shiny ${c.name} came out to see!`);
        if (e.variant === 'golden') return this.reveal(e.skill, 'golden', 'GOLDEN!', `${GOLDEN_STREAK} right first try in a row on ${move}! ${c.name} turned to gold.`);
        return this.reveal(e.skill, 'champion', 'CHAMPION!', `${CHAMPION_WINS} Goldie battles won! ${c.name} is a Champion now.`);
      }
      case 'evolved': {
        const c = this.skillCreature(e.skill);
        const look = befriended(content, this.store.save).find((b) => b.creature === c.id)?.look ?? 'plain';
        return h(
          'div',
          {},
          h('h2', {}, `${c.name.toUpperCase()} EVOLVED!`),
          creatureCanvas(c.id, { scale: 9, evolved: true, variant: look }),
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
        return h('div', {}, h('h2', {}, 'BADGE WON!'), iconCanvas('star', 7), h('p', { class: 'note' }, `You beat ${b.keeper.name}. The far side of ${b.island} is open.`));
      }
      case 'tide':
        return h('div', {}, h('h2', {}, 'TIDE QUEST DONE'), h('p', { class: 'note' }, 'Double XP today on this island, and a better chance of finding a shiny.'));
      default:
        return null;
    }
  }
}
