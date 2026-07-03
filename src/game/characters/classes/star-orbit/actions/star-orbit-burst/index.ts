import { startStarOrbitBurst } from '../../orbit.ts';
import type { ActionContext } from '../../../../../types';

export function star_orbit_burst(ctx: ActionContext) {
  startStarOrbitBurst(ctx);
}

export const handlers = { star_orbit_burst };
