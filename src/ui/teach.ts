import { crew } from '../app/content';
import { crewCanvas } from '../art/crew';
import type { Chunk, Show, Skill, Step } from '../content/types';
import { RUSH_LOCK_MS, rushed } from '../core/pace';
import { h } from './dom';
import { shake } from './fx';
import { hear, readable, saidBy, sayLine } from './speech';
import './teach.css';

const SLOTS = 5;

/** Every tag in a Skill keeps one colour across its steps and its Move card, so MAIN CLAUSE is always gold. */
export function tagColours(skill: Skill): Map<string, number> {
  const colours = new Map<string, number>();
  const shows = [...skill.teach.iDo.steps.flatMap((s) => (s.show ? [s.show] : [])), ...skill.teach.iDo.card.examples];
  for (const show of shows)
    for (const c of show) if (typeof c !== 'string' && c.tag && !colours.has(c.tag)) colours.set(c.tag, (colours.size % SLOTS) + 1);
  return colours;
}

interface Shown {
  el: HTMLElement;
  /** Light up and label every tagged chunk. */
  reveal(): void;
  lock(): void;
}

/** An example sentence built from chunks. With onTap, each chunk is a button and plain text stays plain. */
export function showChunks(show: Show, colours: Map<string, number>, onTap?: (index: number, el: HTMLElement) => void): Shown {
  const chunks: { el: HTMLElement; chunk: Chunk }[] = [];
  const el = h('div', { class: 'chunks reading' });
  for (const piece of show) {
    if (typeof piece === 'string') {
      if (!piece.trim()) continue;
      el.append(h('span', { class: 'plain' }, onTap ? piece : readable(piece)));
      continue;
    }
    const index = chunks.length;
    const colour = piece.tag ? `c${colours.get(piece.tag) ?? 1}` : 'c0';
    const tag = h('span', { class: 'ch-tag' }, piece.tag ?? '');
    const text = h('span', { class: 'ch-t' }, piece.text);
    const cls = `ch ${colour}${piece.tag ? '' : ' no-tag'}${piece.lit ? ' on' : ''}${onTap ? ' tapme' : ''}`;
    const node = onTap
      ? h('button', { class: cls, onclick: () => onTap(index, node) }, text, tag)
      : h('span', { class: cls }, text, tag);
    chunks.push({ el: node, chunk: piece });
    el.append(node);
  }
  return {
    el,
    reveal: () => chunks.forEach((c) => c.chunk.tag && c.el.classList.add('on')),
    lock: () =>
      chunks.forEach((c) => {
        if (c.el instanceof HTMLButtonElement) c.el.disabled = true;
        c.el.classList.remove('tried', 'tapme');
      }),
  };
}

/**
 * One teaching step: the crew member's line, the example, and the one thing to do before NEXT appears. `intro` is a
 * line said first, in the same bubble.
 */
function stepView(skill: Skill, step: Step, colours: Map<string, number>, onWon: () => void, intro?: string): HTMLElement {
  const fb = h('div', { class: 'step-fb' });
  const person = crew[skill.teach.crew].name.toUpperCase();
  let won = false;
  let lastWrong: number | undefined;
  let held = false;
  /** Two wrong taps within 3 seconds is tapping, not reading: the choices lock for 2 seconds and the nudge is read out. */
  const nudge = (text: string, el: HTMLElement) => {
    if (held) return;
    el.classList.add('tried');
    shake(el);
    const now = performance.now();
    const rush = rushed(lastWrong, now);
    lastWrong = now;
    const box = h('div', { class: `feedback look pop${rush ? ' slow-down' : ''}` }, rush ? h('div', { class: 'slow-line' }, readable('Slow down: read it, then tap.')) : null, saidBy('HAVE ANOTHER GO', text), readable(text));
    fb.replaceChildren(box);
    if (!rush) return;
    sayLine(text, box);
    held = true;
    view.classList.add('held');
    setTimeout(() => {
      held = false;
      view.classList.remove('held');
    }, RUSH_LOCK_MS);
  };
  const win = () => {
    won = true;
    shown?.reveal();
    shown?.lock();
    fb.replaceChildren(h('div', { class: 'feedback good pop' }, saidBy(person, step.win), readable(step.win)));
    onWon();
  };
  const c = step.check;
  const chunkList = (step.show ?? []).filter((p): p is Chunk => typeof p !== 'string');
  const shown = step.show
    ? showChunks(step.show, colours, c.kind === 'tap' ? (i, el) => !won && !held && (i === c.answer ? win() : nudge(chunkList[i]?.nudge ?? 'Not that one. Have another look.', el)) : undefined)
    : undefined;
  const answers: HTMLElement[] = [];
  if (c.kind === 'yesno')
    for (const [label, value] of [['YES', true], ['NO', false]] as const) {
      const b: HTMLButtonElement = h('button', { class: 'alt answer', onclick: () => !won && !held && (value === c.answer ? (b.classList.add('right'), win()) : nudge(c.nudge, b)) }, label);
      answers.push(b);
    }
  if (c.kind === 'pick')
    c.options.forEach((o, i) => {
      const b: HTMLButtonElement = h('button', { class: 'chip answer', onclick: () => !won && !held && (i === c.answer ? (b.classList.add('right'), win()) : nudge(o.reason ?? 'Not that one. Have another look.', b)) }, o.text);
      answers.push(b);
    });
  // The ask is built after the say so that, read aloud, the lines come in the order they sit on screen.
  const say = h('div', { class: 'speech task-speech step-say' }, saidBy(person, intro ? `${intro} ${step.say}` : step.say), intro ? h('div', { class: 'reading say-intro' }, readable(intro)) : null, h('div', { class: 'reading' }, readable(step.say)));
  const ask = h('div', { class: 'prompt step-ask say-line' }, h('div', {}, readable(step.ask)), hear(step.ask));
  const paper = shown ? h('div', { class: 'passage step-show' }, shown.el) : null;
  const choices = answers.length ? h('div', { class: 'chips step-choices' }, answers) : null;
  const view = h('div', { class: 'step' }, say, paper, ask, choices, fb);
  return view;
}

