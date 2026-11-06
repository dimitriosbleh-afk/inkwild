import { content, crew } from '../../app/content';
import { crewCanvas } from '../../art/crew';
import type { SkillId } from '../../content/types';
import type { Marks } from '../../core/save';
import { ownWords, SENTENCE_MIN_WORDS } from '../../core/sentence';
import type { App, ScreenView } from '../app';
import { h } from '../dom';
import { burst } from '../fx';
import { checkFlow, markedText, markKey } from '../marking';
import { readable, saidBy } from '../speech';
import { openMoveCard } from '../teach';
import '../task.css';

const draftKey = (skill: SkillId) => `inkwild.sentence.${skill}`;

/**
 * Keeps the box being typed in and its DONE button above the iPad keyboard. The page never changes size while typing,
 * so nothing jumps; it only scrolls when the keyboard would cover DONE.
 */
export function keepAboveKeyboard(input: HTMLTextAreaElement, keep: HTMLElement): () => void {
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

/**
 * Write your own: one sentence of the Student's own that uses the move. Never marked. After DONE they check it: for
 * each check, they tap the words that do it, or go back and fix it. Then they see one way it could go.
 */
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

  /** The check the Student said their sentence doesn't do yet, shown in gold until they try again. */
  let fix: number | undefined;
  const writing = (): HTMLElement[] => {
    const checks = w.checks.length
      ? h(
          'div',
          { class: 'write-checks' },
          h('div', { class: 'frame' }, 'YOUR SENTENCE SHOULD'),
          w.checks.map((c, i) => h('div', { class: `write-check${i === fix ? ' fix' : ''}` }, h('span', { class: 'check-num' }, String(i + 1)), h('div', { class: 'reading' }, readable(c)))),
        )
      : null;
    // Right above the box, so it stays in sight with the keyboard up.
    const gold = fix !== undefined ? h('div', { class: 'write-fix pop' }, h('b', {}, 'MAKE IT DO THIS'), h('div', { class: 'reading' }, readable(w.checks[fix]!))) : null;
    const parts: (HTMLElement | null)[] = [checks, gold, text, doneRow];
    return parts.filter((x): x is HTMLElement => x !== null);
  };
  const work = h('div', { class: 'write-work' }, ...writing());
  const panel = h(
    'div',
    { class: 'panel task write-card' },
    h(
      'div',
      { class: 'stage stage-crew' },
      h('div', { class: 'frame' }, `YOUR TURN TO WRITE · ${sk.name.toUpperCase()}`),
      h('div', { class: 'stage-row' }, sprite, h('div', { class: 'speech task-speech' }, saidBy(person.name.toUpperCase(), w.ask), h('div', { class: 'reading say-prompt' }, readable(w.ask)))),
    ),
    w.given?.length ? h('div', { class: 'passage write-given' }, w.given.map((g) => h('div', { class: 'reading' }, readable(g)))) : null,
    work,
  );

  const finish = (mine: string, marks: Marks) => {
    app.store.dispatch({ type: 'sentence', skill, text: mine, marks });
    localStorage.removeItem(draftKey(skill));
    const model = h('div', { class: 'passage reading write-model' }, readable(w.model));
    work.replaceChildren(
      h('div', { class: 'feedback good pop' }, h('b', {}, 'YOU WROTE IT!'), h('div', { class: 'write-mine' }, markedText(mine, marks, 'div')), markKey(w.checks, marks)),
      h('h3', { class: 'write-way' }, "HERE'S ONE WAY:"),
      model,
      h('p', { class: 'note' }, 'Yours can be different. It is saved in MY WRITING, and nobody marks it.'),
      h('div', { class: 'actions' }, h('button', { class: 'ghost', onclick: toIsland }, 'ISLAND'), h('button', { class: 'big', onclick: play }, 'TRY IT FOR REAL')),
    );
    app.sfx('right');
    burst(sprite);
    work.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  // Check it: the Student points at the words that do each check. MINE DOESN'T YET goes back to fix that one.
  const backToWriting = (check: number) => {
    fix = check;
    work.replaceChildren(...writing());
    update();
    text.focus();
    work.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  done.addEventListener('click', () => {
    if (done.disabled) return;
    const mine = text.value.trim();
    text.blur();
    if (!w.checks.length) return finish(mine, []);
    work.replaceChildren(
      checkFlow({
        text: mine,
        items: w.checks,
        line: 'Tap the words in your sentence that do this:',
        gate: true,
        back: { label: "MINE DOESN'T YET", go: backToWriting },
        finish: { label: 'NEXT', go: (marks) => finish(mine, marks) },
      }),
    );
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
