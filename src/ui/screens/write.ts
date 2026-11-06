import { content } from '../../app/content';
import type { SkillId } from '../../content/types';
import { isUnlocked } from '../../core/route';
import type { Piece, Sentence } from '../../core/save';
import type { App, ScreenView } from '../app';
import { h } from '../dom';
import { readable } from '../speech';

const draftKey = (skill: SkillId) => `inkwild.draft.${skill}`;

/** The newest Story workshop prompt the Student can write for now. */
export function nextPrompt(app: App): SkillId | undefined {
  const s = app.store.save;
  const open = content.skillsOf('workshop').filter((sk) => isUnlocked(content, s, sk.id));
  return (open.find((sk) => !s.skills[sk.id]?.mastered) ?? open.at(-1))?.id;
}

/** Full-screen, large text, so a proud Student can walk the iPad over to the teacher. */
export function showMyTeacher(piece: Pick<Piece, 'title' | 'text'>): void {
  const o = h(
    'div',
    { class: 'teacher-view', onclick: () => o.remove() },
    h('h1', {}, piece.title),
    ...piece.text.split(/\n+/).map((p) => h('p', {}, p)),
    h('div', { class: 'frame' }, 'TAP ANYWHERE TO CLOSE'),
  );
  document.body.append(o);
}

export function writeScreen(app: App, { skill }: { skill: SkillId }): ScreenView {
  const sk = content.skill(skill);
  const w = sk.workshop!;
  const title = h('input', { class: 'title-in', placeholder: 'Give it a title', maxlength: '60' });
  title.value = localStorage.getItem(`${draftKey(skill)}.title`) ?? '';
  const text = h('textarea', { class: 'piece', placeholder: 'Start writing here...' });
  text.value = localStorage.getItem(draftKey(skill)) ?? '';
  const keepDraft = () => {
    localStorage.setItem(draftKey(skill), text.value);
    localStorage.setItem(`${draftKey(skill)}.title`, title.value);
  };
  text.addEventListener('input', keepDraft);
  title.addEventListener('input', keepDraft);
  const ticks = w.checklist.map((item) => {
    const box = h('input', { type: 'checkbox' });
    return { box, row: h('label', { class: 'tick reading' }, box, ' ', item) };
  });
  const toIsland = () => app.go({ name: 'island', branch: 'workshop' });
  const finish = h('button', { class: 'big' }, "I'M FINISHED");
  const el = h(
    'div',
    { class: 'centre' },
    h('div', { class: 'row spread', style: 'margin-bottom:12px' }, h('button', { class: 'ghost', onclick: toIsland }, 'ISLAND'), h('div', { class: 'frame' }, 'STORY WORKSHOP · NEVER MARKED')),
    h('div', { class: 'panel' }, h('h2', {}, sk.name.toUpperCase()), h('div', { class: 'passage reading' }, readable(w.mentor)), h('div', { class: 'prompt' }, readable(w.ask))),
    h('div', { class: 'panel' }, title, text, h('h3', { style: 'margin-top:14px' }, 'MY CHECKLIST'), ...ticks.map((t) => t.row), h('div', { class: 'actions' }, finish)),
  );
  finish.addEventListener('click', () => {
    if (!text.value.trim()) return text.focus();
    app.store.dispatch({ type: 'piece', skill, title: title.value, text: text.value, ticks: ticks.map((t) => t.box.checked) });
    const done = { title: title.value.trim() || sk.name, text: text.value };
    localStorage.removeItem(draftKey(skill));
    localStorage.removeItem(`${draftKey(skill)}.title`);
    el.replaceChildren(
      h(
        'div',
        { class: 'panel pop' },
        h('h2', {}, 'PIECE FINISHED!'),
        h('p', { class: 'note' }, 'It is saved on your iPad. Nobody marks it. Want to show someone?'),
        h('div', { class: 'actions' }, h('button', { class: 'ghost', onclick: toIsland }, 'ISLAND'), h('button', { class: 'big', onclick: () => showMyTeacher(done) }, 'SHOW MY TEACHER')),
      ),
    );
  });
  return { el };
}

/** Write your own sentences, one group per Skill, newest Skill first. */
function sentenceGroups(sentences: Sentence[]): { skill: SkillId; texts: string[] }[] {
  const groups = new Map<SkillId, string[]>();
  for (const s of [...sentences].reverse()) groups.set(s.skill, [...(groups.get(s.skill) ?? []), s.text]);
  return [...groups].map(([skill, texts]) => ({ skill, texts }));
}

export function piecesScreen(app: App): ScreenView {
  const pieces = [...app.store.save.pieces].reverse();
  const groups = sentenceGroups(app.store.save.sentences);
  const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
  const row = (label: string, open: () => void) =>
    h('button', { class: 'node open', style: 'width:100%;text-align:left', onclick: open }, h('div', { class: 'dot' }), h('div', { class: 'name', style: 'color:var(--ink)' }, label));
  return {
    el: h(
      'div',
      { class: 'centre' },
      h('div', { class: 'row spread', style: 'margin-bottom:12px' }, h('button', { class: 'ghost', onclick: () => app.go({ name: 'settings' }) }, 'BACK'), h('h2', { style: 'margin:0' }, 'MY WRITING')),
      pieces.length === 0 && groups.length === 0
        ? h('div', { class: 'panel' }, h('p', { class: 'note' }, 'Nothing yet. Learn a move on any island and write a sentence with it, or sail to Inkwell Bay to write a story.'))
        : null,
      pieces.length > 0 ? h('div', { class: 'panel route' }, h('h3', {}, 'MY STORIES'), ...pieces.map((p) => row(`${p.title} · ${words(p.text)} words`, () => showMyTeacher(p)))) : null,
      groups.length > 0
        ? h(
            'div',
            { class: 'panel route' },
            h('h3', {}, 'MY SENTENCES'),
            ...groups.flatMap((g) => {
              const name = content.skill(g.skill).name;
              return [h('div', { class: 'frame' }, name.toUpperCase()), ...g.texts.map((text) => row(text, () => showMyTeacher({ title: name, text })))];
            }),
          )
        : null,
    ),
  };
}