interface Lesson {
  frame: string;
  steps: Step[];
  /** The label on the last step's button. */
  last: string;
  intro?: string;
}

/** Plays steps one at a time: each must be won before NEXT. */
function stepPlayer(skill: Skill, lesson: Lesson, done: () => void): HTMLElement {
  const steps = lesson.steps;
  const colours = tagColours(skill);
  const portrait = crewCanvas(skill.teach.crew, 6);
  portrait.classList.add('bob');
  const body = h('div', { class: 'step-body' });
  const dots = h('div', { class: 'dots' });
  const next = h('button', { class: 'big', disabled: true }, 'NEXT');
  const counter = h('div', { class: 'frame' });
  let at = 0;
  const draw = () => {
    next.disabled = true;
    next.textContent = at < steps.length - 1 ? 'NEXT' : lesson.last;
    counter.textContent = steps.length > 1 ? `STEP ${at + 1} OF ${steps.length}` : '';
    dots.replaceChildren(...(steps.length > 1 ? steps.map((_, i) => h('i', { class: i <= at ? 'on' : '' })) : []));
    body.replaceChildren(stepView(skill, steps[at]!, colours, () => (next.disabled = false), at === 0 ? lesson.intro : undefined));
    scrollTo(0, 0);
  };
  next.addEventListener('click', () => {
    if (at < steps.length - 1) {
      at++;
      draw();
    } else done();
  });
  draw();
  return h(
    'div',
    { class: 'panel teach' },
    h('div', { class: 'frame' }, lesson.frame),
    h('h2', {}, skill.name.toUpperCase()),
    h('div', { class: 'row teach-row' }, portrait, body),
    h('div', { class: 'bar-actions' }, h('div', { class: 'row' }, counter, dots), next),
  );
}

/** The whole I do: every step must be won before NEXT, and the last one hands over to the student. */
export function teachPlayer(skill: Skill, done: () => void): HTMLElement {
  const person = crew[skill.teach.crew];
  return stepPlayer(skill, { frame: `NEW MOVE · ${person.name.toUpperCase()} THE ${person.role.toUpperCase()}`, steps: skill.teach.iDo.steps, last: 'MY TURN' }, done);
}

/** A rusty Skill's trap step, replayed before its Daily review item, with the same player as the I do. */
export function refresherPlayer(skill: Skill, trap: Step, done: () => void): HTMLElement {
  const person = crew[skill.teach.crew];
  return stepPlayer(skill, { frame: `QUICK REFRESHER · ${person.name.toUpperCase()} THE ${person.role.toUpperCase()}`, steps: [trap], last: 'BACK TO THE REVIEW', intro: 'Quick refresher first!' }, done);
}

/** The reminder: what each term means, two labelled examples, and the quick test. */
export function moveCardBody(skill: Skill): HTMLElement[] {
  const card = skill.teach.iDo.card;
  const colours = tagColours(skill);
  return [
    h(
      'div',
      { class: 'card-terms' },
      card.terms.map((t) => h('div', { class: 'card-term' }, h('span', { class: `ch on c${colours.get(t.term) ?? 0}` }, h('span', { class: 'ch-tag' }, t.term)), h('div', { class: 'reading' }, readable(t.means)))),
    ),
    ...card.examples.map((ex) => {
      const s = showChunks(ex, colours);
      s.reveal();
      return h('div', { class: 'passage card-example' }, s.el);
    }),
    h('div', { class: 'card-test' }, h('b', {}, 'THE TEST'), h('div', { class: 'reading' }, readable(card.test))),
  ];
}

/** The Move card as a pop-up over a task. */
export function openMoveCard(skill: Skill): void {
  const close = h('button', { class: 'big', onclick: () => overlay.remove() }, 'CLOSE');
  const overlay = h(
    'div',
    { class: 'overlay move-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Move card: ${skill.name}` },
    h(
      'div',
      { class: 'panel pop move-card-panel' },
      h('div', { class: 'frame' }, 'MOVE CARD'),
      h('h2', {}, skill.name.toUpperCase()),
      ...moveCardBody(skill),
      h('div', { class: 'actions move-card-close' }, close),
    ),
  );
  document.body.append(overlay);
}
