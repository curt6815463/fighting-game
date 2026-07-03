import { registerTalent } from '../../talents/registry';

registerTalent('warsong', {
  outgoingAura({ state, owner, attacker, dmg, talent, isAlly }) {
    if (!(owner.id === attacker.id || isAlly(state, owner.id, attacker))) return dmg;
    const radius = talent.radius || 250;
    if (Math.hypot(owner.x - attacker.x, owner.y - attacker.y) > radius) return dmg;

    let allies = 0;
    for (const other of Object.values(state.players) as any[]) {
      if (!other.alive) continue;
      if (!(other.id === owner.id || isAlly(state, owner.id, other))) continue;
      if (Math.hypot(owner.x - other.x, owner.y - other.y) <= radius) allies++;
    }
    const bonus = Math.min(talent.maxAllies || 3, Math.max(0, allies - 1)) * (talent.perAlly || 0.05);
    return bonus > 0 ? dmg * (1 + bonus) : dmg;
  },
});
