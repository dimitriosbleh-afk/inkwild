import type { CaptainLook } from '../core/save';
import { makeSprite, type SpriteDef } from './sprite';

export const SKINS = ['#f6d3b3', '#e8b48a', '#c98d5f', '#9a6440', '#5e3b24'];
export const HAIR_COLOURS = ['#2a1a12', '#5a3a22', '#a0522d', '#e0b04a', '#d9443b', '#3a3a8a'];
export const OUTFITS = ['#3c7bd9', '#d9443b', '#45a35a', '#f2c14e', '#9b6fd1', '#ff8fb1', '#2b2f4a', '#f08a3a'];
export const HAIRS = ['cap', 'short', 'long', 'curly', 'ponytail', 'buns', 'spiky', 'headscarf', 'beanie'] as const;
export type Hair = (typeof HAIRS)[number];
/** Styles drawn in the trim colour rather than the hair colour. */
export const COVERED: ReadonlySet<Hair> = new Set(['cap', 'headscarf', 'beanie']);

const BODY = [
  '......sss.......',
  '....bbbbbbb.....',
  '...sbbbbbbbs....',
  '...s.bbbbb.s....',
  '.....bbbbb......',
  '.....pp.pp......',
  '.....pp.pp......',
  '....kk...kk.....',
];

const HEADS: Record<Hair, string[]> = {
  cap: ['......rrrr......', '.....rrrrrrr....', '.....hsssh......', '.....skssk......', '.....sssss......'],
  short: ['......hhhh......', '.....hhhhhh.....', '.....hsssh......', '.....skssk......', '.....sssss......'],
  long: ['......hhhh......', '.....hhhhhh.....', '....hhssshh.....', '....hsksskh.....', '....hsssssh.....'],
  curly: ['...h.hhhh.h.....', '....hhhhhhh.....', '....hhssshh.....', '.....skssk......', '.....sssss......'],
  ponytail: ['......hhhh......', '.....hhhhhhh....', '.....hsssh.hh...', '.....skssk..h...', '.....sssss......'],
  buns: ['....hh...hh.....', '.....hhhhhh.....', '.....hsssh......', '.....skssk......', '.....sssss......'],
  spiky: ['.....h.h.h......', '.....hhhhhh.....', '.....hsssh......', '.....skssk......', '.....sssss......'],
  headscarf: ['......rrrr......', '.....rrrrrr.....', '....rrsssrr.....', '....rsksskr.....', '....rsssssr.....'],
  beanie: ['.......r........', '......rrrr......', '.....rrrrrr.....', '.....skssk......', '.....sssss......'],
};

/** The same styles for the small walking sprite: three rows above the eyes, eight pixels wide. */
export const MINI_HEADS: Record<Hair, string[]> = {
  cap: ['..rrrr..', '.rrrrrr.', '.hsssh..'],
  short: ['..hhhh..', '.hhhhhh.', '.hsssh..'],
  long: ['..hhhh..', '.hhhhhh.', 'hhsssh..'],
  curly: ['.h.hh.h.', '.hhhhhh.', 'hhsssh..'],
  ponytail: ['..hhhh..', '.hhhhhhh', '.hsssh.h'],
  buns: ['hh..hh..', '.hhhhh..', '.hsssh..'],
  spiky: ['.h.h.h..', '.hhhhhh.', '.hsssh..'],
  headscarf: ['..rrrr..', '.rrrrrr.', 'rrsssr..'],
  beanie: ['...r....', '.rrrrr..', '.rrrrr..'],
};

export function captainDef(look: CaptainLook): SpriteDef {
  const hair = HAIRS[look.hair % HAIRS.length]!;
  return {
    rows: ['................', ...HEADS[hair], ...BODY],
    pal: {
      s: SKINS[look.skin % SKINS.length]!,
      h: HAIR_COLOURS[look.hairColour % HAIR_COLOURS.length]!,
      b: OUTFITS[look.outfit % OUTFITS.length]!,
      r: OUTFITS[look.colour % OUTFITS.length]!,
      p: '#2b2f4a',
      k: '#1b1b1b',
    },
  };
}

export function captainCanvas(look: CaptainLook, scale: number): HTMLCanvasElement {
  return makeSprite(captainDef(look), scale);
}

export function randomLook(rand = Math.random): CaptainLook {
  const pick = (n: number) => Math.floor(rand() * n);
  return {
    skin: pick(SKINS.length),
    hair: pick(HAIRS.length),
    hairColour: pick(HAIR_COLOURS.length),
    outfit: pick(OUTFITS.length),
    colour: pick(OUTFITS.length),
  };
}
