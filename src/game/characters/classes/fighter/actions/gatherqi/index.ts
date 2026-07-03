import { addFx } from '../../../../../entities/fx.ts';
import type { ActionContext } from '../../../../../types';

export function gatherqi(ctx: ActionContext) {
  const { state, caster, action, silent } = ctx;
  const max = action.maxChi || 5;
  const before = caster.chi || 0;
  caster.chi = Math.min(max, before + (action.gain || 1));
  caster.chiIdle = 0;
  if (!silent) {
    addFx(state, { type: 'buff', x: caster.x, y: caster.y, facing: caster.facing, color: action.color, life: 0.6, vfx: action.vfx, chi: caster.chi, full: caster.chi >= max });
  }
}

export const handlers = { gatherqi };
