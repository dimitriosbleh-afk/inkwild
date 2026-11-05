import type { Body, Part, Response, Task } from '../content/types';
import { joinTiles, piecesNeeded, taps, tilesFor } from '../core/check';
import type { Outcome } from '../core/save';
import { h } from './dom';
import { readable } from './speech';

export interface Widget {
  el: HTMLElement;
  /** Mark the last attempt as wrong; the widget stays usable for the Second look. */
  wrong(): void;
  /** An extra line for the Second look, when the widget has one. */
  lookNote?(): string;
  /** Show the right answer and lock the widget. */
  reveal(outcome: Outcome): void;
  /** The fix format's tap was on the right spot: show the replacement options. */
  proceed?(): void;
}

type Submit = (r: Response) => void;

/** Long enough to see which pieces were wrong before they move to where they belong. */
const SHOW_CHANGE_MS = 1400;
const SETTLE_MS = 700;

export function passage(task: Task, filled?: string): HTMLElement | null {
  if (!task.text) return null;
  const parts = task.text.split('___');
  const out = h('div', { class: 'reading passage' });
  parts.forEach((p, i) => {
    out.append(readable(p));
    if (i < parts.length - 1) out.append(h('span', { class: `blank${filled ? ' filled' : ''}` }, filled ?? ' '));
  });
  return out;
}

export function widget(body: Body, submit: Submit): Widget {
  switch (body.format) {
    case 'choose':
      return choose(body, submit);
    case 'tapText':
      return tapText(body, submit);
    case 'order':
      return order(body, submit);
    case 'build':
      return build(body, submit);
    case 'fix':
      return fix(body, submit);
    case 'sort':
      return sort(body, submit);
  }
}

function mark(kind: 'tick' | 'cross'): HTMLElement {
  return h('span', { class: `mark ${kind}`, role: 'img', 'aria-label': kind === 'tick' ? 'right' : 'wrong' });
}

function chips(options: { text: string }[], onPick: (i: number) => void) {
  let last = -1;
  const buttons = options.map((o, i) =>
    h('button', { class: 'chip reading', onclick: () => ((last = i), onPick(i)) }, o.text),
  );
  return {
    el: h('div', { class: 'chips' }, shuffled(options).map((i) => buttons[i]!)),
    wrong: () => buttons[last]?.classList.add('crossed'),
    reveal: (answer: number) => {
      buttons.forEach((b, i) => {
        b.disabled = true;
        b.classList.toggle('right', i === answer);
      });
    },
  };
}

function choose(body: Extract<Body, { format: 'choose' }>, submit: Submit): Widget {
  const c = chips(body.options, (choice) => submit({ format: 'choose', choice }));
  return { el: c.el, wrong: c.wrong, reveal: () => c.reveal(body.answer) };
}

function tappableText(parts: Part[], onTap: (i: number) => void) {
  let n = 0;
  let last = -1;
  const buttons: HTMLButtonElement[] = [];
  const el = h('div', { class: 'reading passage taps' });
  for (const p of parts) {
    if (typeof p === 'string') {
      el.append(readable(p));
      continue;
    }
    const i = n++;
    const b = h('button', { class: 'tap', onclick: () => ((last = i), onTap(i)) }, p.tap);
    buttons.push(b);
    el.append(b);
  }
  return {
    el,
    wrong: () => buttons[last]?.classList.add('crossed'),
    pick: (i: number) => buttons.forEach((b, k) => b.classList.toggle('picked', k === i)),
    lock: (answer: number) =>
      buttons.forEach((b, i) => {
        b.disabled = true;
        b.classList.toggle('right', i === answer);
      }),
  };
}

function tapText(body: Extract<Body, { format: 'tapText' }>, submit: Submit): Widget {
  const t = tappableText(body.parts, (tap) => submit({ format: 'tapText', tap }));
  return { el: t.el, wrong: t.wrong, reveal: () => t.lock(body.answer) };
}

function short(text: string, max = 48): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.lastIndexOf(' ', max - 1);
  return `${t.slice(0, cut > 0 ? cut : max).replace(/[,;:]$/, '')}…`;
}

/**
 * Two stages, as the check expects: the first tap is checked on its own, and only the right spot opens the options.
 * Once the options are open, tapping another part just moves the selection; that part is what gets checked with the choice.
 */
