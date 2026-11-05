import '../world.css';
import { chapters, content, crew } from '../../app/content';
import { unreadChapters } from '../../story/chapters';
import { onHomeScreen } from '../../app/persist';
import { today } from '../../app/store';
import { CREW_LOOKS } from '../../art/crew';
import { creatureCanvas } from '../../art/creatures';
import { iconCanvas } from '../../art/icons';
import { drawMap, type MapIsland } from '../../art/map';
import { backupDue } from '../../backup/code';
import type { BranchId } from '../../content/types';
import { isUnlocked, keeperOpen } from '../../core/route';
import { skillProgress } from '../../core/save';
import { activityBranch, alertsFor, charted, goalFor, islandProgress, placeState, type Goal } from '../../world/goal';
import { Scene, type Poi, type PoiKind } from '../../world/scene';
import { themeFor } from '../../world/themes';
import type { App, ScreenView } from '../app';
import { h } from '../dom';

export function continueTo(app: App): void {
  const s = app.store.save;
  if (s.activity) return app.go({ name: 'activity', branch: activityBranch(content, s.activity) });
  const tide = placeState(content, s, 'home', today()).tide;
  if (tide) return app.go({ name: 'activity', branch: tide });
  app.go({ name: 'activity', branch: charted(content, app.lastBranch) ? app.lastBranch : 'sentence' });
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

const STICK_RADIUS = 60;
const DEAD_ZONE = 0.12;
const TAP_MS = 250;
const TAP_PX = 10;
/** World pixels: generous, because a finger covers far more than one sprite. */
const TAP_POI = 14;

/**
 * A floating stick, Minecraft style: it appears wherever the finger lands on the surface and steers the scene.
 * A short, still touch is a tap instead.
 */
function joystick(scene: Scene, surface: HTMLElement, onTap: (clientX: number, clientY: number) => void): HTMLElement {
  const knob = h('div', { class: 'stick-knob' });
  const stick = h('div', { class: 'stick' }, h('div', { class: 'stick-ring' }), knob);
  let held: { id: number; x: number; y: number; t: number; far: number } | null = null;

  surface.addEventListener('pointerdown', (e) => {
    if (held) return;
    e.preventDefault();
    held = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, far: 0 };
    surface.setPointerCapture(e.pointerId);
    stick.style.left = `${e.clientX}px`;
    stick.style.top = `${e.clientY}px`;
    knob.style.transform = '';
    stick.classList.add('on');
  });
  surface.addEventListener('pointermove', (e) => {
    if (!held || e.pointerId !== held.id) return;
    const dx = e.clientX - held.x, dy = e.clientY - held.y, len = Math.hypot(dx, dy);
    held.far = Math.max(held.far, len);
    const clamp = len > STICK_RADIUS ? STICK_RADIUS / len : 1;
    knob.style.transform = `translate(${Math.round(dx * clamp)}px, ${Math.round(dy * clamp)}px)`;
    const m = Math.min(1, len / STICK_RADIUS);
    const speed = (m - DEAD_ZONE) / (1 - DEAD_ZONE);
    scene.steer(m < DEAD_ZONE ? null : { x: (dx / len) * speed, y: (dy / len) * speed });
  });
  const release = (e: PointerEvent) => {
    if (!held || e.pointerId !== held.id) return;
    const tap = e.type === 'pointerup' && e.timeStamp - held.t < TAP_MS && held.far < TAP_PX;
    held = null;
    stick.classList.remove('on');
    scene.steer(null);
    if (tap) onTap(e.clientX, e.clientY);
  };
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) surface.addEventListener(type, release);
  return stick;
}

/** The POI under a tap. Sprites stand above their POI point, so aim a little higher. */
function poiAt(scene: Scene, world: { x: number; y: number }): Poi | undefined {
  const d = (q: Poi) => Math.hypot(q.x - world.x, q.y - 6 - world.y);
  return scene.pois.filter((q) => d(q) < TAP_POI).sort((a, b) => d(a) - d(b))[0];
}

function say(box: HTMLElement, who: string, text: string, buttons: HTMLElement[] = []): void {
  box.replaceChildren(h('div', { class: 'speech pop' }, h('b', {}, who), h('div', { class: 'reading' }, text), buttons.length ? h('div', { class: 'actions' }, buttons) : null));
}

