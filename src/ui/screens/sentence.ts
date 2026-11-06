import { content, crew } from '../../app/content';
import { crewCanvas } from '../../art/crew';
import type { SkillId } from '../../content/types';
import { ownWords, SENTENCE_MIN_WORDS } from '../../core/sentence';
import type { App, ScreenView } from '../app';
import { h } from '../dom';
import { burst } from '../fx';
import { readable } from '../speech';
import { openMoveCard } from '../teach';
import '../task.css';

const draftKey = (skill: SkillId) => `inkwild.sentence.${skill}`;

/** A big tick box beside its check. The box ticks; the words can be tapped to hear them. */
function tickRow(text: string): { row: HTMLElement; ticked: () => boolean } {
  let on = false;
  const box = h('button', { class: 'tickbox', role: 'checkbox', 'aria-checked': 'false', 'aria-label': text });
  box.addEventListener('click', () => {
    on = !on;
    box.classList.toggle('on', on);
    box.setAttribute('aria-checked', String(on));
  });
  return { row: h('div', { class: 'write-check' }, box, h('div', { class: 'reading' }, readable(text))), ticked: () => on };
}

/**
 * Keeps the box being typed in and its DONE button above the iPad keyboard. The page never changes size while typing,
 * so nothing jumps; it only scrolls when the keyboard would cover DONE.
 */
function keepAboveKeyboard(input: HTMLTextAreaElement, keep: HTMLElement): () => void {
  const vv = window.visualViewport;
  const fit = () => {
    if (!vv || document.activeElement !== input) return;
    const over = keep.getBoundingClientRect().bottom + 12 - (vv.offsetTop + vv.height);
    if (over > 0) window.scrollBy(0, over);
  };
  const soon = () => setTimeout(fit, 350);
  vv?.addEventListener('resize', fit);
  input.addEventListener('focus', soon);
  return () => vv?.removeEventListener('resize', fit);
}

/** Write your own: one sentence of the Student's own that uses the move. Never marked; they tick their own checks. */
export function sentenceScreen(app: App, { skill }: { skill: SkillId }): ScreenView {
  const sk = content.skill(skill);
  const branch = sk.branch;
  const play = () => app.go({ name: 'activity', branch, wrote: true });
  const w = sk.write;
  if (!w) return { el: h('div', { class: 'centre' }, h('div', { class: 'panel' }, h('div', { class: 'actions' }, h('button', { class: 'big', onclick: play }, 'TRY IT FOR REAL')))) };

  const toIsland = () => app.go({ name: 'island', branch });
  const person = crew[sk.teach.crew];
  const sprite = crewCanvas(sk.teach.crew, 6);
  sprite.classList.add('bob');

  const ticks = w.checks.map(tickRow);
  const text = h('textarea', {
    class: 'sentence-in',
    rows: '3',
    placeholder: 'Write your sentence here...',
    autocapitalize: 'sentences',
    autocomplete: 'off',
    'aria-label': 'Your sentence',
  });
  text.value = localStorage.getItem(draftKey(skill)) ?? w.starter ?? '';
  const count = h('div', { class: 'frame write-count' });
  const done = h('button', { class: 'big', disabled: true }, 'DONE');
  const doneRow = h('div', { class: 'write-done' }, count, done);
  const update = () => {
    const n = ownWords(text.value, w.starter);
    const left = SENTENCE_MIN_WORDS - n;
    done.disabled = left > 0;
    count.textContent = left > 0 ? `${left} MORE WORD${left === 1 ? '' : 'S'}` : 'READY WHEN YOU ARE';
  };
  text.addEventListener('input', () => {
    localStorage.setItem(draftKey(skill), text.value);
    update();
  });
  update();

  const work = h(
    'div',
    { class: 'write-work' },
    text,
    w.checks.length ? h('div', { class: 'write-checks' }, h('div', { class: 'frame' }, 'NOW CHECK IT. TICK EACH ONE YOUR SENTENCE DOES'), ticks.map((t) => t.row)) : null,
    doneRow,
  );
  const panel = h(
    'div',
    { class: 'panel task write-card' },
    h(
      'div',
      { class: 'stage stage-crew' },
      h('div', { class: 'frame' }, `YOUR TURN TO WRITE · ${sk.name.toUpperCase()}`),
      h('div', { class: 'stage-row' }, sprite, h('div', { class: 'speech task-speech' }, h('b', {}, person.name.toUpperCase()), h('div', { class: 'reading say-prompt' }, readable(w.ask)))),
    ),
    w.given?.length ? h('div', { class: 'passage write-given' }, w.given.map((g) => h('div', { class: 'reading' }, readable(g)))) : null,
    work,
  );

  done.addEventListener('click', () => {
    if (done.disabled) return;
    const mine = text.value.trim();
    text.blur();
    app.store.dispatch({ type: 'sentence', skill, text: mine, ticks: ticks.map((t) => t.ticked()) });
    localStorage.removeItem(draftKey(skill));
    const model = h('div', { class: 'passage reading write-model' }, readable(w.model));
    work.replaceChildren(
      h('div', { class: 'feedback good pop' }, h('b', {}, 'YOU WROTE IT!'), readable(mine)),
      h('h3', { class: 'write-way' }, "HERE'S ONE WAY:"),
      model,
      h('p', { class: 'note' }, 'Yours can be different. It is saved in MY WRITING, and nobody marks it.'),
      h('div', { class: 'actions' }, h('button', { class: 'ghost', onclick: toIsland }, 'ISLAND'), h('button', { class: 'big', onclick: play }, 'TRY IT FOR REAL')),
    );
    app.sfx('right');
    burst(sprite);
    work.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });

  const el = h(
    'div',
    { class: 'centre task-screen' },
    h(
      'div',
      { class: 'row spread task-head' },
      h('div', { class: 'row' }, h('button', { class: 'ghost', onclick: toIsland }, 'ISLAND'), h('button', { class: 'alt', onclick: () => openMoveCard(sk) }, 'MOVE CARD')),
      h('div', { class: 'frame' }, 'NEVER MARKED'),
    ),
    panel,
  );
  return { el, stop: keepAboveKeyboard(text, doneRow) };
}
