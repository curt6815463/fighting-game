// 天賦 bloodlust（嗜血）：造成傷害時依「失血比」吸血回復。
// 註：另有「血量越低冷卻越快」的攻速效果仍內聯於 systems/playerState.ts（每幀冷卻流速，
// 屬另一個 hot-path call-site，之後可隨 cooldownRate hook 搬移）。
import { registerTalent } from '../../talents/registry';
import { missingHp } from '../../../entities/math.ts';

registerTalent('bloodlust', {
  onDealt({ state, attacker, dmg, talent, addFx }) {
    const lifesteal = dmg * (talent.lifesteal || 0.25) * (0.4 + missingHp(attacker));
    if (lifesteal > 0) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + lifesteal);
      addFx(state, { type: 'popup', x: attacker.x, y: attacker.y, color: '#5cffa6', life: 0.7, text: `+${Math.round(lifesteal)}`, kind: 'heal' });
    }
  },
});
