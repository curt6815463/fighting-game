import { applyShield } from '../../../../../entities/shield.ts';
import { addFx } from '../../../../../entities/fx.ts';
import type { ActionContext } from '../../../../../types';

const RESET_SLOTS = ['basic', 'skill1', 'skill2', 'evade'];

export function chronoreset(ctx: ActionContext) {
  const { state, caster, action, silent } = ctx;
  if (caster.cd) for (const slot of RESET_SLOTS) caster.cd[slot] = 0;
  caster.mana = caster.maxMana;
  if (action.shield) applyShield(state, caster, action.shield, action.shieldDuration || 6);
  if (!silent) {
    addFx(state, { type: 'ultimate', x: caster.x, y: caster.y, facing: caster.facing, color: action.color, life: 0.8, radius: 200, vfx: action.vfx });
  }
}

export const handlers = { chronoreset };
