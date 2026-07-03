import { registerTalent } from '../../talents/registry';
import type { Player } from '../../../types';

function initHand(p: Player) {
  if (p.royalCards === undefined || !Array.isArray(p.royalCards)) {
    p.royalCards = ['J', 'R', 'B', 'R'];
  }
}

registerTalent('royal_encore', {
  onCastResolved(state, p: Player, action, slot) {
    if (slot === 'skill2') {
      const hasHat = (state.zones as any[]).some(
        (z) => z.royalHat && z.owner === p.id && z.lifetime > 0
      );
      if (hasHat) {
        // Reset recast CD to 0.8s to prevent instant double-cast swap bug
        p.cd.skill2 = 0.8;
        p.royalHatActive = true;
      }
    }
  }
});

export function tickRoyalMagician(state: any, p: Player, dt: number) {
  initHand(p);

  // Monitor Hat lifetime to trigger actual 7-second cooldown when it disappears/swapped
  const hasHat = (state.zones as any[]).some(
    (z) => z.royalHat && z.owner === p.id && z.lifetime > 0
  );

  if (p.royalHatActive && !hasHat) {
    p.royalHatActive = false;
    if (p.cd.skill2 < 5.8) {
      p.cd.skill2 = 6.0; // Trigger actual full CD
    }
  }
}
