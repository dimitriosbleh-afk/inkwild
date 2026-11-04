import { content, crew } from '../../app/content';
import { onHomeScreen } from '../../app/persist';
import { today } from '../../app/store';
import { CREW_LOOKS } from '../../art/crew';
import { creatureCanvas } from '../../art/creatures';
import { drawMap, type MapIsland } from '../../art/map';
import { backupDue } from '../../backup/code';
import type { BranchId } from '../../content/types';
import { isUnlocked, keeperOpen, unlockedSkills } from '../../core/route';
import { skillProgress, type Activity } from '../../core/save';
import { Scene, type Dir, type Poi, type PoiKind } from '../../world/scene';
import { themeFor } from '../../world/themes';
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

/** Where the captain was standing on each Island, so coming back from an Encounter doesn't reset the walk. */
const positions = new Map<string, { x: number; y: number }>();
let backupAskedOn = -1;
let tipShown = false;

const ACTION_LABEL: Record<PoiKind, string> = {
  grass: 'SEARCH',
  crew: 'TALK',
  keeper: 'BATTLE',
  boat: 'SAIL',
  sign: 'READ',
  hut: 'ENTER',
  board: 'READ',
};

function dpad(scene: Scene): HTMLElement {
  const pad = h('div', { class: 'dpad' });
  const arrows: [Dir, string][] = [['up', '▲'], ['left', '◀'], ['right', '▶'], ['down', '▼']];
  for (const [dir, glyph] of arrows) {
    const b = h('button', { class: `pad-${dir}`, 'aria-label': `walk ${dir}` }, glyph);
    const press = (e: Event) => {
      e.preventDefault();
      scene.hold(dir);
      b.classList.add('down');
    };
    const release = (e: Event) => {
      e.preventDefault();
      scene.hold(null);
      b.classList.remove('down');
    };
    b.addEventListener('pointerdown', press);
    b.addEventListener('pointerup', release);
    b.addEventListener('pointercancel', release);
    b.addEventListener('pointerleave', release);
    pad.append(b);
  }
  return pad;
}

function say(box: HTMLElement, who: string, text: string, buttons: HTMLElement[] = []): void {
  box.replaceChildren(h('div', { class: 'speech pop' }, h('b', {}, who), h('div', { class: 'reading' }, text), buttons.length ? h('div', { class: 'actions' }, buttons) : null));
}

