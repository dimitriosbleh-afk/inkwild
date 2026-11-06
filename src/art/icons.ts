import { makeSprite, type SpriteDef } from './sprite';

const ICONS = {
  gear: {
    pal: { g: '#c9cfdc', h: '#f4f1e8', d: '#6b7391' },
    rows: [
      '....gggg....',
      '.gg.ghhg.gg.',
      '.gghhgggggg.',
      '..ghgggggg..',
      'gghggddggggg',
      'ggggd..dgggg',
      'ggggd..dgggd',
      'gggggddggggd',
      '..gggggggd..',
      '.gggggggddd.',
      '.gg.gddd.dd.',
      '....dddd....',
    ],
  },
  map: {
    pal: { l: '#f4e3b5', m: '#d9c48e', g: '#5aa443', b: '#7a4f2c', r: '#d9443b' },
    rows: [
      'llllmmmmllll',
      'lgglmmmmrlrl',
      'lgggmmmmlrll',
      'lgllmmbmrlrl',
      'llllmbmmllll',
      'lllbmmmmllll',
      'llblmmmmlggl',
      'lbllmmmmgggl',
      'llllmmmmlggl',
      'llllmmmmllll',
    ],
  },
  book: {
    pal: { w: '#f4f1e8', l: '#8a93b8', s: '#7a2e1a', c: '#d9443b' },
    rows: [
      '.wwww...wwww.',
      'wwwwwwswwwwww',
      'wllllwswllllw',
      'wwwwwwswwwwww',
      'wlllwwswllllw',
      'wwwwwwswwwwww',
      'wllllwswlllww',
      'wwwwwwswwwwww',
      'cccccc.cccccc',
      '.ccccc.ccccc.',
    ],
  },
  star: {
    pal: { y: '#f2c14e', h: '#fff3c4', o: '#d9902a' },
    rows: [
      '.....y.....',
      '....yhy....',
      '....hyy....',
      'yyyyhyyyyyy',
      '.yhyyyyyyo.',
      '..yyyyyyo..',
      '..yyyyyoo..',
      '.yyyy.yooo.',
      '.yyy...ooo.',
      'yy.......oo',
    ],
  },
  speaker: {
    pal: { d: '#6b7391', g: '#c9cfdc', h: '#f4f1e8', w: '#8fd3ff' },
    rows: [
      '.....dd.....',
      '....dhd..w..',
      '...dhgd...w.',
      'ddddhgd.w..w',
      'dhhhhgd..w.w',
      'dhhhhgd..w.w',
      'ddddhgd.w..w',
      '...dhgd...w.',
      '....dhd..w..',
      '.....dd.....',
    ],
  },
} satisfies Record<string, SpriteDef>;

export type IconName = keyof typeof ICONS;

/** A small pixel icon to sit in buttons and labels where an emoji would clash with the art. */
export function iconCanvas(name: IconName, scale: number): HTMLCanvasElement {
  const c = makeSprite(ICONS[name], scale);
  c.classList.add('icon');
  c.setAttribute('aria-hidden', 'true');
  return c;
}
