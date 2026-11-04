import branches from '../../content/branches.json';
import crewData from '../../content/crew.json';
import { buildContent, type SkillFile } from '../content/bank';
import type { Branch, CrewId } from '../content/types';

const files = Object.values(
  import.meta.glob<SkillFile>('../../content/skills/*.json', { eager: true, import: 'default' }),
);

export const content = buildContent(branches as Branch[], files);
export const crew = crewData as Record<CrewId, { name: string; role: string; passion: string }>;
export const GAME_TITLE = 'Inkwild';
