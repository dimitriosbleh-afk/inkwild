import type { Body, Part, Response, Task } from '../content/types';
import { joinTiles, piecesNeeded, taps, tilesFor } from '../core/check';
import { h } from './dom';
import { readable } from './speech';

export interface Widget {
  el: HTMLElement;
  /** Mark the last attempt as wrong; the widget stays usable for the Second look. */
  wrong(): void;
  /** Show the right answer and lock the widget. */
  reveal(): void;
  /** The fix format's tap was on the right spot: show the replacement options. */
  proceed?(): void;
}

type Submit = (r: Response) => void;

export function passage(task: Task, filled?: string): HTMLElement | null {
  if (!task.text) return null;
  const parts = task.text.split('___');
  const out = h('div', { class: 'reading passage' });
  parts.forEach((p, i) => {
    out.append(readable(p));
    if (i < parts.length - 1) out.append(h('span', { class: `blank${filled ? ' filled' : ''}` }, filled ?? ' '));
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
  const buttons: HTMLElement[] = [];
  const el = h('div', { class: 'reading passage' });
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
    lock: (answer: number) =>
      buttons.forEach((b, i) => {
        (b as HTMLButtonElement).disabled = true;
        b.classList.toggle('right', i === answer);
      }),
  };
}

function tapText(body: Extract<Body, { format: 'tapText' }>, submit: Submit): Widget {
  const t = tappableText(body.parts, (tap) => submit({ format: 'tapText', tap }));
  return { el: t.el, wrong: t.wrong, reveal: () => t.lock(body.answer) };
}

function fix(body: Extract<Body, { format: 'fix' }>, submit: Submit): Widget {
  const options = h('div', { class: 'fix-options' });
  const t = tappableText(body.parts, (tap) => submit({ format: 'fix', tap }));
  const c = chips(body.options, (choice) => submit({ format: 'fix', tap: body.spot, choice }));
  let stage: 'spot' | 'choice' = 'spot';
  return {
    el: h('div', {}, t.el, options),
    wrong: () => (stage === 'spot' ? t.wrong() : c.wrong()),
    proceed: () => {
      stage = 'choice';
      t.lock(body.spot);
      const spotText = taps(body.parts)[body.spot]?.tap ?? '';
      options.replaceChildren(h('p', { class: 'hint' }, `Swap "${spotText}" for:`), c.el);
    },
    reveal: () => {
      t.lock(body.spot);
      if (stage === 'spot') {
        const spotText = taps(body.parts)[body.spot]?.tap ?? '';
        options.replaceChildren(h('p', { class: 'hint' }, `Swap "${spotText}" for:`), c.el);
      }
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

/** Shared tap-to-place mechanic for order and build: tap a tile in the tray to place it, tap a placed tile to send it back. */
function placer(
  labels: string[],
  opts: { lineClass: string; need: number; join: (placed: number[]) => string; submit: (placed: number[]) => void },
) {
  const trayOrder = shuffled(labels, true);
  let placed: number[] = [];
  const line = h('div', { class: `line ${opts.lineClass}` });
  const tray = h('div', { class: 'tray' });
  const preview = h('div', { class: 'reading preview' });
  const check = h('button', { class: 'go', onclick: () => opts.submit(placed) }, 'CHECK');
  let locked = false;

  const draw = () => {
    line.replaceChildren(
      ...placed.map((i) =>
        h('button', { class: 'tile placed reading', onclick: () => !locked && ((placed = placed.filter((p) => p !== i)), draw()) }, labels[i]!),
      ),
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
  return {
    el: h('div', { class: 'placer' }, line, tray, h('div', { class: 'actions' }, check)),
    wrong: () => {
      line.classList.remove('shake');
      void line.offsetWidth;
      line.classList.add('shake');
    },
    show: (answer: number[]) => {
      locked = true;
      placed = answer;
      draw();
      line.classList.add('right');
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
  return { el: p.el, wrong: p.wrong, reveal: () => p.show(body.items.map((_, i) => i)) };
}

function build(body: Extract<Body, { format: 'build' }>, submit: Submit): Widget {
  const p = placer(body.tiles, {
    lineClass: 'sentence-line',
    need: piecesNeeded(body),
    join: (placed) => joinTiles(placed.map((i) => body.tiles[i]!)),
    submit: (placed) => submit({ format: 'build', tiles: placed }),
  });
  return { el: p.el, wrong: p.wrong, reveal: () => p.show(tilesFor(body.tiles, body.accept[0] ?? '') ?? []) };
}

function sort(body: Extract<Body, { format: 'sort' }>, submit: Submit): Widget {
  const bins: (number | undefined)[] = body.items.map(() => undefined);
  const check = h('button', { class: 'go', disabled: true, onclick: () => submit({ format: 'sort', bins: bins.map((b) => b ?? -1) }) }, 'CHECK');
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
    const row = h('div', { class: 'sort-row' }, h('div', { class: 'reading sort-item' }, readable(item.text)), h('div', { class: 'bins' }, choices));
    return { row, choices };
  });
  return {
    el: h('div', { class: 'sorter' }, rows.map((r) => r.row), h('div', { class: 'actions' }, check)),
    wrong: () => {
      const first = body.items.findIndex((item, i) => bins[i] !== item.bin);
      rows[first]?.row.classList.add('crossed');
    },
    reveal: () => {
      locked = true;
      check.disabled = true;
      body.items.forEach((item, i) => rows[i]!.choices.forEach((c, k) => c.classList.toggle('on', k === item.bin)));
      rows.forEach((r) => r.row.classList.add('right'));
    },
  };
}
