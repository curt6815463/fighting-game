// 時厄術士 大招「時空奇點」：朝前方丟出時空奇點（黑洞）。
//   ・以施法者前方 range 處為奇點中心；範圍內敵人被「向內內爆」聚攏（pull 衝量）。
//   ・對每個敵人造成基礎傷害；帶「時咒」者額外承受 stacks × collapseBurst 清算爆傷。
//   ・引爆後重鋪滿時咒並定身/眩暈鎖場。無回溯、無隊友增益（自身 overdrive 由 runPostActionEffects 套用）。
import { dist } from '../../../entities/math.ts';
import { dealDamage } from '../../../entities/damage.ts';
import { applyEffect } from '../../../entities/effects.ts';
import { addFx } from '../../../entities/fx.ts';
import { isEnemy } from '../../../entities/team.ts';
import { outMult, applyEffectFrom } from '../../combat.ts';
import type { ActionContext } from '../../../types';

export function chronocollapse(ctx: ActionContext) {
  const { state, caster, silent, cos, sin } = ctx;
  const action = ctx.action as any;
  const m = outMult(caster, action);
  const radius = action.radius || 260;
  const baseDmg = action.dmg || 50;
  // 奇點中心：施法者前方 range 處（range 0 → 自身腳下）
  const cx = caster.x + cos * (action.range || 0);
  const cy = caster.y + sin * (action.range || 0);

  for (const o of Object.values(state.players) as any[]) {
    if (!o.alive || !isEnemy(state, caster.id, o)) continue;
    if (dist(cx, cy, o.x, o.y) > radius) continue;
    let dmg = baseDmg;
    const hex = o.effects && o.effects.timehex;
    if (hex && hex.stacks > 0) dmg += hex.stacks * (action.collapseBurst || 30);
    dealDamage(state, o, dmg * m, caster.id, { source: ctx.source });
    if (o.alive) {
      // 重鋪滿時咒＋延長（後續 DoT/補刀），並鎖場
      applyEffectFrom(state, o, {
        kind: 'timehex', stacks: action.refreshStacks || 5, duration: action.refreshDur || 5,
        vulnPer: action.vulnPer || 0.04, dmgPerStack: action.dmgPerStack || 1,
      }, caster.id, ctx.source);
      if (action.root) applyEffect(o, 'root', { duration: action.root });
      if (action.stun) applyEffect(o, 'stun', { duration: action.stun });
      // 內爆：把敵人吸向奇點中心
      if (action.pull) {
        const dx = cx - o.x, dy = cy - o.y, d = Math.hypot(dx, dy) || 1;
        o.kvx += dx / d * action.pull;
        o.kvy += dy / d * action.pull;
      }
    }
    if (!silent) addFx(state, { type: 'hit', x: o.x, y: o.y, color: action.color, life: 0.4, radius: 50, vfx: action.vfx });
  }

  if (!silent) addFx(state, { type: 'ultimate', x: cx, y: cy, facing: caster.facing, color: action.color, life: 0.9, radius, vfx: action.vfx });
}

export const handlers = { chronocollapse };
