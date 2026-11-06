import { content, crew } from '../../app/content';
import { captainCanvas } from '../../art/captain';
import { crewCanvas } from '../../art/crew';
import { creatureCanvas } from '../../art/creatures';
import type { BranchId, Response, SkillId, Task } from '../../content/types';
import { currentTask, encounterOf, KEEPER_HP, type GameEvent } from '../../core/game';
import { TOO_FAST_HOLD_MS } from '../../core/pace';
import type { Activity, Outcome } from '../../core/save';
import { trapStep } from '../../core/review';
import { owedOn, owesSentence } from '../../core/sentence';
import { activityBranch } from '../../world/goal';
import type { App, ScreenView } from '../app';
import { h } from '../dom';
import { SORT_LOOK } from '../../core/check';
import { passage, widget } from '../formats';
import { burst, shake } from '../fx';
import { readable, saidBy } from '../speech';
import { openMoveCard, refresherPlayer, teachPlayer } from '../teach';
import '../task.css';
import { sentenceScreen } from './sentence';
import { nextPrompt, writeScreen } from './write';

/**
 * `wrote` is set when the Student comes straight from a Write your own card, so they play before the next one. A Skill
 * that owes a sentence (see owesSentence) shows its card before play starts.
 */
export function activityScreen(app: App, { branch, wrote }: { branch: BranchId; wrote?: boolean }): ScreenView {
  const store = app.store;
  if (!store.save.activity) {
    const owed = wrote ? undefined : owedOn(content, store.save, branch);
    if (owed) return sentenceScreen(app, { skill: owed.id });
    const events = store.dispatch({ type: 'begin', branch });
    if (!content.branch(branch).marked && !store.save.activity) {
      const skill = nextPrompt(app);
      if (skill) return writeScreen(app, { skill });
    }
    if (events.some((e) => e.type === 'empty') || !store.save.activity) return charting(app, branch);
  }
  const at = store.save.activity!;
  // A refresher whose Skill no longer has a trap step goes straight to the review item.
  if (at.kind === 'review' && at.phase === 'refresher' && !trapStep(content.skill(skillOf(at)))) store.dispatch({ type: 'advance' });
  const a = store.save.activity!;
  const el = h('div', { class: 'centre task-screen' }, header(app, branch, a));

  if (a.kind === 'teach' && a.step === 0) {
    el.append(iDo(app, branch, a));
    return { el };
  }
  if (a.kind === 'review' && a.phase === 'refresher') {
    el.append(refresher(app, a));
    return { el };
  }
  el.append(taskView(app, branch, a));
  return { el };
}

function header(app: App, branch: BranchId, a: Activity): HTMLElement {
  const back = h('button', { class: 'ghost', onclick: () => leave(app, branch) }, a.kind === 'keeper' ? 'RETREAT' : 'ISLAND');
  const teaching = (a.kind === 'teach' && a.step === 0) || (a.kind === 'review' && a.phase === 'refresher');
  const card = teaching ? null : h('button', { class: 'alt', onclick: () => openMoveCard(content.skill(skillOf(a))) }, 'MOVE CARD');
  const title = a.kind === 'review' ? `DAILY REVIEW · ${a.at + 1} OF ${a.ids.length}` : content.branch(branch).island.toUpperCase();
  return h('div', { class: 'row spread task-head' }, h('div', { class: 'row' }, back, card), h('div', { class: 'frame' }, title));
}

function skillOf(a: Activity): SkillId {
  return a.kind === 'teach' ? a.skill : content.encounter(encounterOf(a)).skill;
}

/** A Keeper battle or a Daily review ends when the Student leaves; anything else waits for them. A review goes back Home, where it began. */
function leave(app: App, branch: BranchId): void {
  const kind = app.store.save.activity?.kind;
  if (kind === 'keeper' || kind === 'review') app.store.dispatch({ type: 'retreat' });
  if (kind === 'review') return app.go({ name: 'home' });
  app.go({ name: 'island', branch });
}

function charting(app: App, branch: BranchId): ScreenView {
  return {
    el: h(
      'div',
      { class: 'centre' },
      h('div', { class: 'panel' }, h('h2', {}, 'STILL BEING CHARTED'), h('p', { class: 'note' }, 'The crew is still mapping this island. Try another one for now.'), h('div', { class: 'actions' }, h('button', { onclick: () => app.go({ name: 'map' }) }, 'MAP'))),
    ),
  };
}

