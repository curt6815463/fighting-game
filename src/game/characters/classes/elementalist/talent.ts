import { registerTalent } from '../../talents/registry';

registerTalent('pyromancy', {
  modifyAppliedEffect({ effect, talent, role }) {
    if (role === 'source' && effect.kind === 'burn') {
      return {
        ...effect,
        dmg: Math.round((effect.dmg || 0) * (talent.burnDmg || 1.5)),
        duration: (effect.duration || 2) * (talent.burnDur || 1.4),
      };
    }
    if (role === 'target' && effect.kind === 'chill' && (effect.stacks || 1) >= (effect.max || 4)) {
      return { ...effect, stacks: 1 };
    }
    return effect;
  },
});
