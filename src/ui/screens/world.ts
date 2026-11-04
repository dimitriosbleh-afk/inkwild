import { content, GAME_TITLE } from '../../app/content';
import { onHomeScreen } from '../../app/persist';
import { today } from '../../app/store';
import { captainCanvas } from '../../art/captain';
import { creatureCanvas } from '../../art/creatures';
import { drawHomeIsland } from '../../art/island';
import { drawMap, type MapIsland } from '../../art/map';
import { backupDue } from '../../backup/code';
import type { BranchId } from '../../content/types';
import { isUnlocked, keeperOpen } from '../../core/route';
import { skillProgress, type Activity } from '../../core/save';
import type { App, ScreenView } from '../app';
import { h } from '../dom';

export function activityBranch(a: Activity): BranchId {
  if (a.kind === 'keeper') return a.branch;
  const skill = a.kind === 'teach' ? a.skill : content.encounter(a.id).skill;
  return content.skill(skill).branch;
}

function ready(branch: BranchId): boolean {
  return content.skillsOf(branch).length > 0;
}

export function continueTo(app: App): void {
  const s = app.store.save;
  if (s.activity) return app.go({ name: 'activity', branch: activityBranch(s.activity) });
  if (s.tide && !s.tide.done && s.tide.day === today() && ready(s.tide.branch)) return app.go({ name: 'activity', branch: s.tide.branch });
  app.go({ name: 'activity', branch: ready(app.lastBranch) ? app.lastBranch : 'sentence' });
}

let backupAskedOn = -1;

export function homeScreen(app: App): ScreenView {
  const s = app.store.save;
  const canvas = h('canvas', { class: 'world' });
  const stop = drawHomeIsland(canvas, s.captain);
  const badges = content.branches.filter((b) => s.branches[b.id].keeper).length;
  const tide = s.tide && ready(s.tide.branch) ? content.branch(s.tide.branch) : undefined;

  const top = h(
    'div',
    { class: 'hud top' },
    h(
      'div',
      { class: 'chip-hud row', style: 'gap:10px' },
      s.captain ? captainCanvas(s.captain, 3) : null,
      h('div', {}, h('div', { class: 'label' }, 'CAPTAIN'), h('div', {}, `★ ${badges}/9  ·  ${s.daysPlayed} DAYS`)),
    ),
    tide
      ? h(
          'button',
          { class: 'chip-hud', style: 'color:var(--ink);text-align:left', onclick: () => app.go({ name: 'activity', branch: tide.id }) },
          h('div', { class: 'label' }, s.tide?.done ? 'TIDE QUEST ✓' : 'TIDE QUEST'),
          h('div', {}, tide.island.toUpperCase()),
        )
      : null,
  );
  const bottom = h(
    'div',
    { class: 'hud bottom' },
    h(
      'div',
      { class: 'row' },
      h('button', { class: 'alt', onclick: () => app.go({ name: 'map' }) }, 'MAP'),
      h('button', { class: 'alt', onclick: () => app.go({ name: 'guide' }) }, 'FIELD GUIDE'),
      h('button', { class: 'ghost', onclick: () => app.go({ name: 'settings' }) }, '⚙'),
    ),
    h('button', { class: 'big pulse', onclick: () => continueTo(app) }, 'CONTINUE'),
  );
  const el = h('div', { style: 'padding:0' }, canvas, top, bottom);

  if (!onHomeScreen() && !sessionStorage.getItem('a2hs')) {
    el.append(prompt('ADD ME TO YOUR HOME SCREEN', 'Tap the Share button, then "Add to Home Screen". Then open me from there. If you skip this, Safari can delete your progress after a week away.', 'GOT IT', () => sessionStorage.setItem('a2hs', '1')));
  } else if (backupDue(s, today()) && backupAskedOn !== today()) {
    backupAskedOn = today();
    el.append(
      prompt('TIME FOR YOUR BACKUP CODE', 'Copy this week’s code into your book, so your creatures are safe even if your iPad gets wiped.', 'DO IT NOW', () => app.go({ name: 'backup' }), 'LATER'),
    );
  }
  return { el, stop };
}

function prompt(title: string, body: string, yes: string, onYes: () => void, no?: string): HTMLElement {
  const o = h('div', { class: 'overlay' });
  o.append(
    h(
      'div',
      { class: 'panel pop' },
      h('h2', {}, title),
      h('p', { class: 'note' }, body),
      h(
        'div',
        { class: 'actions', style: 'justify-content:center' },
        no ? h('button', { class: 'ghost', onclick: () => o.remove() }, no) : null,
        h('button', { class: 'big', onclick: () => (o.remove(), onYes()) }, yes),
      ),
    ),
  );
  return o;
}

const SPOTS: Record<BranchId | 'home', [number, number, number]> = {
  between: [0.2, 0.17, 0.09],
  whose: [0.52, 0.1, 0.075],
  convince: [0.82, 0.2, 0.085],
  pictures: [0.82, 0.45, 0.08],
  sentence: [0.72, 0.7, 0.075],
  punctuation: [0.22, 0.42, 0.06],
  structure: [0.2, 0.7, 0.09],
  editing: [0.45, 0.88, 0.085],
  workshop: [0.8, 0.9, 0.07],
  home: [0.5, 0.48, 0.1],
};

