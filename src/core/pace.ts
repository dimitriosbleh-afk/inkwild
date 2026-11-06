import type { Task } from '../content/types';
import type { Activity } from './save';

/** Too fast: a first answer tapped before the passage could have been read doesn't count. No countdown is ever shown. */
export const WORDS_PER_SECOND = 5;
export const MIN_READ_MS = 2000;
export const MAX_READ_MS = 10_000;
/** How long the answers stay greyed out after a too-fast tap. */
export const TOO_FAST_HOLD_MS = 1500;

/** The least time a passage takes to read: a second per 5 words, from 2 to 10 seconds. No passage, no wait. */
export function readingMs(text: string | undefined): number {
  const words = text?.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length ?? 0;
  if (words === 0) return 0;
  return Math.min(MAX_READ_MS, Math.max(MIN_READ_MS, (words / WORDS_PER_SECOND) * 1000));
}

/**
 * True when this answer came too soon to count: only the first attempt at a task with a passage, and never in the We do,
 * where the crew is still helping. `ms` is the time since the task appeared; an untimed answer always counts.
 */
export function tooFast(task: Pick<Task, 'text'>, activity: Pick<Activity, 'kind' | 'tries'>, ms: number | undefined): boolean {
  if (ms === undefined || activity.kind === 'teach' || activity.tries > 0) return false;
  return ms < readingMs(task.text);
}

/** Tap to learn: a wrong tap this soon after the last wrong one is tapping, not reading. */
export const RUSH_WINDOW_MS = 3000;
/** How long the choices lock when a Student rushes a lesson step. */
export const RUSH_LOCK_MS = 2000;

/** Two wrong taps or picks within 3 seconds of each other. `lastWrong` is when the previous wrong one was, if any. */
export function rushed(lastWrong: number | undefined, now: number): boolean {
  return lastWrong !== undefined && now - lastWrong <= RUSH_WINDOW_MS;
}
