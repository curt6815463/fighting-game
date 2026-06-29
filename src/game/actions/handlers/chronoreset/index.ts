// 時厄術士 大招「時厄重置」：純功能型 tempo 大招（無傷害、無補血）。
//   ・重置所有技能冷卻（不含大招自己）→ 立刻能再丟兩發引爆咒。
//   ・回滿魔力。
//   ・獲得護盾（不補血，純擋傷）。
import { applyShield } from '../../../entities/shield.ts';
import { addFx } from '../../../entities/fx.ts';
import type { ActionContext } from '../../../types';

const RESET_SLOTS = ['basic', 'skill1', 'skill2', 'evade'];

export function chronoreset(ctx: ActionContext) {
  const { state, caster, action, silent } = ctx;
  if (caster.cd) for (const slot of RESET_SLOTS) caster.cd[slot] = 0;   // 重置技能冷卻（不含 ultimate）
  caster.mana = caster.maxMana;                                         // 回滿魔力
  if (action.shield) applyShield(state, caster, action.shield, action.shieldDuration || 6); // 護盾（不補血）
  if (!silent) {
    addFx(state, { type: 'ultimate', x: caster.x, y: caster.y, facing: caster.facing, color: action.color, life: 0.8, radius: 200, vfx: action.vfx });
  }
}

export const handlers = { chronoreset };