function iDo(app: App, branch: BranchId, a: Extract<Activity, { kind: 'teach' }>): HTMLElement {
  return teachPlayer(content.skill(a.skill), () => {
    app.store.dispatch({ type: 'advance' });
    app.go({ name: 'activity', branch });
  });
}

/** A rusty Skill's trap step before its Daily review item. */
function refresher(app: App, a: Extract<Activity, { kind: 'review' }>): HTMLElement {
  const skill = content.skill(skillOf(a));
  return refresherPlayer(skill, trapStep(skill)!, () => {
    app.store.dispatch({ type: 'advance' });
    app.go({ name: 'activity', branch: activityBranch(content, a) });
  });
}

function said(cls: string, text: string): HTMLElement {
  return h('div', { class: `reading ${cls}` }, readable(text));
}

/** A crew or Keeper speech bubble. HEAR reads `line`: everything the bubble says. */
function bubble(name: string, line: (string | undefined)[], lines: (HTMLElement | null)[], cls = ''): HTMLElement {
  return h('div', { class: `speech task-speech ${cls}` }, saidBy(name.toUpperCase(), line.filter(Boolean).join(' ')), ...lines);
}

/** Who is talking to the Student: the crew member who taught the move, or the Keeper in a battle. */
function stage(app: App, a: Exclude<Activity, { kind: 'teach'; step: 0 }> | Extract<Activity, { kind: 'teach' }>, task: Task): { el: HTMLElement; sprite: HTMLCanvasElement | null } {
  const frame = task.frame ? said('say-frame', task.frame) : null;
  const prompt = said('say-prompt', task.prompt);

  if (a.kind === 'keeper') {
    const b = content.branch(a.branch);
    const shout = task.prompt.replace(/\.$/, '!');
    const skill = content.skill(content.encounter(a.id).skill);
    const el = h(
      'div',
      { class: 'stage stage-keeper' },
      arena(app, a),
      h('div', { class: 'frame keeper-call' }, `${b.keeper.name.toUpperCase()} USES ${skill.name.toUpperCase()}! BLOCK IT RIGHT FIRST TIME FOR A FULL HIT.`),
      frame,
      bubble(b.keeper.name, [shout], [said('say-prompt', shout)], 'from-foe'),
    );
    return { el, sprite: null };
  }

  if (a.kind === 'encounter' || a.kind === 'review') {
    const skill = content.skill(content.encounter(encounterOf(a)).skill);
    const p = app.store.save.skills[skill.id];
    const wild = creatureCanvas(skill.creature.id, { scale: 5, evolved: !!p?.mastered, shiny: app.store.save.shinies.includes(skill.creature.id) });
    wild.classList.add('bob');
    const guide = crewCanvas(skill.teach.crew, 5);
    guide.classList.add('stage-guide');
    const el = h(
      'div',
      { class: 'stage stage-wild' },
      guide,
      bubble(crew[skill.teach.crew].name, [task.frame, task.prompt], [frame, prompt]),
      h('div', { class: 'wild-spot' }, wild, h('div', { class: 'wild-pad' })),
    );
    return { el, sprite: wild };
  }

  const crewId = content.skill(a.skill).teach.crew;
  const person = crew[crewId];
  const sprite = crewCanvas(crewId, 6);
  sprite.classList.add('bob');
  const hintText = 'hint' in task && typeof task.hint === 'string' ? `Hint: ${task.hint}` : undefined;
  const hint = hintText ? said('say-hint', hintText) : null;
  const el = h(
    'div',
    { class: 'stage stage-crew' },
    h('div', { class: 'frame' }, `WE DO · ${person.name.toUpperCase()} IS HELPING`),
    h('div', { class: 'stage-row' }, sprite, bubble(person.name, [task.frame, task.prompt, hintText], [frame, prompt, hint])),
  );
  return { el, sprite };
}

