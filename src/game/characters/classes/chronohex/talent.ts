// 天賦 因果 (causality)：
//   ・對帶「時咒」的敵人，自身造成的傷害 +curseAmp（固定值，不隨層數疊乘 → 避免引爆傷害爆炸）。
//   ・帶時咒的敵人死亡時，剩餘時咒擴散給周圍敵人（連同蝕傷與冷卻拖慢）。
import { registerTalent } from '../../talents/registry';

registerTalent('causality', {
  modifyOutgoing(c) {
    const h = c.target && c.target.effects && c.target.effects.timehex;
    if (h && h.stacks > 0) return c.dmg * (1 + (c.talent.curseAmp || 0.15));
    return c.dmg;
  },
  onEntityDeath({ state, owner, corpse, talent, applyEffect, addFx, isEnemy }) {
    const hex = corpse.effects && corpse.effects.timehex;
    if (!hex) return;
    if (hex.srcId != null && hex.srcId !== owner.id) return;

    const radius = talent.radius || 220;
    const half = Math.max(1, Math.ceil((hex.stacks || 1) / 2));
    for (const other of Object.values(state.players) as any[]) {
      if (other.id === corpse.id || !isEnemy(state, owner.id, other)) continue;
      if (Math.hypot(other.x - corpse.x, other.y - corpse.y) <= radius) {
        applyEffect(other, 'timehex', {
          stacks: half,
          duration: hex.remaining,
          vulnPer: hex.vulnPer,
          dmgPerStack: hex.dmgPerStack,
          cdSlowPer: hex.cdSlowPer,
        }, owner.id);
      }
    }

    const refund = talent.cdRefund || 1.5;
    if (owner.cd) for (const slot of ['skill1', 'skill2', 'ultimate']) {
      if (owner.cd[slot] > 0) owner.cd[slot] = Math.max(0, owner.cd[slot] - refund);
    }
    addFx(state, { type: 'buff', x: corpse.x, y: corpse.y, color: '#b07cff', life: 0.4, radius, vfx: 'chronohex_field' });
  },
});
