import { paragraphWords } from '../core/sentence';
import type { Marks } from '../core/save';
import { h } from './dom';
import { readable } from './speech';

/** Colour slot (c1 to c5, as in teach.css) for the check at this index, so each check keeps one colour. */
const slot = (check: number) => `c${(check % 5) + 1}`;

/**
 * The Student's own text as word chips: tap a word to highlight it, tap again to let it go. Paragraphs keep their
 * shape. The words are never read aloud: reading their own writing back is the point.
 */
function wordChips(text: string, picked: Set<number>, onChange: () => void): HTMLElement {
  let n = 0;
  const paras = paragraphWords(text).map((para) =>
    h(
      'div',
      { class: 'chip-para' },
      para.map((word) => {
        const i = n++;
        const b = h('button', { class: `word-chip${picked.has(i) ? ' on' : ''}`, type: 'button', 'aria-pressed': String(picked.has(i)) }, word);
        b.addEventListener('click', () => {
          if (picked.has(i)) picked.delete(i);
          else picked.add(i);
          b.classList.toggle('on', picked.has(i));
          b.setAttribute('aria-pressed', String(picked.has(i)));
          onChange();
        });
        return b;
      }),
    ),
  );
  return h('div', { class: 'passage word-chips' }, paras);
}

export interface CheckFlow {
  /** The Student's text, as they wrote it. */
  text: string;
  /** The checks or checklist items, one step each. */
  items: string[];
  /** Said before each item, for example "Tap the words in your sentence that do this:". */
  line: string;
  /** NEXT waits until at least one word is tapped. */
  gate: boolean;
  /** Shown above the chips on every step, such as the Piece's title. */
  above?: HTMLElement | null;
  back: { label: string; go: (item: number) => void };
  /** The last step's button, and what happens with every item's tapped words. */
  finish: { label: string; go: (marks: Marks) => void };
}

/** Check it: one item at a time, the Student taps the words of their own text that do it. Tapped words are the tick. */
export function checkFlow(f: CheckFlow): HTMLElement {
  const picked = f.items.map(() => new Set<number>());
  const el = h('div', { class: 'check-flow' });
  const show = (at: number) => {
    const last = at === f.items.length - 1;
    const mine = picked[at]!;
    const next = h('button', { class: 'big', type: 'button' }, last ? f.finish.label : 'NEXT');
    const ready = () => (next.disabled = f.gate && mine.size === 0);
    ready();
    next.addEventListener('click', () => {
      if (next.disabled) return;
      if (!last) return show(at + 1);
      f.finish.go(picked.map((p) => [...p].sort((a, b) => a - b)));
    });
    const parts = [
      f.items.length > 1 ? h('div', { class: 'check-list' }, f.items.map((item, i) => h('div', { class: `check-item${i === at ? ' now' : ''}${i < at && picked[i]!.size ? ' done' : ''}` }, h('span', { class: 'check-num' }, String(i + 1)), h('span', { class: 'reading' }, item)))) : null,
      h('div', { class: 'frame' }, `CHECK ${at + 1} OF ${f.items.length}`),
      h('div', { class: 'prompt check-line' }, readable(`${f.line} ${f.items[at]!}`)),
      f.above ?? null,
      wordChips(f.text, mine, ready),
      h('div', { class: 'actions check-actions' }, h('button', { class: 'ghost', type: 'button', onclick: () => f.back.go(at) }, f.back.label), next),
    ];
    el.replaceChildren(...parts.filter((x): x is HTMLElement => x !== null));
    el.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  };
  if (f.items.length) show(0);
  return el;
}

/** The first check that marked each word. */
function markOf(marks: Marks): Map<number, number> {
  const of = new Map<number, number>();
  marks.forEach((words, check) => words.forEach((w) => of.has(w) || of.set(w, check)));
  return of;
}

/** The Student's text with the words they tapped for each check lit in that check's colour, one element per paragraph. */
export function markedText(text: string, marks: Marks, tag: 'p' | 'div' = 'p'): HTMLElement[] {
  const of = markOf(marks);
  let n = 0;
  return paragraphWords(text).map((para) =>
    h(
      tag,
      { class: 'marked-para' },
      para.flatMap((word, k) => {
        const check = of.get(n++);
        const w = check === undefined ? word : h('span', { class: `marked ${slot(check)}` }, word);
        return k === 0 ? [w] : [' ', w];
      }),
    ),
  );
}

/** Which colour shows which check, for the checks the Student found words for. */
export function markKey(items: string[], marks: Marks): HTMLElement | null {
  const shown = items.map((item, i) => ({ item, i })).filter(({ i }) => (marks[i]?.length ?? 0) > 0);
  if (!shown.length) return null;
  return h('div', { class: 'mark-key' }, shown.map(({ item, i }) => h('div', { class: 'mark-key-row' }, h('span', { class: `marked swatch-mark ${slot(i)}` }, ' '), h('span', {}, item))));
}
