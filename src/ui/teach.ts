import { crew } from '../app/content';
import { crewCanvas } from '../art/crew';
import type { Chunk, Show, Skill, Step } from '../content/types';
import { h } from './dom';
import { shake } from './fx';
import { readable } from './speech';
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

/** One teaching step: the crew member's line, the example, and the one thing to do before NEXT appears. */
function stepView(skill: Skill, step: Step, colours: Map<string, number>, onWon: () => void): HTMLElement {
  const fb = h('div', { class: 'step-fb' });
  const person = crew[skill.teach.crew].name.toUpperCase();
  let won = false;
  const nudge = (text: string, el: HTMLElement) => {
    el.classList.add('tried');
    shake(el);
    fb.replaceChildren(h('div', { class: 'feedback look pop' }, h('b', {}, 'HAVE ANOTHER GO'), readable(text)));
  };
  const win = () => {
    won = true;
    shown?.reveal();
    shown?.lock();
    fb.replaceChildren(h('div', { class: 'feedback good pop' }, h('b', {}, person), readable(step.win)));
    onWon();
  };
  const c = step.check;
  const chunkList = (step.show ?? []).filter((p): p is Chunk => typeof p !== 'string');
  const shown = step.show
    ? showChunks(step.show, colours, c.kind === 'tap' ? (i, el) => !won && (i === c.answer ? win() : nudge(chunkList[i]?.nudge ?? 'Not that one. Have another look.', el)) : undefined)
    : undefined;
  const answers: HTMLElement[] = [];
  if (c.kind === 'yesno')
    for (const [label, value] of [['YES', true], ['NO', false]] as const) {
      const b: HTMLButtonElement = h('button', { class: 'alt answer', onclick: () => !won && (value === c.answer ? (b.classList.add('right'), win()) : nudge(c.nudge, b)) }, label);
      answers.push(b);
    }
  if (c.kind === 'pick')
    c.options.forEach((o, i) => {
      const b: HTMLButtonElement = h('button', { class: 'chip answer', onclick: () => !won && (i === c.answer ? (b.classList.add('right'), win()) : nudge(o.reason ?? 'Not that one. Have another look.', b)) }, o.text);
      answers.push(b);
    });
  const ask = h('div', { class: 'prompt step-ask' }, readable(step.ask));
  const paper = shown ? h('div', { class: 'passage step-show' }, shown.el) : null;
  const choices = answers.length ? h('div', { class: 'chips step-choices' }, answers) : null;
  return h('div', { class: 'step' }, h('div', { class: 'speech task-speech step-say' }, h('b', {}, person), h('div', { class: 'reading' }, readable(step.say))), paper, ask, choices, fb);
}

/** The whole I do: every step must be won before NEXT, and the last one hands over to the student. */
export function teachPlayer(skill: Skill, done: () => void): HTMLElement {
  const steps = skill.teach.iDo.steps;
  const colours = tagColours(skill);
  const person = crew[skill.teach.crew];
  const portrait = crewCanvas(skill.teach.crew, 6);
  portrait.classList.add('bob');
  const body = h('div', { class: 'step-body' });
  const dots = h('div', { class: 'dots' });
  const next = h('button', { class: 'big', disabled: true }, 'NEXT');
  const counter = h('div', { class: 'frame' });
  let at = 0;
  const draw = () => {
    next.disabled = true;
    next.textContent = at < steps.length - 1 ? 'NEXT' : 'MY TURN';
    counter.textContent = `STEP ${at + 1} OF ${steps.length}`;
    dots.replaceChildren(...steps.map((_, i) => h('i', { class: i <= at ? 'on' : '' })));
    body.replaceChildren(stepView(skill, steps[at]!, colours, () => (next.disabled = false)));
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
    h('div', { class: 'frame' }, `NEW MOVE · ${person.name.toUpperCase()} THE ${person.role.toUpperCase()}`),
    h('h2', {}, skill.name.toUpperCase()),
    h('div', { class: 'row teach-row' }, portrait, body),
    h('div', { class: 'bar-actions' }, h('div', { class: 'row' }, counter, dots), next),
  );
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