export function mapScreen(app: App): ScreenView {
  const s = app.store.save;
  const canvas = h('canvas', { class: 'world' });
  const islands: MapIsland[] = [
    { kind: 'home', x: SPOTS.home[0], y: SPOTS.home[1], r: SPOTS.home[2], charted: true },
    ...content.branches.map((b) => ({ kind: b.id, x: SPOTS[b.id][0], y: SPOTS[b.id][1], r: SPOTS[b.id][2], charted: ready(b.id) })),
  ];
  const at = SPOTS[app.lastBranch] ?? SPOTS.home;
  const stop = drawMap(canvas, islands, { x: at[0] - at[2] * 0.9, y: at[1] + at[2] * 0.6 });
  const labels = content.branches.map((b) => {
    const [x, y, r] = SPOTS[b.id];
    const has = ready(b.id);
    const tideHere = s.tide?.branch === b.id && !s.tide.done && has;
    return h(
      'button',
      {
        class: `map-label${has ? '' : ' fog'}`,
        style: `left:${x * 100}%;top:calc(${(y + r * 0.62) * 100}%)`,
        onclick: () => app.go({ name: 'island', branch: b.id }),
      },
      s.branches[b.id].keeper ? '★ ' : '',
      b.island.toUpperCase(),
      tideHere ? h('span', { class: 'tide-tag' }, 'TIDE') : null,
    );
  });
  const home = h('button', { class: 'map-label', style: `left:50%;top:${(SPOTS.home[1] + SPOTS.home[2] * 0.62) * 100}%`, onclick: () => app.go({ name: 'home' }) }, 'HOME');
  const el = h('div', { style: 'padding:0' }, canvas, ...labels, home, h('div', { class: 'hud top' }, h('div', { class: 'chip-hud' }, h('div', { class: 'label' }, 'THE ARCHIPELAGO'), h('div', {}, 'Tap an island to sail there'))));
  return { el, stop };
}

export function islandScreen(app: App, { branch }: { branch: BranchId }): ScreenView {
  const s = app.store.save;
  const b = content.branch(branch);
  const skills = content.skillsOf(branch);
  const route = h('div', { class: 'route' });
  skills.forEach((skill, i) => {
    if (b.marked && i === b.keeperAfter) route.append(keeperNode(app, branch));
    const p = skillProgress(s, skill.id);
    const open = isUnlocked(content, s, skill.id);
    const known = p.done > 0;
    route.append(
      h(
        'div',
        { class: `node ${p.mastered ? 'done' : open ? 'open' : 'locked'}` },
        h('div', { class: 'dot' }),
        known ? creatureCanvas(skill.creature.id, { scale: 2, evolved: p.mastered, shiny: s.shinies.includes(skill.creature.id) }) : null,
        h('div', { class: 'name' }, open ? skill.name : '???'),
      ),
    );
  });
  if (b.marked && skills.length > 0 && skills.length <= b.keeperAfter) route.append(keeperNode(app, branch));

  const banner = h('canvas', { class: 'banner' });
  const el = h(
    'div',
    { class: 'centre' },
    h('div', { class: 'row spread' }, h('button', { class: 'ghost', onclick: () => app.go({ name: 'map' }) }, 'MAP'), h('button', { class: 'ghost', onclick: () => app.go({ name: 'home' }) }, 'HOME')),
    banner,
    h(
      'div',
      { class: 'panel' },
      h('div', { class: 'frame' }, b.name.toUpperCase()),
      h('h1', {}, b.island.toUpperCase()),
      ready(branch)
        ? h('div', { class: 'actions', style: 'justify-content:flex-start' }, h('button', { class: 'big pulse', onclick: () => app.go({ name: 'activity', branch }) }, s.activity && activityBranch(s.activity) === branch ? 'CARRY ON' : 'EXPLORE'))
        : h('p', { class: 'note' }, 'The crew is still charting this island. Check back soon.'),
    ),
    ready(branch) ? h('div', { class: 'panel' }, h('h3', {}, 'YOUR ROUTE'), route) : null,
  );
  let stop = () => {};
  requestAnimationFrame(() => {
    stop = drawMap(banner, [{ kind: branch, x: 0.5, y: 0.5, r: 0.2, charted: true }], { x: 0.3, y: 0.72 });
  });
  return { el, stop: () => stop() };
}

function keeperNode(app: App, branch: BranchId): HTMLElement {
  const s = app.store.save;
  const b = content.branch(branch);
  const beaten = s.branches[branch].keeper;
  const open = keeperOpen(content, s, branch);
  return h(
    'div',
    { class: `node ${beaten ? 'done' : open ? 'open' : 'locked'}` },
    h('div', { class: 'dot' }),
    h('div', { class: 'name', style: 'flex:1' }, beaten ? `★ ${b.keeper.name} beaten` : `Keeper: ${b.keeper.name}`),
    open && !s.activity
      ? h(
          'button',
          {
            class: beaten ? 'ghost' : 'big',
            onclick: () => {
              app.store.dispatch({ type: 'keeper', branch });
              app.go({ name: 'activity', branch });
            },
          },
          beaten ? 'REMATCH' : 'BATTLE!',
        )
      : null,
  );
}

export { GAME_TITLE };