function taskView(app: App, branch: BranchId, a: Exclude<Activity, { kind: 'teach'; step: 0 }> | Extract<Activity, { kind: 'teach' }>): HTMLElement {
  const store = app.store;
  const task: Task = currentTask(content, a);
  const panel = h('div', { class: 'panel task' });
  const feedback = h('div', { class: 'task-foot' });
  const on = stage(app, a, task);
  const sprite = on.sprite;
  panel.append(on.el);

  // Too fast is timed from here, when the task appears. No countdown is shown: a timer invites waiting, not reading.
  const shownAt = performance.now();
  const w = widget(task, (response: Response) => {
    const events = store.dispatch({ type: 'answer', response, ms: performance.now() - shownAt });
    react(events);
  });
  const text = w.passage ?? passage(task);
  if (text) panel.append(text);
  panel.append(w.el, feedback);
  // The Creature on stage: wild in an Encounter or review, the Keeper's in a battle.
  const creature = sprite ?? panel.querySelector('.foe-sprite');
  const wild = a.kind === 'encounter' || a.kind === 'review';

  const react = (events: GameEvent[]) => {
    for (const e of events) {
      if (e.type === 'tooFast') {
        app.sfx('look');
        if (creature) shake(creature);
        feedback.replaceChildren(h('div', { class: 'feedback look pop too-fast' }, h('b', {}, 'TOO FAST!'), readable('The Creature hid. Read it, then tap.')));
        hold(w.el, TOO_FAST_HOLD_MS);
      }
      if (e.type === 'continue') {
        w.proceed?.();
        app.sfx('tap');
      }
      if (e.type === 'secondLook') {
        w.wrong();
        app.sfx('look');
        if (sprite) shake(sprite);
        const note = w.lookNote?.();
        feedback.replaceChildren(h('div', { class: 'feedback look pop' }, h('b', {}, 'SECOND LOOK'), readable(e.reason), note ? h('div', { class: 'look-count' }, readable(note)) : null));
      }
      if (e.type === 'hit') hit(panel, e.target, e.amount, app);
      if (e.type === 'resolved') {
        w.reveal(e.outcome);
        if (task.body.format === 'choose' && text) {
          const blank = text.querySelector('.blank');
          if (blank) {
            blank.textContent = task.body.options[task.body.answer]!.text;
            blank.classList.add('filled');
          }
        }
        const title = wild ? CAUGHT[e.outcome] : e.outcome === 'first' ? 'SPOT ON!' : e.outcome === 'second' ? 'GOT IT!' : "HERE'S HOW IT GOES";
        const why = e.outcome === 'shown' && e.reason && e.reason !== SORT_LOOK ? [readable(e.reason), h('br'), h('br')] : [];
        const box = h('div', { class: 'feedback good pop' }, h('b', {}, title), ...why, readable(e.success));
        // A review item missed first time: the Move card is the next thing to look at.
        if (a.kind === 'review' && e.outcome !== 'first') {
          const skill = content.skill(skillOf(a));
          box.append(h('div', { class: 'actions miss-card' }, h('button', { class: 'big alt', onclick: () => openMoveCard(skill) }, 'MOVE CARD')));
        }
        const next = nextButtons(app, branch, events, a.kind === 'encounter' ? skillOf(a) : undefined);
        feedback.replaceChildren(box, ...(next ? [next] : []));
        const done = events.find((x) => x.type === 'reviewDone');
        if (done) feedback.append(reviewResult(app, done.first, done.of));
        if (wild && sprite) {
          creatureReacts(sprite, e.outcome);
          if (e.outcome !== 'shown') app.sfx('right');
        } else if (e.outcome !== 'shown') {
          app.sfx('right');
          burst(sprite ?? box);
        }
      }
    }
  };
  return panel;
}

/** What became of the wild Creature, by how it was answered. */
const CAUGHT: Record<Outcome, string> = { first: 'CAUGHT!', second: "GOT IT, BUT IT'S NERVOUS", shown: 'IT SLIPPED AWAY…' };

/** First try: caught, in a burst. Second try: caught but wobbling. Shown: it fades and slides away, and the answer stays. */
function creatureReacts(sprite: HTMLElement, outcome: Outcome): void {
  if (outcome === 'first') return burst(sprite);
  sprite.classList.remove('bob', 'shake');
  sprite.classList.add(outcome === 'second' ? 'nervous' : 'slip');
}

/** Greys the answers out and ignores taps on them for a moment. */
function hold(el: HTMLElement, ms: number): void {
  el.inert = true;
  el.classList.add('resting');
  setTimeout(() => {
    el.inert = false;
    el.classList.remove('resting');
  }, ms);
}

