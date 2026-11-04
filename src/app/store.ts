import { content } from './content';
import { step, type Action, type GameEvent } from '../core/game';
import { newSave, type Day, type Save } from '../core/save';
import { loadSave, writeSave } from './persist';

export function today(now = new Date()): Day {
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / 86_400_000);
}

type Listener = (events: GameEvent[]) => void;

export class Store {
  save: Save;
  private listeners = new Set<Listener>();

  constructor(save?: Save) {
    this.save = save ?? loadSave() ?? newSave(today());
  }

  get isNew(): boolean {
    return !this.save.captain;
  }

  dispatch(action: Action): GameEvent[] {
    const { save, events } = step(content, this.save, action, { day: today(), rand: Math.random });
    this.replace(save);
    for (const l of this.listeners) l(events);
    return events;
  }

  update(change: (save: Save) => void): void {
    const next = structuredClone(this.save);
    change(next);
    this.replace(next);
  }

  replace(save: Save): void {
    this.save = save;
    writeSave(save);
  }

  listen(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}
