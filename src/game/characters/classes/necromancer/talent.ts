import { registerTalent } from '../../talents/registry';

registerTalent('undeath', {
  modifyDotDamage({ target, dmg, talent }) {
    if (!talent.execBonus) return dmg;
    const frac = target.maxHp ? target.hp / target.maxHp : 1;
    return frac <= (talent.execThreshold || 0.35) ? dmg * (1 + talent.execBonus) : dmg;
  },
  onDotDealt({ state, source, dmg, talent, applyHeal }) {
    applyHeal(state, source, dmg * (talent.factor || 0.15));
  },
});
