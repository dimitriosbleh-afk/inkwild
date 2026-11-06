import { content } from '../../app/content';
import { today } from '../../app/store';
import { captainCanvas, GOLDIE_LOOK } from '../../art/captain';
import { creatureCanvas } from '../../art/creatures';
import { iconCanvas } from '../../art/icons';
import { befriended, CHAMPION_WINS } from '../../core/creatures';
import { BATTLE_TO_WIN } from '../../core/game';
import { REVIEW_SIZE, reviewDue } from '../../core/review';
import { activityBranch } from '../../world/goal';
import type { App, ScreenView } from '../app';
import { h } from '../dom';
import { readable } from '../speech';
import '../collect.css';
import { badges } from './guide';

/** Before a Goldie battle: the Student picks which of their Creatures fights. */
export function battleScreen(app: App): ScreenView {
  const s = app.store.save;
  const home = h('button', { class: 'ghost', onclick: () => app.go({ name: 'home' }) }, 'HOME');
  const head = h('div', { class: 'row spread guide-head' }, home, h('h2', { style: 'margin:0' }, 'GOLDIE BATTLE'));
  const goldie = captainCanvas(GOLDIE_LOOK, 6);
  goldie.classList.add('bob');
  const el = h('div', { class: 'centre battle-pick' }, head);

  if (!reviewDue(content, s, today())) {
    el.append(h('div', { class: 'panel' }, h('div', { class: 'row' }, goldie, h('p', { class: 'note' }, readable('The Goldies have run off for today. Come back tomorrow for another battle!')))));
    return { el };
  }

  const fight = (creature: string) => {
    if (app.store.save.activity?.kind !== 'review') app.store.dispatch({ type: 'review', creature });
    const a = app.store.save.activity;
    if (a?.kind === 'review') app.go({ name: 'activity', branch: activityBranch(content, a) });
  };
  const cards = befriended(content, s).map((c) => {
    const art = creatureCanvas(c.creature, { scale: 5, evolved: c.evolved, variant: c.look });
    const record = c.wins >= CHAMPION_WINS ? h('div', { class: 'card-wins' }, iconCanvas('crown', 2), 'CHAMPION') : h('div', { class: 'card-wins' }, `WINS ${c.wins}/${CHAMPION_WINS}`);
    return h('button', { class: 'card caught', onclick: () => fight(c.creature) }, art, h('div', { class: 'card-name' }, c.name.toUpperCase()), h('div', {}, `LV ${c.level}`), badges(c.variants), record);
  });
  el.append(
    h(
      'div',
      { class: 'panel' },
      h(
        'div',
        { class: 'row battle-intro' },
        goldie,
        h(
          'div',
          { class: 'speech' },
          h('b', {}, "MAXX'S GOLDIE"),
          h('div', { class: 'reading' }, readable('Hand over your Creatures! Unless you can beat me…')),
        ),
      ),
      h('p', { class: 'note' }, readable(`${REVIEW_SIZE} rounds. Win ${BATTLE_TO_WIN} to beat it. First try hits hardest. Win ${CHAMPION_WINS} battles with one Creature: CHAMPION!`)),
    ),
    h('div', { class: 'panel' }, h('h3', {}, 'PICK YOUR FIGHTER'), h('div', { class: 'grid' }, cards)),
  );
  return { el };
}
