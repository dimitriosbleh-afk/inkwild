import { content, crew } from '../../app/content';
import { captainCanvas } from '../../art/captain';
import { crewCanvas } from '../../art/crew';
import { creatureCanvas } from '../../art/creatures';
import type { BranchId, Response, Task } from '../../content/types';
import { currentTask, KEEPER_HP, type GameEvent } from '../../core/game';
import type { Activity } from '../../core/save';
import type { App, ScreenView } from '../app';
import { h } from '../dom';
import { passage, widget } from '../formats';
import { burst, shake } from '../fx';
import { readable } from '../speech';
import { nextPrompt, writeScreen } from './write';

export function activityScreen(app: App, { branch }: { branch: BranchId }): ScreenView {
  const store = app.store;
  if (!store.save.activity) {
    const events = store.dispatch({ type: 'begin', branch });
    if (!content.branch(branch).marked && !store.save.activity) {
      const skill = nextPrompt(app);
      if (skill) return writeScreen(app, { skill });
    }
    if (events.some((e) => e.type === 'empty') || !store.save.activity) return charting(app, branch);
  }
  const a = store.save.activity!;
  const back = h('button', { class: 'ghost', onclick: () => leave(app, branch) }, a.kind === 'keeper' ? 'RETREAT' : 'ISLAND');
  const header = h('div', { class: 'row spread' }, back, h('div', { class: 'frame' }, content.branch(branch).island.toUpperCase()));
  const el = h('div', { class: 'centre' }, header);

  if (a.kind === 'teach' && a.step === 0) {
    el.append(iDo(app, branch, a));
    return { el };
  }
  el.append(taskView(app, branch, a));
  return { el };
}

function leave(app: App, branch: BranchId): void {
  if (app.store.save.activity?.kind === 'keeper') app.store.dispatch({ type: 'retreat' });
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

/** Text with **marked** parts lit up, each in its own colour, and every word tappable to hear. */
function lit(text: string): HTMLElement {
  const out = h('div', { class: 'reading show' });
  text.split(/(\*\*[^*]+\*\*)/).forEach((part, i) => {
    if (!part) return;
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) out.append(h('span', { class: `hl hl-${(Math.floor(i / 2) % 3) + 1}` }, readable(m[1]!)));
    else out.append(readable(part));
  });
  return out;
}

function iDo(app: App, branch: BranchId, a: Extract<Activity, { kind: 'teach' }>): HTMLElement {
  const skill = content.skill(a.skill);
  const person = crew[skill.teach.crew];
  const beats = skill.teach.iDo.beats;
  let at = 0;
  const portrait = crewCanvas(skill.teach.crew, 6);
  portrait.classList.add('bob');
  const bubble = h('div', { class: 'speech beat' });
  const dots = h('div', { class: 'dots' });
  const next = h('button', { class: 'big' }, 'NEXT');
  const skip = h('button', { class: 'ghost' }, 'GOT IT, LET ME TRY');
  const go = () => {
    app.store.dispatch({ type: 'advance' });
    app.go({ name: 'activity', branch });
  };
  const draw = () => {
    const beat = beats[at]!;
    bubble.replaceChildren(h('b', {}, person.name.toUpperCase()), h('div', { class: 'reading pop' }, readable(beat.say)), ...(beat.show ? [lit(beat.show)] : []));
    dots.replaceChildren(...beats.map((_, i) => h('i', { class: i <= at ? 'on' : '' })));
    next.textContent = at < beats.length - 1 ? 'NEXT' : 'MY TURN';
  };
  next.addEventListener('click', () => {
    if (at < beats.length - 1) {
      at++;
      draw();
    } else go();
  });
  skip.addEventListener('click', go);
  draw();
  return h(
    'div',
    { class: 'panel teach' },
    h('div', { class: 'frame' }, `NEW MOVE · ${person.name.toUpperCase()} THE ${person.role.toUpperCase()}`),
    h('h2', {}, skill.name.toUpperCase()),
    h('div', { class: 'row teach-row' }, portrait, bubble),
    h('div', { class: 'why' }, h('b', {}, 'WHY: '), readable(skill.why)),
    h('div', { class: 'bar-actions' }, dots, h('div', { class: 'row' }, skip, next)),
  );
}