function fix(body: Extract<Body, { format: 'fix' }>, submit: Submit): Widget {
  const options = h('div', { class: 'fix-options' });
  const label = h('p', { class: 'swap-label' });
  const spots = taps(body.parts);
  let stage: 'spot' | 'choice' = 'spot';
  let picked = body.spot;
  const showSwap = () => {
    t.pick(picked);
    label.replaceChildren(h('span', { class: 'swap-title' }, 'Swap this part:'), ' ', h('span', { class: 'reading swap-quote' }, readable(`“${short(spots[picked]?.tap ?? '')}”`)));
  };
  const t = tappableText(body.parts, (tap) => {
    if (stage === 'spot') return submit({ format: 'fix', tap });
    picked = tap;
    showSwap();
  });
  const c = chips(body.options, (choice) => submit({ format: 'fix', tap: picked, choice }));
  const openOptions = () => {
    showSwap();
    options.replaceChildren(label, c.el);
  };
  return {
    el: h('div', { class: 'fixer' }, t.el, options),
    wrong: () => {
      if (stage === 'choice' && picked === body.spot) return c.wrong();
      t.wrong();
      if (stage === 'choice') {
        stage = 'spot';
        t.pick(-1);
        options.replaceChildren();
      }
    },
    proceed: () => {
      stage = 'choice';
      picked = body.spot;
      openOptions();
    },
    reveal: () => {
      t.lock(body.spot);
      picked = body.spot;
      openOptions();
      c.reveal(body.answer);
    },
  };
}

function shuffled<T>(items: T[], neverInOrder = false): number[] {
  const idx = items.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j]!, idx[i]!];
  }
  if (neverInOrder && idx.every((v, i) => v === i) && idx.length > 1) idx.push(idx.shift()!);
  return idx;
}

type TileMark = 'tick' | 'cross' | 'moved';

/** Shared tap-to-place mechanic for order and build: tap a tile in the tray to place it, tap a placed tile to send it back. */
function placer(
  labels: string[],
  opts: { lineClass: string; need: number; join: (placed: number[]) => string; submit: (placed: number[]) => void },
) {
  const trayOrder = shuffled(labels, true);
  let placed: number[] = [];
  let sent: number[] = [];
  let marks: TileMark[] = [];
  const line = h('div', { class: `line ${opts.lineClass}` });
  const tray = h('div', { class: 'tray' });
  const preview = h('div', { class: 'reading preview' });
  const check = h('button', { class: 'go', onclick: () => ((sent = [...placed]), opts.submit(placed)) }, 'CHECK');
  let locked = false;

  const draw = () => {
    line.replaceChildren(
      ...placed.map((i, pos) => {
        const m = marks[pos];
        return h(
          'button',
          { class: `tile placed reading${m ? ` ${m}` : ''}`, onclick: () => !locked && ((placed = placed.filter((p) => p !== i)), draw()) },
          m ? mark(m === 'cross' ? 'cross' : 'tick') : null,
          labels[i]!,
        );
      }),
    );
    if (placed.length === 0) line.append(h('span', { class: 'line-hint' }, opts.need === labels.length ? 'Tap the pieces below in order' : `Use ${opts.need} of the pieces below`));
    tray.replaceChildren(
      ...trayOrder.map((i) =>
        h(
          'button',
          {
            class: 'tile reading',
            disabled: placed.includes(i) || locked,
            onclick: () => !locked && (placed.push(i), draw()),
          },
          labels[i]!,
        ),
      ),
    );
    preview.textContent = placed.length && opts.lineClass === 'sentence-line' ? opts.join(placed) : '';
    check.disabled = locked || placed.length !== opts.need;
  };
  draw();
  const same = (a: number | undefined, b: number | undefined) => a !== undefined && b !== undefined && labels[a] === labels[b];
  return {
    el: h('div', { class: 'placer' }, line, tray, h('div', { class: 'actions' }, check)),
    wrong: () => {
      line.classList.remove('shake');
      void line.offsetWidth;
      line.classList.add('shake');
    },
    show: (answer: number[], outcome: Outcome) => {
      locked = true;
      const settle = () => {
        marks = answer.map((a, pos) => (outcome !== 'shown' || same(sent[pos], a) ? 'tick' : 'moved'));
        placed = answer;
        draw();
        line.classList.remove('checked');
        line.classList.add('right');
      };
      if (outcome !== 'shown') return settle();
      placed = sent;
      marks = sent.map((s, pos) => (same(s, answer[pos]) ? 'tick' : 'cross'));
      draw();
      line.classList.add('checked');
      setTimeout(settle, SHOW_CHANGE_MS);
    },
  };
}

