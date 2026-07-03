// 天賦 virulence（劇毒）：對中毒中的敵人增傷，毒傷一部分轉為治療給來源。
// 「劇毒無限疊加」本身由 poison 效果（entities/effects.ts）實作；此處只負責直擊增傷。
import { registerTalent } from '../../talents/registry';

registerTalent('virulence', {
  modifyOutgoing({ target, dmg, talent }) {
    if (target.effects && target.effects.poison) return dmg * (1 + (talent.bonus || 0.2));
    return dmg;
  },
  onDotDealt({ state, source, kind, dmg, talent, applyHeal }) {
    if (kind === 'poison') applyHeal(state, source, dmg * (talent.lifesteal || 0.3));
  },
});