function settingsButton(app: App): HTMLElement {
  return h('button', { class: 'ghost', onclick: () => app.go({ name: 'settings' }) }, iconCanvas('gear', 2), 'SETTINGS');
}

function goalBanner(goal: Goal, go: (() => void) | null): HTMLElement {
  return h('div', { class: 'goal-banner' }, h('b', {}, 'NEXT:'), h('span', { class: 'goal-line' }, goal.line), go ? h('button', { class: 'go', onclick: go }, 'GO') : null);
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
  const st = placeState(content, s, branch, today());
  const goal = goalFor(content, s, branch, today());

  const kinds: PoiKind[] = home ? ['hut', 'board'] : st.open ? ['crew', 'sign', ...(b?.marked ? (['keeper'] as const) : [])] : ['sign'];
  const scene = new Scene(canvas, {
    theme: themeFor(branch),
    ...(s.captain ? { look: s.captain } : {}),
    crewLook: CREW_LOOKS[crewId],
    kinds,
    grass: home ? 1 : st.open ? 3 : 0,
    ...(positions.get(branch) ? { start: positions.get(branch)! } : {}),
  });
  const alerts = alertsFor(content, s, branch, today());
  for (const kind of Object.keys(alerts) as PoiKind[]) scene.setAlert(kind, alerts[kind]);
  scene.setGoal({ kind: goal.kind, label: goal.label });

  const play = () => {
    positions.set(branch, { x: scene.player.x, y: scene.player.y });
    app.go({ name: 'activity', branch: branch as BranchId });
  };
  const battle = () => {
    app.store.dispatch({ type: 'keeper', branch: branch as BranchId });
    play();
  };
  const sailTide = (label: string) => h('button', { class: 'big', onclick: () => app.go({ name: 'activity', branch: st.tide! }) }, label);
  const person = crew[crewId];

  const uses: Record<PoiKind, () => void> = {
    boat: () => {
      positions.delete(branch);
      app.go({ name: 'map' });
    },
    grass: () => {
      if (home && st.tide) return say(speech, 'TIDE QUEST', `Something is stirring on ${content.branch(st.tide).island}. Sail there to find it.`, [sailTide('GO NOW')]);
      if (home) return say(speech, 'THE LONG GRASS', 'Nothing here today. Sail to an island to find wild creatures.');
      if (st.teachDue && !st.midway) return say(speech, person.name.toUpperCase(), "Hey captain! Come and learn a new move first. I'm by the path.");
      play();
    },
    crew: () => {
      if (st.teachDue || st.midway === 'teach') return play();
      say(speech, person.name.toUpperCase(), 'You know every move I can teach right now. Search the long grass for wild creatures!');
    },
    keeper: () => {
      if (!b) return;
      if (s.branches[b.id].keeper) return say(speech, b.keeper.name.toUpperCase(), 'You beat me fair and square. Fancy a rematch?', [h('button', { class: 'big', onclick: battle }, 'REMATCH')]);
      if (keeperOpen(content, s, b.id)) return battle();
      const left = content.skillsOf(b.id).slice(0, b.keeperAfter).filter((sk) => !skillProgress(s, sk.id).mastered).length;
      say(speech, b.keeper.name.toUpperCase(), `Ha! Come back when you've mastered ${left} more move${left === 1 ? '' : 's'}.`);
    },
    sign: () => showRoute(app, speech, branch as BranchId),
    hut: () => app.go({ name: 'guide' }),
    board: () => {
      if (st.tide) return say(speech, 'TIDE QUEST', `Today's tide points to ${content.branch(st.tide).island}. Finish a creature there for double XP.`, [sailTide('SAIL THERE')]);
      say(speech, 'TIDE QUEST', s.tide?.done ? 'Tide quest done for today. Nice work!' : 'No tide quest today.');
    },
  };
  const use = (poi: Poi) => uses[poi.kind]();
  const walkAndUse = (poi: Poi) => scene.walkTo(poi, () => use(poi));

  scene.onNear = (poi) => {
    action.disabled = !poi;
    action.textContent = poi ? (poi.kind === 'grass' && branch === 'workshop' ? 'WRITE' : ACTION_LABEL[poi.kind]) : '·';
    if (!poi) speech.replaceChildren();
  };
  scene.onStep = (poi) => {
    if (poi.alert) use(poi);
  };
  action.addEventListener('click', () => {
    const poi = scene.nearest();
    if (poi) use(poi);
  });

  const stick = joystick(scene, canvas, (x, y) => {
    const world = scene.screenToWorld(x, y);
    const poi = poiAt(scene, world);
    if (poi) walkAndUse(poi);
    else scene.walkTo(world);
  });
  const goalPoi = () => scene.closest(goal.kind);

  const unread = unreadChapters(content, s, chapters).length;
  const title = home ? 'HOME ISLAND' : b!.island.toUpperCase();
  const sub = home ? `${content.branches.filter((x) => s.branches[x.id].keeper).length}/9 BADGES · ${s.daysPlayed} DAYS` : b!.name.toUpperCase();
  el.append(
    stick,
    h(
      'div',
      { class: 'hud top' },
      h(
        'div',
        { class: 'hud-row' },
        h('div', { class: 'chip-hud' }, h('div', { class: 'label' }, title), h('div', {}, sub)),
        h(
          'div',
          { class: 'row' },
          h('button', { class: 'primary', onclick: () => app.go({ name: 'map' }) }, iconCanvas('map', 2), 'MAP'),
          home ? h('button', { class: 'alt', onclick: () => continueTo(app) }, 'QUICK PLAY') : null,
          h('button', { class: 'alt', onclick: () => app.go({ name: 'guide' }) }, 'FIELD GUIDE'),
          h('button', { class: 'alt', onclick: () => app.go({ name: 'story' }) }, 'LOGBOOK', unread > 0 ? h('span', { class: 'tide-tag' }, String(unread)) : null),
          settingsButton(app),
        ),
      ),
      goalBanner(goal, goalPoi() ? () => walkAndUse(goalPoi()!) : null),
    ),
    speech,
    h('div', { class: 'hud bottom controls' }, action),
  );

  if (!tipShown) {
    tipShown = true;
    say(
      speech,
      'HOW TO PLAY',
      home
        ? 'Drag anywhere to walk, or tap where you want to go. Not sure what to do? Read the NEXT box at the top, or tap GO.'
        : 'Drag anywhere to walk, or tap where you want to go. A ! means something is waiting for you. Tap GO to head to your next job.',
    );
    const tip = speech.firstElementChild;
    const closeTip = () => speech.firstElementChild === tip && speech.replaceChildren();
    speech.addEventListener('click', closeTip, { once: true });
    setTimeout(closeTip, 8000);
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
    ...content.branches.map((b) => ({ kind: b.id, x: SPOTS[b.id][0], y: SPOTS[b.id][1], r: SPOTS[b.id][2], charted: charted(content, b.id) })),
  ];
  const at = SPOTS[app.lastBranch] ?? SPOTS.home;
  const el = h('div', { class: 'play' }, canvas);
  const stop = drawMap(canvas, islands, { x: at[0] - at[2] * 0.9, y: at[1] + at[2] * 0.6 });
  const target = (key: BranchId | 'home', name: string, aria: string, go: () => void, fog: boolean, extras: (HTMLElement | null)[] = []) => {
    const [x, y, r] = SPOTS[key];
    return h(
      'button',
      { class: `map-hit${fog ? ' fog' : ''}`, style: `left:${x * 100}%;top:${y * 100}%;width:${r * 260}vw;height:${r * 260}vw`, onclick: go, 'aria-label': aria },
      h('span', { class: 'map-label' }, name, extras),
    );
  };
  const island = (id: BranchId) => {
    const b = content.branch(id);
    const open = charted(content, id);
    const pct = Math.round(islandProgress(content, s, id) * 100);
    const name = b.island.toUpperCase();
    return target(id, name, open ? `${name}, ${pct}% done` : name, () => app.go({ name: 'island', branch: id }), !open, [
      open ? h('span', { class: 'map-pct' }, `${pct}%`) : null,
      s.branches[id].keeper ? iconCanvas('star', 2) : null,
      s.tide?.branch === id && !s.tide.done && open ? h('span', { class: 'tide-tag' }, 'TIDE') : null,
    ]);
  };
  el.append(
    ...content.branches.map((b) => island(b.id)),
    target('home', 'HOME', 'HOME', () => app.go({ name: 'home' }), false),
    h('div', { class: 'hud top' }, h('div', { class: 'hud-row' }, h('div', { class: 'chip-hud' }, h('div', { class: 'label' }, 'THE ARCHIPELAGO'), h('div', {}, 'Tap an island to sail there')), settingsButton(app))),
  );
  return { el, stop };
}
