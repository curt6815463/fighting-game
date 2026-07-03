import { ARENA, PLAYER_RADIUS } from '../../../../../constants.js';
import { makeZone } from '../../../../../entities/factories.ts';
import { addFx } from '../../../../../entities/fx.ts';
import { clamp } from '../../../../../entities/math.ts';
import type { ActionContext } from '../../../../../types';

export function royal_hat_trick(ctx: ActionContext) {
  const { state, caster, action, cos, sin } = ctx;
  
  // Find if there is an active magic hat owned by the caster
  const activeHat = (state.zones as any[]).find(
    (z) => z.royalHat && z.owner === caster.id && z.lifetime > 0
  );

  if (activeHat) {
    // 1. Hat Swap (Teleport caster to the Hat and destroy the Hat)
    // 2nd Cast: Completely FREE of mana!
    const fromX = caster.x;
    const fromY = caster.y;
    
    caster.x = clamp(activeHat.x, PLAYER_RADIUS, ARENA.width - PLAYER_RADIUS);
    caster.y = clamp(activeHat.y, PLAYER_RADIUS, ARENA.height - PLAYER_RADIUS);
    
    activeHat.lifetime = 0; // Destroy the hat zone

    // Play swap blink visual effects
    addFx(state, { type: 'blink', x: fromX, y: fromY, facing: caster.facing, color: action.color, life: 0.3, radius: activeHat.radius || 70, vfx: 'royal_hat_blink' });
    addFx(state, { type: 'blink', x: caster.x, y: caster.y, facing: caster.facing, color: action.color, life: 0.28, radius: PLAYER_RADIUS * 1.8, vfx: 'royal_hat_blink' });
  } else {
    // 2. Deploy Hat (1st Cast: Costs 22 mana)
    const freeMana = state.flags && state.flags.freeMana;
    if (!freeMana && caster.mana < 22) {
      // Show mana warning popup
      addFx(state, { type: 'popup', x: caster.x, y: caster.y - 45, color: '#ff3333', life: 0.8, text: '魔力不足', kind: 'damage' });
      return;
    }
    
    if (!freeMana) {
      caster.mana -= 22;
    }

    const range = action.range || 180;
    const targetX = clamp(caster.x + cos * range, PLAYER_RADIUS, ARENA.width - PLAYER_RADIUS);
    const targetY = clamp(caster.y + sin * range, PLAYER_RADIUS, ARENA.height - PLAYER_RADIUS);

    const hatZone = makeZone(caster.id, targetX, targetY, {
      radius: 70,
      dmg: 0,
      lifetime: 4.0,
      tick: 4.0,
      color: action.color,
      vfx: 'royal_hat_zone',
    }) as any;
    hatZone.royalHat = true;
    hatZone.srcSlot = ctx.source;
    
    state.zones.push(hatZone);

    addFx(state, { type: 'blink', x: targetX, y: targetY, facing: caster.facing, color: action.color, life: 0.35, radius: 70, vfx: 'royal_hat_blink' });
  }
}

export const handlers = { royal_hat_trick };
