// 天賦 因果 (causality)：
//   1) 詛咒共鳴 — 對帶「時咒」的敵人，自身造成的傷害 +ampPerStack/層（先疊咒→打更痛）。
//   2) 死亡傳染 + 節奏引擎 — 帶時咒的敵人死亡時，剩餘時咒擴散給周圍敵人並回沖自身冷卻；
//      此部分內聯於 entities/damage.ts 的 spreadTimehex（aura 掃描 + 跨實體，與此 hook 互補）。
import { registerTalent } from '../../talents/registry';

registerTalent('causality', {
  modifyOutgoing(c) {
    const h = c.target && c.target.effects && c.target.effects.timehex;
    if (h && h.stacks > 0) return c.dmg * (1 + (c.talent.ampPerStack || 0.05) * h.stacks);
    return c.dmg;
  },
});
