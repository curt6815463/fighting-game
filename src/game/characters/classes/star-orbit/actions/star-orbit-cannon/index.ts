import { fireStarOrbitCannon } from '../../orbit.ts';
import type { ActionContext } from '../../../../../types';

export function star_orbit_cannon(ctx: ActionContext) {
  fireStarOrbitCannon(ctx);
}

export const handlers = { star_orbit_cannon };