function taskView(app: App, branch: BranchId, a: Exclude<Activity, { kind: 'teach'; step: 0 }> | Extract<Activity, { kind: 'teach' }>): HTMLElement {
  const store = app.store;
  const task: Task = currentTask(content, a);
  const panel = h('div', { class: 'panel' });
  const feedback = h('div', { class: 'task-foot' });
  let sprite: HTMLCanvasElement | null = null;

  if (a.kind === 'keeper') {
    const b = content.branch(a.branch);
    const skill = content.skill(content.encounter(a.id).skill);
    panel.append(arena(app, a), h('div', { class: 'frame', style: 'color:var(--gold)' }, `${b.keeper.name.toUpperCase()} USES ${skill.name.toUpperCase()}! BLOCK IT RIGHT FIRST TIME FOR A FULL HIT.`));
  }
  else if (a.kind === 'encounter') {
    const skill = content.skill(content.encounter(a.id).skill);
    const p = store.save.skills[skill.id];
    sprite = creatureCanvas(skill.creature.id, { scale: 6, evolved: !!p?.mastered, shiny: store.save.shinies.includes(skill.creature.id) });
    sprite.classList.add('bob');
  } else {
    sprite = crewCanvas(content.skill(a.skill).teach.crew, 4);
    sprite.classList.add('bob');
    panel.append(h('div', { class: 'frame' }, `WE DO · ${crew[content.skill(a.skill).teach.crew].name.toUpperCase()} IS HELPING`));
  }

  const intro = h('div', { style: 'flex:1;min-width:240px' }, task.frame ? h('div', { class: 'frame' }, task.frame) : null);
  panel.append(h('div', { class: 'row', style: 'align-items:flex-start' }, sprite, intro));
  const text = passage(task);
  if (text) panel.append(text);
  panel.append(h('div', { class: 'prompt' }, readable(task.prompt)));
  if (a.kind === 'teach' && 'hint' in task) panel.append(h('div', { class: 'hint' }, `Hint: ${(task as Task & { hint: string }).hint}`));

  const w = widget(task.body, (response: Response) => {
    const events = store.dispatch({ type: 'answer', response });
    react(events);
  });
  panel.append(w.el, feedback);

  const react = (events: GameEvent[]) => {
    for (const e of events) {
      if (e.type === 'continue') {
        w.proceed?.();
        app.sfx('tap');
      }
      if (e.type === 'secondLook') {
        w.wrong();
        app.sfx('look');
        if (sprite) shake(sprite);
        feedback.replaceChildren(h('div', { class: 'feedback look pop' }, h('b', {}, 'SECOND LOOK'), readable(e.reason)));
      }
      if (e.type === 'hit') hit(panel, e.target, e.amount, app);
      if (e.type === 'resolved') {
        w.reveal();
        if (task.body.format === 'choose' && text) {
          const blank = text.querySelector('.blank');
          if (blank) {
            blank.textContent = task.body.options[task.body.answer]!.text;
            blank.classList.add('filled');
          }
        }
        const title = e.outcome === 'first' ? 'SPOT ON!' : e.outcome === 'second' ? 'GOT IT!' : "HERE'S HOW IT GOES";
        const why = e.outcome === 'shown' && e.reason ? [readable(e.reason), h('br'), h('br')] : [];
        const box = h('div', { class: 'feedback good pop' }, h('b', {}, title), ...why, readable(e.success));
        feedback.replaceChildren(box, nextButtons(app, branch, events));
        if (e.outcome !== 'shown') {
          app.sfx('right');
          burst(sprite ?? box);
        }
      }
    }
  };
  return panel;
}

function nextButtons(app: App, branch: BranchId, events: GameEvent[]): HTMLElement {
  const ended = events.find((e) => e.type === 'badge' || e.type === 'retreated');
  const still = app.store.save.activity;
  const row = h('div', { class: 'actions' });
  if (ended || (!still && events.some((e) => e.type === 'taught'))) {
    if (!ended) row.append(h('button', { class: 'big', onclick: () => app.go({ name: 'activity', branch }) }, 'TRY IT FOR REAL'));
    row.append(h('button', { class: ended ? 'big' : 'ghost', onclick: () => app.go({ name: 'island', branch }) }, 'ISLAND'));
    return row;
  }
  if (still) {
    row.append(h('button', { class: 'big', onclick: () => app.go({ name: 'activity', branch }) }, 'NEXT'));
    return row;
  }
  row.append(
    h('button', { class: 'ghost', onclick: () => app.go({ name: 'island', branch }) }, 'ISLAND'),
    h('button', { class: 'big pulse', onclick: () => app.go({ name: 'activity', branch }) }, 'KEEP GOING'),
  );
  return row;
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
