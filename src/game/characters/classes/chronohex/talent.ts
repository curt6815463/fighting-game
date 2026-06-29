// 天賦 因果 (causality)：
//   ・對帶「時咒」的敵人，自身造成的傷害 +curseAmp（固定值，不隨層數疊乘 → 避免引爆傷害爆炸）。
//   ・帶時咒的敵人死亡時，剩餘時咒擴散給周圍敵人（連同蝕傷與冷卻拖慢）—— 內聯於 damage.ts spreadTimehex。
import { registerTalent } from '../../talents/registry';

registerTalent('causality', {
  modifyOutgoing(c) {
    const h = c.target && c.target.effects && c.target.effects.timehex;
    if (h && h.stacks > 0) return c.dmg * (1 + (c.talent.curseAmp || 0.15));
    return c.dmg;
  },
});
