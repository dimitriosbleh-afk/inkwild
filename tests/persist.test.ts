import { beforeEach, describe, expect, it } from 'vitest';
import { loadSave, writeSave } from '../src/app/persist';
import { newSave } from '../src/core/save';

class MemoryStorage {
  data = new Map<string, string>();
  full = false;
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.full) throw new DOMException('full', 'QuotaExceededError');
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

let mem: MemoryStorage;
beforeEach(() => {
  mem = new MemoryStorage();
  Object.assign(globalThis, { localStorage: mem });
});

describe('keeping a Student’s save safe', () => {
  it('loads a written save and keeps it as the spare', () => {
    const save = newSave(100);
    save.daysPlayed = 7;
    writeSave(save);
    expect(loadSave()?.daysPlayed).toBe(7);
    expect(mem.data.get('inkwild.save.spare')).toBe(mem.data.get('inkwild.save'));
  });

  it('keeps an unreadable save in the rescue slot and falls back to the spare', () => {
    const save = newSave(100);
    save.daysPlayed = 3;
    writeSave(save);
    loadSave();
    mem.data.set('inkwild.save', '{"started": 100, "skills": nonsense');
    expect(loadSave()?.daysPlayed).toBe(3);
    expect(mem.data.get('inkwild.save.rescue')).toBe('{"started": 100, "skills": nonsense');
  });

  it('never overwrites the first rescued save with a later one', () => {
    mem.data.set('inkwild.save', 'broken one');
    loadSave();
    mem.data.set('inkwild.save', 'broken two');
    loadSave();
    expect(mem.data.get('inkwild.save.rescue')).toBe('broken one');
  });

  it('keeps playing when storage is full', () => {
    mem.full = true;
    expect(() => writeSave(newSave(100))).not.toThrow();
  });
});
