import { content } from '../../app/content';
import { creatureCanvas } from '../../art/creatures';
import { iconCanvas, VARIANT_ICON } from '../../art/icons';
import { fieldGuide, guideCounts, variantHint, type GuideEntry } from '../../core/creatures';
import { VARIANTS, type Variant } from '../../core/save';
import type { App, ScreenView } from '../app';
import { h } from '../dom';
import '../collect.css';

export const VARIANT_LABEL: Record<Variant, string> = { plain: 'PLAIN', shiny: 'SHINY', golden: 'GOLDEN', champion: 'CHAMPION' };

/** The badges for a Creature's rare variants, in a row. */
export function badges(variants: readonly Variant[], scale = 2): HTMLElement | null {
  const rare = variants.filter((v): v is Exclude<Variant, 'plain'> => v !== 'plain');
  return rare.length ? h('div', { class: 'badges', 'aria-label': rare.map((v) => VARIANT_LABEL[v]).join(', ') }, ...rare.map((v) => iconCanvas(VARIANT_ICON[v], scale))) : null;
}

/**
 * The Field Guide: every Creature there is, by Island. Caught ones are in colour with their badges and open up when
 * tapped; the rest are silhouettes that say where to find them.
 */
export function guideScreen(app: App): ScreenView {
  const s = app.store.save;
  const islands = fieldGuide(content, s);
  const n = guideCounts(islands);
  const el = h('div', { class: 'centre guide-screen' });

  const card = (e: GuideEntry): HTMLElement => {
    const island = content.branch(e.branch).island;
    if (e.kind === 'keeper') {
      const art = creatureCanvas(e.creature, { scale: 4, evolved: true });
      if (!e.met) return h('div', { class: 'card unknown' }, art, h('div', { class: 'card-name' }, '???'), h('div', { class: 'card-where' }, `Beat ${e.keeper} to meet it`));
      art.classList.add('bob');
      return h('button', { class: 'card caught', onclick: () => detail(e) }, art, h('div', { class: 'card-name' }, e.name.toUpperCase()), h('span', { class: 'tag keeper-tag' }, 'KEEPER'));
    }
    const c = e.caught;
    if (!c) {
      const art = creatureCanvas(e.creature, { scale: 5 });
      return h('div', { class: 'card unknown' }, art, h('div', { class: 'card-name' }, '???'), h('div', { class: 'card-where' }, `Found on ${island}`));
    }
    const art = creatureCanvas(e.creature, { scale: 5, evolved: c.evolved, variant: c.look });
    art.classList.add('bob');
    const rusty = !c.received && !!s.skills[e.skill.id]?.rusty;
    return h(
      'button',
      { class: 'card caught', onclick: () => detail(e) },
      art,
      h('div', { class: 'card-name' }, c.name.toUpperCase()),
      h('div', {}, `LV ${c.level}`),
      badges(c.variants),
      c.received ? h('span', { class: 'tag', style: 'background:var(--sky)' }, 'SWAP') : null,
      rusty ? h('span', { class: 'tag refresh-tag' }, 'NEEDS A REFRESH') : null,
    );
  };

  const detail = (e: GuideEntry) => {
    const close = () => overlay.remove();
    const body = e.kind === 'keeper' ? keeperDetail(e) : skillDetail(e);
    const overlay = h(
      'div',
      { class: 'overlay guide-detail', onclick: (ev: Event) => ev.target === overlay && close() },
      h('div', { class: 'panel pop' }, ...body, h('div', { class: 'actions', style: 'justify-content:center' }, h('button', { class: 'big', onclick: close }, 'CLOSE'))),
    );
    document.body.append(overlay);
  };

  const keeperDetail = (e: Extract<GuideEntry, { kind: 'keeper' }>): HTMLElement[] => {
    const art = creatureCanvas(e.creature, { scale: 9, evolved: true });
    art.classList.add('bob');
    return [art, h('h2', {}, e.name.toUpperCase()), h('p', { class: 'note' }, `${e.keeper}'s partner. You met it when you beat ${e.keeper} on ${content.branch(e.branch).island}.`)];
  };

  const skillDetail = (e: Extract<GuideEntry, { kind: 'skill' }>): HTMLElement[] => {
    const c = e.caught!;
    const art = creatureCanvas(e.creature, { scale: 9, evolved: c.evolved, variant: c.look });
    art.classList.add('bob');
    const tiles = VARIANTS.map((v) => {
      const have = c.variants.includes(v);
      const small = creatureCanvas(e.creature, { scale: 3, evolved: c.evolved, variant: v });
      const badge = v === 'plain' ? null : iconCanvas(VARIANT_ICON[v], 2);
      return h(
        'div',
        { class: `variant-tile${have ? ' have' : ' missing'}` },
        small,
        h('div', { class: 'variant-name' }, badge, VARIANT_LABEL[v]),
        h('div', { class: 'variant-how' }, have ? 'You have it!' : variantHint(content, s, e.skill, v).replace(/^\w+: /, '')),
      );
    });
    const parts: (HTMLElement | null)[] = [
      art,
      h('h2', {}, c.name.toUpperCase()),
      h('div', { class: 'frame' }, `LV ${c.level}${c.wins ? ` · ${c.wins} GOLDIE WIN${c.wins === 1 ? '' : 'S'}` : ''}`),
      e.skill.creature.blurb ? h('p', { class: 'note' }, e.skill.creature.blurb) : null,
      h('div', { class: 'variants' }, tiles),
    ];
    return parts.filter((x): x is HTMLElement => !!x);
  };

  const counts = h(
    'div',
    { class: 'guide-counts' },
    h('span', {}, `CAUGHT ${n.caught} OF ${n.total}`),
    h('span', { 'aria-label': `${n.shiny} shiny` }, iconCanvas('shiny', 2), String(n.shiny)),
    h('span', { 'aria-label': `${n.golden} golden` }, iconCanvas('golden', 2), String(n.golden)),
    h('span', { 'aria-label': `${n.champion} champion` }, iconCanvas('crown', 2), String(n.champion)),
  );
  el.append(
    h('div', { class: 'row spread guide-head' }, h('button', { class: 'ghost', onclick: () => app.go({ name: 'home' }) }, 'HOME'), h('h2', { style: 'margin:0' }, 'FIELD GUIDE'), h('button', { class: 'alt', onclick: () => app.go({ name: 'swap' }) }, 'SWAP')),
    counts,
    ...islands.map((i) => h('div', { class: 'panel' }, h('h3', {}, i.branch.island.toUpperCase()), h('div', { class: 'grid' }, i.entries.map(card)))),
  );
  return { el, stop: () => document.querySelector('.overlay.guide-detail')?.remove() };
}
