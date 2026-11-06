import { iconCanvas } from '../art/icons';
import { h } from './dom';

let voice: SpeechSynthesisVoice | undefined;

function pickVoice(): void {
  const voices = speechSynthesis.getVoices();
  voice =
    voices.find((v) => v.lang === 'en-AU') ??
    voices.find((v) => v.lang.startsWith('en-GB')) ??
    voices.find((v) => v.lang.startsWith('en'));
}

const canSpeak = typeof speechSynthesis !== 'undefined';

if (canSpeak) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

function utterance(text: string, rate: number): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? 'en-AU';
  u.rate = rate;
  return u;
}

export function say(word: string): void {
  if (!canSpeak) return;
  const clean = word.replace(/[^\p{L}\p{N}'’-]/gu, '');
  if (!clean) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance(clean, 0.85));
}

/** Stops any line being read, so a new screen starts quiet. */
export function hush(): void {
  if (canSpeak) speechSynthesis.cancel();
}

let readAloud = false;
/** Lines that appeared together, in this turn of the event loop, are read one after another rather than cut off. */
let together = false;

/** The "Read crew lines aloud" setting. */
export function setReadAloud(on: boolean): void {
  readAloud = on;
}

/** A blank in a line is read as "blank", not as a run of underscores. */
const spoken = (line: string): string => line.replace(/_{2,}/g, ' blank ').replace(/\s+/g, ' ').trim();

function speakLine(line: string, button: HTMLElement | null, queue: boolean): void {
  const text = spoken(line);
  if (!canSpeak || !text) return;
  if (!queue) speechSynthesis.cancel();
  const u = utterance(text, 0.9);
  if (button) {
    const off = () => button.classList.remove('speaking');
    u.addEventListener('start', () => button.classList.add('speaking'));
    u.addEventListener('end', off);
    u.addEventListener('error', off);
  }
  speechSynthesis.speak(u);
}

/**
 * HEAR: reads one crew or Keeper line aloud, whole. Only ever for what the crew says. Passages, chapters, options and
 * the Student's own writing stay silent, because reading those is the practice. With "Read crew lines aloud" on, the
 * line also speaks as soon as its bubble is made.
 */
export function hear(line: string): HTMLButtonElement {
  const b = h('button', { class: 'hear', type: 'button', 'aria-label': 'Hear this line' }, iconCanvas('speaker', 3), h('span', {}, 'HEAR'));
  b.addEventListener('click', () => speakLine(line, b, false));
  if (readAloud) {
    speakLine(line, b, together);
    if (!together) {
      together = true;
      queueMicrotask(() => (together = false));
    }
  }
  return b;
}

/** The top of a speech bubble or feedback box: who is talking, and HEAR for the whole line. */
export function saidBy(name: string, line: string): HTMLElement {
  return h('div', { class: 'say-head' }, h('b', {}, name), hear(line));
}

/** Reads a crew line aloud now, whole, as if its HEAR button (inside `from`, if it has one) were tapped. */
export function sayLine(line: string, from?: Element | null): void {
  speakLine(line, from?.querySelector('button.hear') ?? null, false);
}

/** Text whose every word can be tapped to hear it spoken. Never reads whole passages. */
export function readable(text: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  for (const piece of text.split(/(\s+)/)) {
    if (!piece) continue;
    if (/^\s+$/.test(piece)) {
      frag.append(piece);
      continue;
    }
    const w = h('span', { class: 'w' }, piece);
    w.addEventListener('click', () => {
      w.classList.add('heard');
      setTimeout(() => w.classList.remove('heard'), 700);
      say(piece);
    });
    frag.append(w);
  }
  return frag;
}
