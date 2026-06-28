// 時厄術士 K「時間錯亂」：對範圍內敵人施加擾亂（錯亂反向操作＋致盲黑屏＋緩速）——惱人控制；
// 同時對帶「時咒」者「快轉引爆」（依層數一次結算未來蝕傷 stacks × accelBurst，瞬間爆發）並刷新時咒。
// 控制範圍內全部敵人；引爆只結算已疊咒者。無自我增益、無隊友增益（低 DPS、靠引爆爆發）。
import { dist } from '../../../entities/math.ts';
import { dealDamage } from '../../../entities/damage.ts';
import { applyEffect } from '../../../entities/effects.ts';
import { addFx } from '../../../entities/fx.ts';
import { isEnemy } from '../../../entities/team.ts';
import { outMult, applyEffectFrom } from '../../combat.ts';
import type { ActionContext } from '../../../types';

export function chronoaccel(ctx: ActionContext) {
  const { state, caster, silent } = ctx;
  const action = ctx.action as any;
  const m = outMult(caster, action);
  const radius = action.radius || 300;

  for (const o of Object.values(state.players) as any[]) {
    if (!o.alive || !isEnemy(state, caster.id, o)) continue;
    if (dist(caster.x, caster.y, o.x, o.y) > radius) continue;
    // 擾亂：所有範圍內敵人（即使沒疊咒也會被惡心到）
    if (action.scramble) applyEffect(o, 'scramble', { duration: action.scramble });
    if (action.blind) applyEffect(o, 'blind', { duration: action.blind });
    if (action.slow) applyEffect(o, 'slow', { duration: action.slow.duration || 1.2, factor: action.slow.factor || 0.5 });
    // 快轉引爆：對帶時咒者依層數瞬間爆發 + 刷新易傷窗口（stacks:0 → 純延長、不加層）
    const hex = o.effects && o.effects.timehex;
    if (hex && hex.stacks > 0) {
      dealDamage(state, o, hex.stacks * (action.accelBurst || 20) * m, caster.id, { source: ctx.source });
      if (o.alive) {
        applyEffectFrom(state, o, {
          kind: 'timehex', stacks: 0, duration: action.refreshDur || hex.remaining,
          vulnPer: hex.vulnPer, dmgPerStack: hex.dmgPerStack, cdSlowPer: hex.cdSlowPer,
        }, caster.id, ctx.source);
      }
    }
    if (!silent) addFx(state, { type: 'hit', x: o.x, y: o.y, color: action.color, life: 0.4, radius: 44, vfx: action.vfx });
  }

  if (!silent) addFx(state, { type: 'buff', x: caster.x, y: caster.y, color: action.color, life: 0.4, radius, owner: caster.id, vfx: action.vfx });
}

export const handlers = { chronoaccel };
