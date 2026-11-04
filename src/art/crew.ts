import type { CrewId } from '../content/types';
import type { CaptainLook } from '../core/save';
import { captainCanvas } from './captain';

export const CREW_LOOKS: Record<CrewId, CaptainLook> = {
  nav: { skin: 1, hair: 0, hairColour: 4, outfit: 3, colour: 1 },
  engineer: { skin: 3, hair: 1, hairColour: 0, outfit: 2, colour: 2 },
  gamer: { skin: 0, hair: 8, hairColour: 5, outfit: 4, colour: 4 },
  rescuer: { skin: 2, hair: 4, hairColour: 1, outfit: 5, colour: 5 },
  artist: { skin: 4, hair: 7, hairColour: 0, outfit: 7, colour: 3 },
  joker: { skin: 1, hair: 6, hairColour: 2, outfit: 1, colour: 7 },
};

export function crewCanvas(id: CrewId, scale: number): HTMLCanvasElement {
  return captainCanvas(CREW_LOOKS[id], scale);
}
