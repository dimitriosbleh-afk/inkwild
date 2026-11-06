import { hash } from '../art/sprite';
import type { Variant } from '../core/save';

/** What a Swap QR code carries: a Creature id and which variant of it. Nothing else, so no names or free text travel. */
export interface SwapCard {
  creature: string;
  variant: Variant;
}

/** Codes from before variants carried a shiny flag, 0 or 1. They are still read, never written. */
const LEGACY = 'INKWILD1';
const PREFIX = 'INKWILD2';
const LETTER: Record<Variant, string> = { plain: 'p', shiny: 's', golden: 'g', champion: 'c' };
const OLD_FLAG: Record<string, Variant> = { '0': 'plain', '1': 'shiny' };

const sum = (body: string) => (hash(body) % 9000) + 1000;

export function encodeSwap(card: SwapCard): string {
  const body = `${PREFIX}:${card.creature}:${LETTER[card.variant]}`;
  return `${body}:${sum(body)}`;
}

export function decodeSwap(text: string, known: (id: string) => boolean): SwapCard | undefined {
  const parts = text.trim().split(':');
  if (parts.length !== 4) return undefined;
  const [prefix, creature, mark, check] = parts as [string, string, string, string];
  if (String(sum(`${prefix}:${creature}:${mark}`)) !== check || !known(creature)) return undefined;
  const variant = prefix === PREFIX ? variantOf(mark) : prefix === LEGACY ? OLD_FLAG[mark] : undefined;
  return variant ? { creature, variant } : undefined;
}

function variantOf(letter: string): Variant | undefined {
  return (Object.keys(LETTER) as Variant[]).find((v) => LETTER[v] === letter);
}
