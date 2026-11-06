import { content, GAME_TITLE } from '../../app/content';
import { today } from '../../app/store';
import { captainCanvas, HAIR_COLOURS, HAIRS, OUTFITS, randomLook, SKINS } from '../../art/captain';
import { creatureCanvas } from '../../art/creatures';
import { iconCanvas } from '../../art/icons';
import { parseCode, restorable, restore, toCode } from '../../backup/code';
import { INTERESTS, type Interest } from '../../content/types';
import { befriended } from '../../core/creatures';
import { upgradeSave, type CaptainLook, type Save } from '../../core/save';
import type { App, ScreenView } from '../app';
import { h } from '../dom';

const INTEREST_LABELS: Record<Interest, string> = {
  sport: 'Sport & footy',
  animals: 'Animals',
  space: 'Space',
  'gross-science': 'Gross science',
  gaming: 'Gaming',
  art: 'Art & making',
  music: 'Music',
  ocean: 'Oceans',
  spooky: 'Spooky stuff',
  funny: 'Funny stuff',
  food: 'Food',
  robots: 'Robots & tech',
};

export function firstRunScreen(app: App): ScreenView {
  const el = h('div', { class: 'centre' });
  const look: CaptainLook = app.store.save.captain ?? randomLook();
  const picks = new Set<Interest>(app.store.save.interests);

  // The first screen is the hook, so it shows the Creatures at stake rather than a line of small print.
  const parade = () => {
    const ids = content.branches.flatMap((b) => content.skillsOf(b.id).slice(0, 1).map((s) => s.creature.id)).slice(0, 5);
    return h('div', { class: 'row', style: 'justify-content:center;gap:18px;margin:14px 0 6px' }, ...ids.map((id, i) => {
      const art = creatureCanvas(id, { scale: 5 });
      art.classList.add('bob');
      art.style.animationDelay = `${i * 0.18}s`;
      return art;
    }));
  };
  const welcome = () =>
    el.replaceChildren(
      h(
        'div',
        { class: 'panel', style: 'text-align:center;margin-top:6vh' },
        h('h1', { style: 'font-size:40px' }, GAME_TITLE.toUpperCase()),
        parade(),
        h('p', { class: 'reading', style: 'font-size:22px;line-height:1.5;margin:10px auto 4px;max-width:560px' }, 'Someone is stealing the rarest Creatures in the islands.'),
        h('p', { class: 'reading', style: 'font-size:22px;line-height:1.5;margin:0 auto 10px;max-width:560px;font-weight:700' }, 'Your crew needs a captain.'),
        h('div', { class: 'actions', style: 'justify-content:center' }, h('button', { class: 'big pulse', onclick: captain }, 'THAT’S ME')),
        h('div', { class: 'actions', style: 'justify-content:center' }, h('button', { class: 'ghost', onclick: () => app.go({ name: 'restore' }) }, 'I HAVE A BACKUP CODE')),
      ),
    );

  const captain = () => {
    const preview = h('div', { class: 'bob', style: 'display:flex;justify-content:center' });
    const drawPreview = () => preview.replaceChildren(captainCanvas(look, 10));
    const row = (label: string, colours: string[] | readonly string[], key: keyof CaptainLook, swatch = true) => {
      const buttons = colours.map((c, i) => {
        const b = h(
          'button',
          {
            class: `swatch${swatch ? '' : ' wide'}${look[key] === i ? ' on' : ''}`,
            style: swatch ? `background:${c}` : 'font-size:8px',
            onclick: () => {
              look[key] = i;
              buttons.forEach((x, k) => x.classList.toggle('on', k === i));
              drawPreview();
            },
          },
          swatch ? '' : c.toUpperCase(),
        );
        return b;
      });
      return h('div', { style: 'margin:12px 0' }, h('div', { class: 'frame' }, label), h('div', { class: 'swatches' }, buttons));
    };
    drawPreview();
    el.replaceChildren(
      h(
        'div',
        { class: 'panel' },
        h('h2', {}, 'MAKE YOUR CAPTAIN'),
        h('div', { class: 'row', style: 'align-items:flex-start;gap:30px' }, preview, h('div', { style: 'flex:1' }, row('SKIN', SKINS, 'skin'), row('HAIR', HAIRS, 'hair', false), row('HAIR COLOUR', HAIR_COLOURS, 'hairColour'), row('OUTFIT', OUTFITS, 'outfit'), row('HAT OR TRIM', OUTFITS, 'colour'))),
        h('div', { class: 'actions' }, h('button', { class: 'big', onclick: interests }, 'NEXT')),
      ),
    );
  };

  const interests = () => {
    const done = h('button', { class: 'big', disabled: picks.size !== 3, onclick: finish }, 'SET SAIL');
    const buttons = INTERESTS.map((i) =>
      h(
        'button',
        {
          class: `ghost interest${picks.has(i) ? ' on' : ''}`,
          style: 'font-size:10px',
          onclick: (e: Event) => {
            if (picks.has(i)) picks.delete(i);
            else if (picks.size < 3) picks.add(i);
            (e.currentTarget as HTMLElement).classList.toggle('on', picks.has(i));
            done.disabled = picks.size !== 3;
          },
        },
        INTEREST_LABELS[i].toUpperCase(),
      ),
    );
    el.replaceChildren(
      h('div', { class: 'panel' }, h('h2', {}, 'PICK 3 THINGS YOU’RE INTO'), h('p', { class: 'note' }, 'You’ll get more stories about them.'), h('div', { class: 'row' }, buttons), h('div', { class: 'actions' }, done)),
    );
  };

  const finish = () => {
    app.store.update((s) => {
      s.captain = look;
      s.interests = [...picks];
    });
    app.store.dispatch({ type: 'open' });
    app.go({ name: 'home' });
  };

  if (app.store.save.captain || Object.keys(app.store.save.skills).length > 0) captain();
  else welcome();
  return { el };
}

