import { upgradeSave, type Save } from '../core/save';

const KEY = 'inkwild.save';

export function loadSave(): Save | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? upgradeSave(JSON.parse(raw) as Save) : undefined;
  } catch {
    return undefined;
  }
}

export function writeSave(save: Save): void {
  localStorage.setItem(KEY, JSON.stringify(save));
}

export function clearSave(): void {
  localStorage.removeItem(KEY);
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
