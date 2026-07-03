// 天賦 iaido（居合）：原地不施放時持續累積居合計時，出手時把下一次傷害窗口標成 iaiReady。
import { registerTalent } from '../../talents/registry';

registerTalent('iaido', {
  modifyOutgoing({ attacker, dmg, talent }) {
    return attacker.iaiReady ? dmg * (1 + (talent.bonus || 0.8)) : dmg;
  },
  onTimers(_state, p, dt) {
    p.iaiTimer = (p.iaiTimer || 0) + dt;
  },
  beforeActionExecute(_state, p, action, _slot, talent) {
    if (action.noIaiReset) return;
    p.iaiReady = p.iaiTimer >= (talent.delay || 2);
    p.iaiTimer = 0;
  },
  onCastResolved(_state, p) {
    p.iaiReady = false;
  },
});