export function restoreScreen(app: App): ScreenView {
  const input = h('input', { class: 'code-in', maxlength: '16', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'XXXX-XXXX-XXXX' });
  const msg = h('p', { class: 'note' });
  const file = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      const save = JSON.parse(await f.text()) as Save;
      if (save.v !== 1 || !save.branches) throw new Error('not a save');
      app.store.replace(upgradeSave(save));
      app.applySettings();
      app.go({ name: 'home' });
    } catch {
      msg.textContent = 'That file isn’t an Inkwild backup.';
    }
  });
  const go = () => {
    const parsed = parseCode(input.value);
    if (!parsed.ok) {
      msg.textContent =
        parsed.problem === 'length'
          ? 'A Backup code has 12 characters. Check you copied all three groups.'
          : parsed.problem === 'character'
            ? `Backup codes never use ${parsed.character}. They leave out O, 0, I, 1, L, S and 5. Check your book.`
            : parsed.problem === 'version'
              ? 'That code is from a newer version of the game. Ask your teacher to update the iPad.'
              : 'One of the characters doesn’t match. Check each group against your book.';
      return;
    }
    app.store.replace(restore(content, parsed.data, today()));
    app.go({ name: 'firstRun' });
  };
  return {
    el: h(
      'div',
      { class: 'centre' },
      h(
        'div',
        { class: 'panel', style: 'margin-top:6vh' },
        h('h2', {}, 'TYPE YOUR BACKUP CODE'),
        h('p', { class: 'note' }, 'It’s in your book. Twelve characters, like K7QM-4XWT-9HBR.'),
        input,
        msg,
        h('div', { class: 'actions' }, h('button', { class: 'ghost', onclick: () => app.go({ name: 'firstRun' }) }, 'BACK'), h('button', { class: 'ghost', onclick: () => file.click() }, 'FROM FILES'), h('button', { class: 'big', onclick: go }, 'RESTORE')),
        file,
      ),
    ),
  };
}

export function backupScreen(app: App): ScreenView {
  const code = toCode(restorable(content, app.store.save));
  const el = h('div', { class: 'centre' });
  const show = (again: boolean) =>
    el.replaceChildren(
      h(
        'div',
        { class: 'panel' },
        h('h2', {}, again ? 'NOT QUITE. FIX YOUR BOOK' : 'YOUR BACKUP CODE'),
        h('p', { class: 'note' }, again ? 'Here it is again. Find the character that’s different in your book and fix it.' : 'Copy it into your book exactly. You’ll type it back from your book to prove it’s right.'),
        h('div', { class: 'code' }, code),
        h('div', { class: 'actions' }, h('button', { class: 'ghost', onclick: () => app.go({ name: 'home' }) }, 'LATER'), h('button', { class: 'big', onclick: prove }, 'I’VE COPIED IT')),
      ),
    );
  const prove = () => {
    const input = h('input', { class: 'code-in', maxlength: '16', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'XXXX-XXXX-XXXX' });
    el.replaceChildren(
      h(
        'div',
        { class: 'panel' },
        h('h2', {}, 'NOW TYPE IT FROM YOUR BOOK'),
        h('p', { class: 'note' }, 'Don’t peek at the screen. Read it from your book.'),
        input,
        h(
          'div',
          { class: 'actions' },
          h(
            'button',
            {
              class: 'big',
              onclick: () => {
                const typed = input.value.toUpperCase().replace(/[\s-]/g, '');
                if (typed !== code.replace(/-/g, '')) return show(true);
                app.store.update((s) => (s.backupConfirmed = today()));
                el.replaceChildren(h('div', { class: 'panel pop' }, h('h2', {}, 'BACKED UP!'), h('p', { class: 'note' }, 'Your creatures are safe. See you next week for a fresh code.'), h('div', { class: 'actions' }, h('button', { class: 'ghost', onclick: () => saveToFiles(app) }, 'ALSO SAVE TO FILES'), h('button', { class: 'big', onclick: () => app.go({ name: 'home' }) }, 'HOME'))));
              },
            },
            'CHECK',
          ),
        ),
      ),
    );
    input.focus();
  };
  show(false);
  return { el };
}

