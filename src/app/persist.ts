import { upgradeSave, type Save } from '../core/save';

const KEY = 'inkwild.save';
/** The save as it was last loaded, kept so a bad upgrade or write can be undone by hand. */
const SPARE = 'inkwild.save.spare';
/** A save that could not be read. It is never overwritten by a new game, so a teacher can still recover it. */
const RESCUE = 'inkwild.save.rescue';

function store(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // Full or blocked storage (Safari private browsing). The game keeps going; the save just isn't written this time.
    return false;
  }
}

export function loadSave(): Save | undefined {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return undefined;
  }
  if (!raw) return undefined;
  try {
    const save = upgradeSave(JSON.parse(raw) as Save);
    store(SPARE, raw);
    return save;
  } catch {
    // Keep the unreadable save before the new game's first write replaces it. The spare is the last save that loaded.
    if (!safeGet(RESCUE)) store(RESCUE, raw);
    const spare = safeGet(SPARE);
    if (spare) {
      try {
        return upgradeSave(JSON.parse(spare) as Save);
      } catch {
        /* fall through to a new game */
      }
    }
    return undefined;
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSave(save: Save): void {
  store(KEY, JSON.stringify(save));
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

export async function askToKeepStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* Safari may refuse outside the Home Screen; the Add to Home Screen prompt covers that. */
  }
}

export function onHomeScreen(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || matchMedia('(display-mode: standalone)').matches;
}
