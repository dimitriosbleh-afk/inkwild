import type { Content } from '../content/types';
import type { Save } from './save';

const exists = (look: () => unknown): boolean => {
  try {
    look();
    return true;
  } catch {
    return false;
  }
};

/**
 * A save from before a content update can point at a Skill or Encounter that no longer exists. Opening it would crash
 * the game on every launch, so the activity under way is dropped (the Student just starts it again) and unknown
 * progress is left alone, since it does no harm and comes back if the content returns.
 */
export function repairSave(content: Content, save: Save): Save {
  const a = save.activity;
  if (!a) return save;
  const ok =
    a.kind === 'teach'
      ? exists(() => content.skill(a.skill))
      : a.kind === 'review'
        ? a.ids.length > 0 && a.at < a.ids.length && a.ids.every((id) => exists(() => content.encounter(id)))
        : exists(() => content.encounter(a.id)) && (a.kind !== 'keeper' || exists(() => content.branch(a.branch)));
  if (ok) return save;
  const { activity: _, ...rest } = save;
  return rest;
}