/** `played` is the Skill of an ordinary Encounter just finished: once it owes a sentence, writing one comes next. */
function nextButtons(app: App, branch: BranchId, events: GameEvent[], played?: SkillId): HTMLElement | null {
  const ended = events.find((e) => e.type === 'badge' || e.type === 'retreated');
  const still = app.store.save.activity;
  const row = h('div', { class: 'actions' });
  if (events.some((e) => e.type === 'reviewDone')) return null;
  if (still?.kind === 'review') {
    row.append(h('button', { class: 'big', onclick: () => app.go({ name: 'activity', branch: activityBranch(content, still) }) }, 'NEXT'));
    return row;
  }
  const taught = events.find((e) => e.type === 'taught');
  if (ended || (!still && taught)) {
    if (!ended) row.append(h('button', { class: 'big', onclick: () => app.go({ name: 'activity', branch }) }, 'TRY IT FOR REAL'));
    row.append(h('button', { class: ended ? 'big' : 'ghost', onclick: () => app.go({ name: 'island', branch }) }, 'ISLAND'));
    return row;
  }
  if (still) {
    row.append(h('button', { class: 'big', onclick: () => app.go({ name: 'activity', branch }) }, 'NEXT'));
    return row;
  }
  const write = played && owesSentence(content, app.store.save, played) ? played : undefined;
  row.append(
    h('button', { class: 'ghost', onclick: () => app.go({ name: 'island', branch }) }, 'ISLAND'),
    write
      ? h('button', { class: 'big pulse', onclick: () => app.go({ name: 'sentence', skill: write }) }, 'WRITE YOUR OWN')
      : h('button', { class: 'big pulse', onclick: () => app.go({ name: 'activity', branch }) }, 'KEEP GOING'),
  );
  return row;
}

/** The end of a Daily review: how many came back first try, then home. */
function reviewResult(app: App, first: number, of: number): HTMLElement {
  return h(
    'div',
    { class: 'panel pop review-done' },
    h('h2', {}, 'DAILY REVIEW DONE'),
    h('p', { class: 'note' }, readable(`${first} of ${of} right first try. Old moves stay sharp when you use them.`)),
    h('div', { class: 'actions' }, h('button', { class: 'big', onclick: () => app.go({ name: 'home' }) }, 'HOME')),
  );
}

function arena(app: App, a: Extract<Activity, { kind: 'keeper' }>): HTMLElement {
  const b = content.branch(a.branch);
  const mine = befriendedFor(app, a.branch);
  const foe = creatureCanvas(b.keeper.creature.toLowerCase(), { scale: 7, evolved: true });
  const me = mine ? creatureCanvas(mine.id, { scale: 8, flip: true, evolved: mine.evolved }) : captainCanvas(app.store.save.captain!, 6);
  foe.classList.add('bx', 'bob', 'foe-sprite');
  me.classList.add('bx', 'me-sprite');
  foe.style.cssText = 'right:70px;top:18px';
  me.style.cssText = 'left:70px;bottom:30px';
  const bar = (pct: number, cls: string) => h('div', { class: 'bar' }, h('i', { class: cls, style: `width:${pct}%` }));
  return h(
    'div',
    { class: 'arena' },
    h('div', { class: 'pad', style: 'right:55px;top:118px' }),
    h('div', { class: 'pad', style: 'left:50px;bottom:22px;width:200px' }),
    foe,
    me,
    h('div', { class: 'hp bx', style: 'left:16px;top:16px' }, `${b.keeper.name.toUpperCase()}`, bar((100 * a.foe) / KEEPER_HP, 'foe-hp')),
    h('div', { class: 'hp bx', style: 'right:16px;bottom:16px' }, `YOU · TURN ${a.turn}`, bar((100 * a.hp) / KEEPER_HP, 'you-hp')),
  );
}

function befriendedFor(app: App, branch: BranchId) {
  const skills = content.skillsOf(branch).filter((s) => app.store.save.skills[s.id]?.mastered);
  const s = skills.at(-1);
  return s ? { id: s.creature.id, evolved: true } : undefined;
}

function hit(panel: HTMLElement, target: 'foe' | 'you', amount: number, app: App): void {
  const arenaEl = panel.querySelector('.arena');
  if (!arenaEl) return;
  shake(arenaEl);
  app.sfx('hit');
  const barEl = arenaEl.querySelector<HTMLElement>(target === 'foe' ? '.foe-hp' : '.you-hp');
  if (barEl) barEl.style.width = `${Math.max(0, parseFloat(barEl.style.width) - (100 * amount) / KEEPER_HP)}%`;
  const sprite = arenaEl.querySelector(target === 'foe' ? '.foe-sprite' : '.me-sprite');
  sprite?.classList.add('flash');
}
