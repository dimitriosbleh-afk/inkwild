import { h } from './dom';

let voice: SpeechSynthesisVoice | undefined;

function pickVoice(): void {
  const voices = speechSynthesis.getVoices();
  voice =
    voices.find((v) => v.lang === 'en-AU') ??
    voices.find((v) => v.lang.startsWith('en-GB')) ??
    voices.find((v) => v.lang.startsWith('en'));
}

if (typeof speechSynthesis !== 'undefined') {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function say(word: string): void {
  if (typeof speechSynthesis === 'undefined') return;
  const clean = word.replace(/[^\p{L}\p{N}'’-]/gu, '');
  if (!clean) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? 'en-AU';
  u.rate = 0.85;
  speechSynthesis.speak(u);
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
