import { hash } from '../art/sprite';

/** What a Swap QR code carries: a Creature id and whether it is shiny. Nothing else, so no names or free text travel. */
export interface SwapCard {
  creature: string;
  shiny: boolean;
}

const PREFIX = 'INKWILD1';

const sum = (body: string) => (hash(body) % 9000) + 1000;

export function encodeSwap(card: SwapCard): string {
  const body = `${PREFIX}:${card.creature}:${card.shiny ? 1 : 0}`;
  return `${body}:${sum(body)}`;
}

export function decodeSwap(text: string, known: (id: string) => boolean): SwapCard | undefined {
  const parts = text.trim().split(':');
  if (parts.length !== 4 || parts[0] !== PREFIX) return undefined;
  const [, creature, shiny, check] = parts as [string, string, string, string];
  if (String(sum(`${PREFIX}:${creature}:${shiny}`)) !== check) return undefined;
  if (!known(creature) || (shiny !== '0' && shiny !== '1')) return undefined;
  return { creature, shiny: shiny === '1' };
}
