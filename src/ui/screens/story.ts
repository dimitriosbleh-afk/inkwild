import { chapters, content } from '../../app/content';
import { readingBand, unlockedChapters } from '../../story/chapters';
import type { App, ScreenView } from '../app';
import { h } from '../dom';
import { readable } from '../speech';

export function storyScreen(app: App, { chapter }: { chapter?: string }): ScreenView {
  const s = app.store.save;
  const open = unlockedChapters(content, s, chapters);
  const read = new Set(s.chaptersRead);
  const back = h('button', { class: 'ghost', onclick: () => (chapter ? app.go({ name: 'story' }) : app.go({ name: 'home' })) }, chapter ? 'LOGBOOK' : 'HOME');
  const c = chapter ? open.find((x) => x.id === chapter) : undefined;

  if (c) {
    const text = c.bands[readingBand(s)];
    const done = h(
      'button',
      {
        class: 'big',
        onclick: () => {
          if (!read.has(c.id)) app.store.update((x) => x.chaptersRead.push(c.id));
          const next = open.find((x) => x.order > c.order && !read.has(x.id) && x.id !== c.id);
          app.go(next ? { name: 'story', chapter: next.id } : { name: 'story' });
        },
      },
      'FINISHED',
    );
    return {
      el: h(
        'div',
        { class: 'centre' },
        h('div', { class: 'row spread', style: 'margin-bottom:12px' }, back, h('div', { class: 'frame' }, `CHAPTER ${c.order}`)),
        h('div', { class: 'panel' }, h('h2', {}, c.title.toUpperCase()), h('div', { class: 'passage reading chapter' }, ...text.split(/\n\s*\n/).map((p) => h('p', {}, readable(p.trim())))), h('div', { class: 'actions' }, done)),
      ),
    };
  }

  const all = [...chapters].sort((a, b) => a.order - b.order);
  return {
    el: h(
      'div',
      { class: 'centre' },
      h('div', { class: 'row spread', style: 'margin-bottom:12px' }, back, h('h2', { style: 'margin:0' }, 'LOGBOOK: MAXX OUT')),
      h(
        'div',
        { class: 'panel route' },
        all.length === 0 ? h('p', { class: 'note' }, 'The story starts soon.') : null,
        ...all.map((x) => {
          const isOpen = open.includes(x);
          return h(
            'button',
            { class: `node ${read.has(x.id) ? 'done' : isOpen ? 'open' : 'locked'}`, style: 'text-align:left;width:100%', disabled: !isOpen, onclick: () => app.go({ name: 'story', chapter: x.id }) },
            h('div', { class: 'dot' }),
            h('div', { class: 'name', style: 'color:var(--ink)' }, isOpen ? `${x.order}. ${x.title}${read.has(x.id) ? '' : '  · NEW'}` : `${x.order}. ???`),
          );
        }),
      ),
    ),
  };
}