export function islandScreen(app: App, { branch }: { branch: BranchId | 'home' }): ScreenView {
  const s = app.store.save;
  const home = branch === 'home';
  const b = home ? undefined : content.branch(branch);
  const canvas = h('canvas', { class: 'world' });
  const speech = h('div', { class: 'speech-box' });
  const action = h('button', { class: 'action', disabled: true }, '·');
  const el = h('div', { class: 'play' }, canvas);
  const firstSkill = b ? content.skillsOf(b.id)[0] : undefined;
  const crewId = firstSkill?.teach.crew ?? 'nav';
  const open = !home && ready(branch as BranchId);

  const kinds: PoiKind[] = home ? ['hut', 'board'] : open ? ['crew', 'sign', ...(b?.marked ? (['keeper'] as const) : [])] : ['sign'];
  const scene = new Scene(canvas, {
    theme: themeFor(branch),
    ...(s.captain ? { look: s.captain } : {}),
    crewLook: CREW_LOOKS[crewId],
    kinds,
    grass: home ? 1 : open ? 3 : 0,
    ...(positions.get(branch) ? { start: positions.get(branch)! } : {}),
  });

  const teachDue = () => open && unlockedSkills(content, s, branch as BranchId).some((sk) => !skillProgress(s, sk.id).taught);
  const tideOpen = () => !!(s.tide && !s.tide.done && s.tide.day === today() && ready(s.tide.branch));
  const keeperReady = () => open && keeperOpen(content, s, branch as BranchId) && !s.branches[branch as BranchId].keeper;
  const midway = () => !!s.activity && !home && activityBranch(s.activity) === branch;
  scene.setAlert('crew', teachDue() || (midway() && s.activity?.kind === 'teach'));
  scene.setAlert('grass', home ? tideOpen() : open && (!teachDue() || (midway() && s.activity?.kind !== 'teach')));
  scene.setAlert('keeper', keeperReady());

  const play = () => {
    positions.set(branch, { x: scene.player.x, y: scene.player.y });
    app.go({ name: 'activity', branch: branch as BranchId });
  };
  const battle = () => {
    app.store.dispatch({ type: 'keeper', branch: branch as BranchId });
    play();
  };

  const use = (poi: Poi) => {
    const person = crew[crewId];
    switch (poi.kind) {
      case 'boat':
        positions.delete(branch);
        return app.go({ name: 'map' });
      case 'grass':
        if (home) {
          if (tideOpen()) return say(speech, 'TIDE QUEST', `Something is stirring on ${content.branch(s.tide!.branch).island}. Sail there to find it.`, [h('button', { class: 'big', onclick: () => app.go({ name: 'activity', branch: s.tide!.branch }) }, 'GO NOW')]);
          return say(speech, 'THE LONG GRASS', 'Nothing here today. Sail to an island to find wild creatures.');
        }
        if (teachDue() && !midway()) return say(speech, person.name.toUpperCase(), "Hey captain! Come and learn a new move first. I'm by the path.");
        return play();
      case 'crew':
        if (teachDue() || (midway() && s.activity?.kind === 'teach')) return play();
        return say(speech, person.name.toUpperCase(), 'You know every move I can teach right now. Search the long grass for wild creatures!');
      case 'keeper': {
        if (!b) return;
        if (s.branches[b.id].keeper) return say(speech, b.keeper.name.toUpperCase(), 'You beat me fair and square. Fancy a rematch?', [h('button', { class: 'big', onclick: battle }, 'REMATCH')]);
        if (keeperOpen(content, s, b.id)) return battle();
        const left = content.skillsOf(b.id).slice(0, b.keeperAfter).filter((sk) => !skillProgress(s, sk.id).mastered).length;
        return say(speech, b.keeper.name.toUpperCase(), `Ha! Come back when you've mastered ${left} more move${left === 1 ? '' : 's'}.`);
      }
      case 'sign':
        return showRoute(app, speech, branch as BranchId);
      case 'hut':
        return app.go({ name: 'guide' });
      case 'board':
        if (tideOpen()) return say(speech, 'TIDE QUEST', `Today's tide points to ${content.branch(s.tide!.branch).island}. Finish a creature there for double XP.`, [h('button', { class: 'big', onclick: () => app.go({ name: 'activity', branch: s.tide!.branch }) }, 'SAIL THERE')]);
        return say(speech, 'TIDE QUEST', s.tide?.done ? 'Tide quest done for today. Nice work!' : 'No tide quest today.');
    }
  };

  scene.onNear = (poi) => {
    action.disabled = !poi;
    action.textContent = poi ? ACTION_LABEL[poi.kind] : '·';
    if (!poi) speech.replaceChildren();
  };
  scene.onStep = (poi) => {
    if (poi.alert) use(poi);
  };
  action.addEventListener('click', () => {
    const poi = scene.nearest();
    if (poi) use(poi);
  });

  const title = home ? 'HOME ISLAND' : b!.island.toUpperCase();
  const sub = home ? `${content.branches.filter((x) => s.branches[x.id].keeper).length}/9 BADGES · ${s.daysPlayed} DAYS` : b!.name.toUpperCase();
  el.append(
    h(
      'div',
      { class: 'hud top' },
      h('div', { class: 'chip-hud' }, h('div', { class: 'label' }, title), h('div', {}, sub)),
      h(
        'div',
        { class: 'row' },
        home ? h('button', { class: 'alt', onclick: () => continueTo(app) }, 'QUICK PLAY') : h('button', { class: 'alt', onclick: () => app.go({ name: 'map' }) }, 'MAP'),
        h('button', { class: 'alt', onclick: () => app.go({ name: 'guide' }) }, 'FIELD GUIDE'),
        h('button', { class: 'ghost', onclick: () => app.go({ name: 'settings' }) }, '⚙ SETTINGS'),
      ),
    ),
    speech,
    h('div', { class: 'hud bottom controls' }, dpad(scene), action),
  );

  if (!tipShown) {
    tipShown = true;
    say(
      speech,
      'HOW TO PLAY',
      home
        ? 'Walk with the arrows. The big button uses things. Walk onto the dock and tap SAIL to visit an island.'
        : 'Walk with the arrows. A ! means something is waiting for you. Walk into long grass with a ! to find a creature.',
    );
  }
  if (home && !onHomeScreen() && !sessionStorage.getItem('a2hs')) {
    el.append(prompt('ADD ME TO YOUR HOME SCREEN', 'Tap Share, then "Add to Home Screen". Open me from there, or Safari may delete your progress after a week away.', 'GOT IT', () => sessionStorage.setItem('a2hs', '1')));
  } else if (home && backupDue(s, today()) && backupAskedOn !== today()) {
    backupAskedOn = today();
    el.append(prompt('TIME FOR YOUR BACKUP CODE', 'Copy this week’s code into your book, so your creatures are safe even if your iPad gets wiped. You can always find it in Settings.', 'DO IT NOW', () => app.go({ name: 'backup' }), 'LATER'));
  }

  scene.start();
  return {
    el,
    stop: () => {
      positions.set(branch, { x: scene.player.x, y: scene.player.y });
      scene.stop();
    },
  };
}

export function homeScreen(app: App): ScreenView {
  return islandScreen(app, { branch: 'home' });
}