async function saveToFiles(app: App): Promise<void> {
  const blob = new Blob([JSON.stringify(app.store.save)], { type: 'application/json' });
  const name = `inkwild-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Inkwild backup' });
      return;
    } catch {
      /* cancelled */
    }
  }
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  a.click();
}

export function settingsScreen(app: App): ScreenView {
  const s = () => app.store.save.settings;
  const el = h('div', { class: 'centre' });
  const set = (change: (x: Save['settings']) => void) => {
    app.store.update((save) => change(save.settings));
    app.applySettings();
    draw();
  };
  const toggle = (label: string, on: boolean, flip: () => void) => h('button', { class: `${on ? 'go' : 'ghost'} setting`, onclick: flip, 'aria-pressed': String(on) }, `${label}: ${on ? 'ON' : 'OFF'}`);
  const draw = () =>
    el.replaceChildren(
      h('div', { class: 'row spread', style: 'margin-bottom:12px' }, h('button', { class: 'ghost', onclick: () => app.go({ name: 'home' }) }, 'HOME'), h('h2', { style: 'margin:0' }, 'SETTINGS')),
      h(
        'div',
        { class: 'panel' },
        h('h3', {}, 'READING COMFORT'),
        h('div', { class: 'passage reading' }, 'The tide rolled in fast, and the crew scrambled for the boat.'),
        h('div', { class: 'row' }, ...[0, 1, 2].map((n) => h('button', { class: s().textSize === n ? 'go' : 'ghost', onclick: () => set((x) => (x.textSize = n as 0 | 1 | 2)) }, ['TEXT A', 'TEXT A+', 'TEXT A++'][n]!))),
        h('div', { class: 'row', style: 'margin-top:14px' }, toggle('EXTRA SPACING', s().spacing, () => set((x) => (x.spacing = !x.spacing))), toggle('CREAM PAGE', s().cream, () => set((x) => (x.cream = !x.cream)))),
      ),
      h(
        'div',
        { class: 'panel' },
        h('h3', {}, 'SOUND'),
        h('p', { class: 'note' }, 'Tapping a word always reads it out, and HEAR reads a whole crew line. SOUND is for music and sound effects. READ CREW LINES ALOUD reads each new crew line by itself.'),
        h('div', { class: 'row' }, toggle('SOUND', s().sound, () => set((x) => (x.sound = !x.sound))), toggle('READ CREW LINES ALOUD', s().readAloud, () => set((x) => (x.readAloud = !x.readAloud)))),
      ),
      h(
        'div',
        { class: 'panel' },
        h('h3', {}, 'YOU'),
        h('div', { class: 'row' }, h('button', { class: 'alt', onclick: () => app.go({ name: 'firstRun' }) }, 'CAPTAIN & INTERESTS'), h('button', { class: 'alt', onclick: () => app.go({ name: 'backup' }) }, 'BACKUP CODE'), h('button', { class: 'alt', onclick: () => app.go({ name: 'progress' }) }, 'SHOW MY TEACHER'), h('button', { class: 'alt', onclick: () => app.go({ name: 'pieces' }) }, 'MY WRITING')),
      ),
    );
  draw();
  return { el };
}

export function progressScreen(app: App): ScreenView {
  const s = app.store.save;
  const friends = befriended(content, s);
  const branches = content.branches.filter((b) => content.skillsOf(b.id).length > 0);
  return {
    el: h(
      'div',
      { class: 'centre' },
      h('div', { class: 'row spread', style: 'margin-bottom:12px' }, h('button', { class: 'ghost', onclick: () => app.go({ name: 'settings' }) }, 'BACK'), h('h2', { style: 'margin:0' }, 'MY PROGRESS')),
      h(
        'div',
        { class: 'panel row' },
        s.captain ? captainCanvas(s.captain, 6) : null,
        h('div', { class: 'note' }, `${s.daysPlayed} days played · ${friends.length} creatures · ${content.branches.filter((b) => s.branches[b.id].keeper).length} badges`),
      ),
      branches.map((b) => {
        const mastered = content.skillsOf(b.id).filter((sk) => s.skills[sk.id]?.mastered);
        return h('div', { class: 'panel' }, h('h3', {}, b.name.toUpperCase(), s.branches[b.id].keeper ? iconCanvas('star', 2) : null), mastered.length ? h('ul', { class: 'note' }, mastered.map((m) => h('li', {}, m.name))) : h('p', { class: 'note' }, 'Nothing mastered here yet.'));
      }),
    ),
  };
}
