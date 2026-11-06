import { BRANCH_IDS, type Band, type BranchId, type Content } from '../content/types';
import { PRACTICE_TO_UNLOCK, route, routePosition } from '../core/route';
import { newSave, PLACEMENT_ENCOUNTERS, type Day, type Save } from '../core/save';

export const ALPHABET = '2346789ABCDEFGHJKMNPQRTUVWXYZ';
const BASE = BigInt(ALPHABET.length);
const DATA_CHARS = 11;
const VERSIONS = 16n;

/** Route length per Branch (Skills plus the Keeper), in BRANCH_IDS order. Never edit a published layout: add a new version. */
export const LAYOUTS: Record<number, Record<BranchId, number>> = {
  1: { between: 10, whose: 11, convince: 12, pictures: 11, sentence: 14, punctuation: 11, structure: 13, editing: 10, workshop: 10 },
};
export const CURRENT_VERSION = 1;

export interface BranchRestore {
  position: number;
  band: Band;
}
export type Restorable = Record<BranchId, BranchRestore>;

export type Parsed =
  | { ok: true; version: number; data: Restorable }
  | { ok: false; problem: 'length' | 'character' | 'check' | 'version'; character?: string };

const marked = (b: BranchId) => b !== 'workshop';

function radices(layout: Record<BranchId, number>): bigint[] {
  return BRANCH_IDS.flatMap((b) => (marked(b) ? [BigInt(layout[b] + 1), 4n] : [BigInt(layout[b] + 1)]));
}

export function capacityFits(layout: Record<BranchId, number>): boolean {
  return VERSIONS * radices(layout).reduce((a, r) => a * r, 1n) <= BASE ** BigInt(DATA_CHARS);
}

export function layoutOf(content: Content): Record<BranchId, number> {
  return Object.fromEntries(BRANCH_IDS.map((b) => [b, route(content, b).length])) as Record<BranchId, number>;
}

export function toCode(data: Restorable, version = CURRENT_VERSION): string {
  const layout = LAYOUTS[version];
  if (!layout) throw new Error(`no layout ${version}`);
  let n = 0n;
  for (const b of [...BRANCH_IDS].reverse()) {
    const { position, band } = data[b];
    if (position < 0 || position > layout[b]) throw new Error(`position ${position} out of range for ${b}`);
    if (marked(b)) n = n * 4n + BigInt(band - 1);
    n = n * BigInt(layout[b] + 1) + BigInt(position);
  }
  n = n * VERSIONS + BigInt(version);

  const digits: number[] = [];
  for (let i = 0; i < DATA_CHARS; i++) {
    digits.unshift(Number(n % BASE));
    n /= BASE;
  }
  if (n !== 0n) throw new Error('progress does not fit in a Backup code');
  digits.push(checkDigit(digits));
  const s = digits.map((d) => ALPHABET[d]).join('');
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

function checkDigit(data: number[]): number {
  const sum = data.reduce((acc, d, i) => acc + (i + 1) * d, 0);
  const weight = data.length + 1;
  for (let c = 0; c < ALPHABET.length; c++) {
    if ((sum + weight * c) % ALPHABET.length === 0) return c;
  }
  throw new Error('unreachable: 29 is prime');
}

export function parseCode(input: string): Parsed {
  const chars = input.toUpperCase().replace(/[\s-]/g, '');
  if (chars.length !== DATA_CHARS + 1) return { ok: false, problem: 'length' };
  const digits: number[] = [];
  for (const ch of chars) {
    const d = ALPHABET.indexOf(ch);
    if (d === -1) return { ok: false, problem: 'character', character: ch };
    digits.push(d);
  }
  const data = digits.slice(0, DATA_CHARS);
  if (checkDigit(data) !== digits[DATA_CHARS]) return { ok: false, problem: 'check' };

  let n = data.reduce((acc, d) => acc * BASE + BigInt(d), 0n);
  const version = Number(n % VERSIONS);
  n /= VERSIONS;
  const layout = LAYOUTS[version];
  if (!layout) return { ok: false, problem: 'version' };

  const out = {} as Restorable;
  for (const b of BRANCH_IDS) {
    const radix = BigInt(layout[b] + 1);
    const position = Number(n % radix);
    n /= radix;
    let band: Band = 2;
    if (marked(b)) {
      band = (Number(n % 4n) + 1) as Band;
      n /= 4n;
    }
    out[b] = { position, band };
  }
  if (n !== 0n) return { ok: false, problem: 'check' };
  return { ok: true, version, data: out };
}

export function restorable(content: Content, save: Save): Restorable {
  return Object.fromEntries(
    BRANCH_IDS.map((b) => [b, { position: routePosition(content, save, b), band: save.branches[b].band }]),
  ) as Restorable;
}

const RESTORED_XP = 90;

export function restore(content: Content, data: Restorable, today: Day): Save {
  const save = newSave(today);
  for (const b of BRANCH_IDS) {
    const { position, band } = data[b];
    save.branches[b] = { band, placing: position > 0 ? 0 : PLACEMENT_ENCOUNTERS, recent: [], keeper: false };
    for (const item of route(content, b).slice(0, position)) {
      if (item.kind === 'keeper') {
        save.branches[b].keeper = true;
        continue;
      }
      save.skills[item.skill.id] = {
        taught: true,
        done: PRACTICE_TO_UNLOCK,
        xp: RESTORED_XP,
        recent: [],
        mastered: true,
        masteredBand: band,
        reviewMisses: 0,
        rusty: false,
        streak: 0,
      };
    }
  }
  return save;
}

export const BACKUP_EVERY_DAYS = 7;

/** A fresh code is due once the Student has played, and then every week after the last confirmed copy. */
export function backupDue(save: Save, day: Day): boolean {
  if (save.daysPlayed === 0) return false;
  if (save.backupConfirmed === undefined) return true;
  return day - save.backupConfirmed >= BACKUP_EVERY_DAYS;
}
