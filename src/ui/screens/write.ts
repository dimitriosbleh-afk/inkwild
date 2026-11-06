import { content } from '../../app/content';
import type { SkillId } from '../../content/types';
import { isUnlocked } from '../../core/route';
import type { Marks, Piece, Sentence } from '../../core/save';
import type { App, ScreenView } from '../app';
import { h } from '../dom';
import { checkFlow, markedText, markKey } from '../marking';
import { readable } from '../speech';
import '../task.css';

const draftKey = (skill: SkillId) => `inkwild.draft.${skill}`;

/** The newest Story workshop prompt the Student can write for now. */
export function nextPrompt(app: App): SkillId | undefined {
  const s = app.store.save;
  const open = content.skillsOf('workshop').filter((sk) => isUnlocked(content, s, sk.id));
  return (open.find((sk) => !s.skills[sk.id]?.mastered) ?? open.at(-1))?.id;
}

/** What showMyTeacher shows: the writing, and the words the Student tapped for each of its `checks`. */
export interface Shown {
  title: string;
  text: string;
  marks: Marks;
  checks: string[];
}

/**
 * Full-screen, large text, so a proud Student can walk the iPad over to the teacher. The words they tapped for each
 * check are lit, with a key saying which colour shows which check.
 */
export function showMyTeacher(piece: Shown): void {
  const o = h(
    'div',
    { class: 'teacher-view', onclick: () => o.remove() },
    h('h1', {}, piece.title),
    ...markedText(piece.text, piece.marks),
    markKey(piece.checks, piece.marks),
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
  const toIsland = () => app.go({ name: 'island', branch: 'workshop' });
  const finish = h('button', { class: 'big' }, "I'M FINISHED");
  const head = h('div', { class: 'row spread', style: 'margin-bottom:12px' }, h('button', { class: 'ghost', onclick: toIsland }, 'ISLAND'), h('div', { class: 'frame' }, 'STORY WORKSHOP · NEVER MARKED'));
  // The checklist sits above the writing box, so I'M FINISHED is right under it when the keyboard is up.
  const checklist = h('div', { class: 'workshop-checklist' }, h('h3', {}, 'MY CHECKLIST'), w.checklist.map((item, i) => h('div', { class: 'write-check' }, h('span', { class: 'check-num' }, String(i + 1)), h('div', { class: 'reading' }, readable(item)))));
  const editing = [
    head,
    h('div', { class: 'panel' }, h('h2', {}, sk.name.toUpperCase()), h('div', { class: 'passage reading' }, readable(w.mentor)), h('div', { class: 'prompt' }, readable(w.ask))),
    h('div', { class: 'panel' }, checklist, title, text, h('div', { class: 'actions' }, finish)),
  ];
  const el = h('div', { class: 'centre workshop-screen' }, ...editing);
  const named = () => title.value.trim() || sk.name;

  const save = (marks: Marks) => {
    app.store.dispatch({ type: 'piece', skill, title: title.value, text: text.value, marks });
    const done: Shown = { title: named(), text: text.value, marks, checks: w.checklist };
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
  };

  /** Read it back: the piece, then each checklist item in turn, with the words that show it tapped. */
  const readBack = () => {
    text.blur();
    if (!w.checklist.length) return save([]);
    el.replaceChildren(
      head,
      h(
        'div',
        { class: 'panel read-back pop' },
        h('h2', {}, 'READ IT BACK'),
        h('p', { class: 'note' }, 'Read your piece from the top, the way a reader would. Then show where it does each thing on your checklist.'),
        checkFlow({
          text: text.value,
          items: w.checklist,
          line: 'Tap the words in your piece that show this:',
          gate: false,
          above: h('h3', { class: 'read-back-title' }, named()),
          back: { label: 'CHANGE SOMETHING', go: change },
          finish: { label: "IT'S READY", go: save },
        }),
      ),
    );
    scrollTo(0, 0);
  };
  const change = () => {
    el.replaceChildren(...editing);
    text.focus();
    text.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  finish.addEventListener('click', () => {
    if (!text.value.trim()) return text.focus();
    readBack();
  });
  return { el };
}

/** Write your own sentences, one group per Skill, newest Skill first. */
function sentenceGroups(sentences: Sentence[]): { skill: SkillId; sentences: Sentence[] }[] {
  const groups = new Map<SkillId, Sentence[]>();
  for (const s of [...sentences].reverse()) groups.set(s.skill, [...(groups.get(s.skill) ?? []), s]);
  return [...groups].map(([skill, sentences]) => ({ skill, sentences }));
}

const pieceShown = (p: Piece): Shown => ({ title: p.title, text: p.text, marks: p.marks, checks: content.skill(p.skill).workshop?.checklist ?? [] });

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
      pieces.length > 0 ? h('div', { class: 'panel route' }, h('h3', {}, 'MY STORIES'), ...pieces.map((p) => row(`${p.title} · ${words(p.text)} words`, () => showMyTeacher(pieceShown(p))))) : null,
      groups.length > 0
        ? h(
            'div',
            { class: 'panel route' },
            h('h3', {}, 'MY SENTENCES'),
            ...groups.flatMap((g) => {
              const sk = content.skill(g.skill);
              const checks = sk.write?.checks ?? [];
              return [h('div', { class: 'frame' }, sk.name.toUpperCase()), ...g.sentences.map((s) => row(s.text, () => showMyTeacher({ title: sk.name, text: s.text, marks: s.marks, checks })))];
            }),
          )
        : null,
    ),
  };
}
