import { startStarOrbitGuard } from '../../orbit.ts';
import type { ActionContext } from '../../../../../types';

export function star_orbit_guard(ctx: ActionContext) {
  startStarOrbitGuard(ctx);
}

export const handlers = { star_orbit_guard };
