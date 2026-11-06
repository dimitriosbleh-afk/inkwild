import jsQR from 'jsqr';
import qrcode from 'qrcode-generator';
import { content } from '../../app/content';
import { creatureCanvas } from '../../art/creatures';
import { befriended, type Befriended } from '../../core/creatures';
import type { Variant } from '../../core/save';
import { decodeSwap, encodeSwap } from '../../swap/payload';
import type { App, ScreenView } from '../app';
import { h } from '../dom';
import { burst } from '../fx';
import { badges, VARIANT_LABEL } from './guide';

/** How a swapped variant is named: "A GOLDEN SQUINTLE". */
const ADJECTIVE: Record<Variant, string> = { plain: '', shiny: 'SHINY ', golden: 'GOLDEN ', champion: 'CHAMPION ' };

const known = (id: string) => content.branches.some((b) => content.skillsOf(b.id).some((s) => s.creature.id === id));

function qrCanvas(text: string, px: number): HTMLCanvasElement {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const quiet = 4;
  const c = document.createElement('canvas');
  c.width = c.height = (n + quiet * 2) * px;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#0b0f22';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) g.fillRect((x + quiet) * px, (y + quiet) * px, px, px);
  return c;
}

export function swapScreen(app: App): ScreenView {
  const el = h('div', { class: 'centre swap-screen' });
  let stopCamera = () => {};
  const header = (title: string, back: () => void) =>
    h('div', { class: 'row spread', style: 'margin-bottom:12px' }, h('button', { class: 'ghost', onclick: back }, 'BACK'), h('h2', { style: 'margin:0' }, title));

  const menu = () => {
    stopCamera();
    el.replaceChildren(
      header('SWAP', () => app.go({ name: 'guide' })),
      h(
        'div',
        { class: 'panel' },
        h('p', { class: 'note' }, 'Swap face to face. One iPad shows a code, the other scans it. You both keep the Creature.'),
        h('div', { class: 'actions', style: 'justify-content:flex-start' }, h('button', { class: 'big', onclick: pick }, 'SHOW ONE OF MINE'), h('button', { class: 'big alt', onclick: scan }, "SCAN A FRIEND'S")),
      ),
    );
  };

  const pick = () => {
    const mine = befriended(content, app.store.save);
    el.replaceChildren(
      header('PICK A CREATURE', menu),
      mine.length === 0
        ? h('div', { class: 'panel' }, h('p', { class: 'note' }, 'Befriend a Creature first, then you can swap it.'))
        : h(
            'div',
            { class: 'panel grid' },
            ...mine.map((c) => h('button', { class: 'card', onclick: () => (c.variants.length > 1 ? which(c) : show(c, c.variants[0]!)) }, creatureCanvas(c.creature, { scale: 4, evolved: c.evolved, variant: c.look }), c.name.toUpperCase(), badges(c.variants))),
          ),
    );
  };

  /** A Creature the Student has in more than one variant: which one to send. */
  const which = (c: Befriended) => {
    el.replaceChildren(
      header(`WHICH ${c.name.toUpperCase()}?`, pick),
      h('div', { class: 'panel grid' }, ...c.variants.map((v) => h('button', { class: 'card', onclick: () => show(c, v) }, creatureCanvas(c.creature, { scale: 4, variant: v }), VARIANT_LABEL[v]))),
    );
  };

  const show = (c: Befriended, variant: Variant) => {
    const art = creatureCanvas(c.creature, { scale: 6, variant });
    art.classList.add('bob');
    el.replaceChildren(
      header(`SWAP ${ADJECTIVE[variant]}${c.name.toUpperCase()}`, pick),
      h('div', { class: 'panel', style: 'text-align:center' }, art, h('div', { class: 'qr' }, qrCanvas(encodeSwap({ creature: c.creature, variant }), 9)), h('p', { class: 'note' }, "Your friend taps SCAN A FRIEND'S and points their camera here.")),
    );
  };

  const scan = async () => {
    const video = h('video', { playsinline: true, muted: true, autoplay: true, class: 'scan-video' }) as HTMLVideoElement;
    const msg = h('p', { class: 'note' }, 'Point the camera at your friend’s code.');
    el.replaceChildren(header("SCAN A FRIEND'S", menu), h('div', { class: 'panel', style: 'text-align:center' }, video, msg));
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch {
      msg.textContent = 'The camera is off. Allow camera access in Settings for Safari, then try again.';
      return;
    }
    video.srcObject = stream;
    const grab = document.createElement('canvas');
    const g = grab.getContext('2d', { willReadFrequently: true })!;
    let running = true;
    stopCamera = () => {
      running = false;
      stream.getTracks().forEach((t) => t.stop());
    };
    const look = () => {
      if (!running) return;
      if (video.videoWidth) {
        grab.width = video.videoWidth;
        grab.height = video.videoHeight;
        g.drawImage(video, 0, 0);
        const found = jsQR(g.getImageData(0, 0, grab.width, grab.height).data, grab.width, grab.height);
        const card = found && decodeSwap(found.data, known);
        if (card) {
          stopCamera();
          const events = app.store.dispatch({ type: 'receive', creature: card.creature, variant: card.variant });
          const already = events.some((e) => e.type === 'received' && e.already);
          const skill = content.branches.flatMap((b) => content.skillsOf(b.id)).find((s) => s.creature.id === card.creature)!;
          const art = creatureCanvas(card.creature, { scale: 8, variant: card.variant });
          el.replaceChildren(
            header('SWAP DONE', menu),
            h('div', { class: 'panel pop', style: 'text-align:center' }, h('h2', {}, already ? `YOU ALREADY HAVE ${card.variant === 'plain' ? '' : `A ${ADJECTIVE[card.variant]}`}${skill.creature.name.toUpperCase()}` : `${card.variant === 'plain' ? '' : `A ${ADJECTIVE[card.variant]}`}${skill.creature.name.toUpperCase()} JOINED YOUR CREW!`), art, h('div', { class: 'actions', style: 'justify-content:center' }, h('button', { class: 'big', onclick: menu }, 'NICE!'))),
          );
          if (!already) setTimeout(() => burst(art), 100);
          return;
        }
        if (found) msg.textContent = 'That code isn’t an Inkwild Swap. Try again.';
      }
      setTimeout(look, 200);
    };
    look();
  };

  menu();
  return { el, stop: () => stopCamera() };
}