function order(body: Extract<Body, { format: 'order' }>, submit: Submit): Widget {
  const p = placer(body.items, {
    lineClass: 'order-line',
    need: body.items.length,
    join: () => '',
    submit: (placed) => submit({ format: 'order', order: placed }),
  });
  return { el: p.el, wrong: p.wrong, reveal: (outcome) => p.show(body.items.map((_, i) => i), outcome) };
}

function build(body: Extract<Body, { format: 'build' }>, submit: Submit): Widget {
  const p = placer(body.tiles, {
    lineClass: 'sentence-line',
    need: piecesNeeded(body),
    join: (placed) => joinTiles(placed.map((i) => body.tiles[i]!)),
    submit: (placed) => submit({ format: 'build', tiles: placed }),
  });
  return { el: p.el, wrong: p.wrong, reveal: (outcome) => p.show(tilesFor(body.tiles, body.accept[0] ?? '') ?? [], outcome) };
}

function sort(body: Extract<Body, { format: 'sort' }>, submit: Submit): Widget {
  const bins: (number | undefined)[] = body.items.map(() => undefined);
  let sent: number[] = [];
  const check = h(
    'button',
    {
      class: 'go',
      disabled: true,
      onclick: () => {
        sent = bins.map((b) => b ?? -1);
        submit({ format: 'sort', bins: sent });
      },
    },
    'CHECK',
  );
  let locked = false;
  const rows = body.items.map((item, i) => {
    const choices = body.bins.map((label, b) =>
      h(
        'button',
        {
          class: 'bin',
          onclick: () => {
            if (locked) return;
            bins[i] = b;
            choices.forEach((c, k) => c.classList.toggle('on', k === b));
            row.classList.remove('crossed');
            check.disabled = bins.some((x) => x === undefined);
          },
        },
        label,
      ),
    );
    const text = h('div', { class: 'reading sort-item' }, readable(item.text));
    const row = h('div', { class: 'sort-row' }, text, h('div', { class: 'bins' }, choices));
    return { row, text, choices };
  });
  const el = h('div', { class: 'sorter' }, rows.map((r) => r.row), h('div', { class: 'actions' }, check));

  const piles = () =>
    h(
      'div',
      { class: 'piles' },
      body.bins.map((label, b) =>
        h(
          'div',
          { class: 'pile' },
          h('div', { class: 'pile-label' }, label),
          body.items.map((item, i) => {
            if (item.bin !== b) return null;
            const moved = sent[i] !== item.bin;
            return h(
              'div',
              { class: `pile-item${moved ? ' moved' : ''}` },
              mark('tick'),
              h('span', { class: 'reading' }, readable(item.text)),
              moved ? h('span', { class: 'moved-tag' }, 'MOVED') : null,
            );
          }),
        ),
      ),
    );

  return {
    el,
    wrong: () => {
      const first = body.items.findIndex((item, i) => bins[i] !== item.bin);
      rows[first]?.row.classList.add('crossed');
    },
    lookNote: () => {
      const n = body.items.filter((item, i) => bins[i] !== item.bin).length;
      return n === 1 ? '1 is in the wrong pile.' : `${n} are in the wrong pile.`;
    },
    reveal: (outcome) => {
      locked = true;
      check.disabled = true;
      rows.forEach((r, i) => {
        const ok = sent[i] === body.items[i]!.bin;
        r.row.classList.remove('crossed', 'right');
        r.row.classList.add(ok ? 'right' : 'crossed');
        r.text.prepend(mark(ok ? 'tick' : 'cross'));
        r.choices.forEach((c) => (c.disabled = true));
      });
      setTimeout(
        () => {
          // Hold the old height so the page doesn't jump when the rows collapse into piles.
          el.style.minHeight = `${el.offsetHeight}px`;
          el.replaceChildren(piles());
        },
        outcome === 'shown' ? SHOW_CHANGE_MS : SETTLE_MS,
      );
    },
  };
}