function prompt(title: string, body: string, yes: string, onYes: () => void, no?: string): HTMLElement {
  const o = h('div', { class: 'overlay' });
  o.append(
    h(
      'div',
      { class: 'panel pop' },
      h('h2', {}, title),
      h('p', { class: 'note' }, body),
      h('div', { class: 'actions', style: 'justify-content:center' }, no ? h('button', { class: 'ghost', onclick: () => o.remove() }, no) : null, h('button', { class: 'big', onclick: () => (o.remove(), onYes()) }, yes)),
    ),
  );
  return o;
}

function showRoute(app: App, box: HTMLElement, branch: BranchId): void {
  const s = app.store.save;
  const b = content.branch(branch);
  const skills = content.skillsOf(branch);
  const rows: HTMLElement[] = [];
  skills.forEach((skill, i) => {
    if (b.marked && i === b.keeperAfter) {
      rows.push(h('div', { class: `node ${s.branches[branch].keeper ? 'done' : keeperOpen(content, s, branch) ? 'open' : 'locked'}` }, h('div', { class: 'dot' }), h('div', { class: 'name' }, `Keeper: ${b.keeper.name}`)));
    }
    const p = skillProgress(s, skill.id);
    const isOpen = isUnlocked(content, s, skill.id);
    rows.push(
      h(
        'div',
        { class: `node ${p.mastered ? 'done' : isOpen ? 'open' : 'locked'}` },
        h('div', { class: 'dot' }),
        p.done > 0 ? creatureCanvas(skill.creature.id, { scale: 2, evolved: p.mastered, shiny: s.shinies.includes(skill.creature.id) }) : null,
        h('div', { class: 'name' }, isOpen ? skill.name : '???'),
      ),
    );
  });
  box.replaceChildren(
    h(
      'div',
      { class: 'speech route-panel pop' },
      h('b', {}, `${b.island.toUpperCase()}: YOUR MOVES`),
      skills.length ? h('div', { class: 'route' }, rows) : h('div', { class: 'reading' }, 'The crew is still charting this island. Check back soon.'),
      h('div', { class: 'actions' }, h('button', { class: 'ghost', onclick: () => box.replaceChildren() }, 'CLOSE')),
    ),
  );
}

const SPOTS: Record<BranchId | 'home', [number, number, number]> = {
  between: [0.2, 0.17, 0.09],
  whose: [0.52, 0.12, 0.075],
  convince: [0.82, 0.2, 0.085],
  pictures: [0.82, 0.44, 0.08],
  sentence: [0.72, 0.65, 0.075],
  punctuation: [0.22, 0.42, 0.06],
  structure: [0.2, 0.65, 0.085],
  editing: [0.43, 0.78, 0.08],
  workshop: [0.78, 0.8, 0.065],
  home: [0.5, 0.44, 0.1],
};

export function mapScreen(app: App): ScreenView {
  const s = app.store.save;
  const canvas = h('canvas', { class: 'world' });
  const islands: MapIsland[] = [
    { kind: 'home', x: SPOTS.home[0], y: SPOTS.home[1], r: SPOTS.home[2], charted: true },
    ...content.branches.map((b) => ({ kind: b.id, x: SPOTS[b.id][0], y: SPOTS[b.id][1], r: SPOTS[b.id][2], charted: ready(b.id) })),
  ];
  const at = SPOTS[app.lastBranch] ?? SPOTS.home;
  const el = h('div', { class: 'play' }, canvas);
  const stop = drawMap(canvas, islands, { x: at[0] - at[2] * 0.9, y: at[1] + at[2] * 0.6 });
  const target = (key: BranchId | 'home', label: string, go: () => void, fog: boolean, extra?: HTMLElement | null) => {
    const [x, y, r] = SPOTS[key];
    return h(
      'button',
      { class: `map-hit${fog ? ' fog' : ''}`, style: `left:${x * 100}%;top:${y * 100}%;width:${r * 260}vw;height:${r * 260}vw`, onclick: go, 'aria-label': label },
      h('span', { class: 'map-label' }, label, extra ?? null),
    );
  };
  el.append(
    ...content.branches.map((b) =>
      target(
        b.id,
        `${s.branches[b.id].keeper ? '★ ' : ''}${b.island.toUpperCase()}`,
        () => app.go({ name: 'island', branch: b.id }),
        !ready(b.id),
        s.tide?.branch === b.id && !s.tide.done && ready(b.id) ? h('span', { class: 'tide-tag' }, 'TIDE') : null,
      ),
    ),
    target('home', 'HOME', () => app.go({ name: 'home' }), false),
    h('div', { class: 'hud top' }, h('div', { class: 'chip-hud' }, h('div', { class: 'label' }, 'THE ARCHIPELAGO'), h('div', {}, 'Tap an island to sail there')), h('button', { class: 'ghost', onclick: () => app.go({ name: 'settings' }) }, '⚙ SETTINGS')),
  );
  return { el, stop };
}
