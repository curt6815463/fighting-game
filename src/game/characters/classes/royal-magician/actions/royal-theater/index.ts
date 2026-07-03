import { makeZone } from '../../../../../entities/factories.ts';
import { addFx } from '../../../../../entities/fx.ts';
import type { ActionContext } from '../../../../../types';

function analyzeHand(hand: any[]): { combo: string; mult: number } {
  if (Array.isArray(hand) && hand.includes('J')) {
    return { combo: 'joker_flush', mult: 3.0 };
  }
  if (!Array.isArray(hand) || hand.length < 4) {
    return { combo: 'high_card', mult: 1.0 };
  }
  
  let r = 0, b = 0;
  for (const c of hand) {
    if (c === 'R') r++;
    if (c === 'B') b++;
  }

  if (r === 4 || b === 4) {
    return { combo: 'flush', mult: 2.2 };
  }
  if (r === 2 && b === 2) {
    return { combo: 'two_pairs', mult: 1.6 };
  }
  if (r === 3 || b === 3) {
    return { combo: 'three_of_a_kind', mult: 1.3 };
  }

  return { combo: 'high_card', mult: 1.0 };
}

export function royal_theater(ctx: ActionContext) {
  const { state, caster, action } = ctx;
  const hand = caster.royalCards !== undefined ? caster.royalCards : [];
  const { combo, mult } = analyzeHand(hand);

  // Consume all hand cards
  caster.royalCards = [];

  // Show floating text popup for the Poker Combination in the Theater
  let comboText = '';
  let popupColor = '#ffffff';
  if (combo === 'joker_flush') {
    comboText = '🃏 幻象鬼牌狂歡 🃏';
    popupColor = '#7b2ff7';
  } else if (combo === 'flush') {
    comboText = '♠ 幻象同花 ♠';
    popupColor = '#4cc9f0';
  } else if (combo === 'two_pairs') {
    comboText = '♥ 幻象兩對 ♥';
    popupColor = '#7b2ff7';
  } else if (combo === 'three_of_a_kind') {
    comboText = '♣ 幻象三條 ♣';
    popupColor = '#ffd166';
  } else {
    comboText = '♦ 幻象劇場 ♦';
    popupColor = '#a8a8a8';
  }

  addFx(state, {
    type: 'popup',
    x: caster.x,
    y: caster.y - 45,
    color: popupColor,
    life: 1.3,
    text: comboText,
    kind: 'crit',
  });

  // Find if there is an active magic hat to deploy the theater on
  const activeHat = (state.zones as any[]).find(
    (z) => z.royalHat && z.owner === caster.id && z.lifetime > 0
  );

  const centerX = activeHat ? activeHat.x : caster.x;
  const centerY = activeHat ? activeHat.y : caster.y;

  if (activeHat) {
    activeHat.lifetime = 0; // Consume the hat
    addFx(state, { type: 'hit', x: centerX, y: centerY, color: '#4cc9f0', life: 0.4, radius: activeHat.radius || 70, vfx: 'royal_card_empower' });
  }

  // 1. Stage Curtain Pull (Pull Encore marked enemies to the theater center)
  for (const key in state.players) {
    const target = state.players[key];
    if (target.id !== caster.id && target.alive && target.effects && target.effects.encore) {
      const dx = centerX - target.x;
      const dy = centerY - target.y;
      target.x += dx * 0.65;
      target.y += dy * 0.65;
      addFx(state, { type: 'hit', x: target.x, y: target.y, color: '#c9184a', life: 0.3, radius: 42, vfx: 'royal_encore' });
    }
  }
  
  if (state.bosses) {
    for (const key in state.bosses) {
      const target = state.bosses[key];
      if (target.alive && target.effects && target.effects.encore) {
        const dx = centerX - target.x;
        const dy = centerY - target.y;
        // Bosses pull 35%
        target.x += dx * 0.35;
        target.y += dy * 0.35;
        addFx(state, { type: 'hit', x: target.x, y: target.y, color: '#c9184a', life: 0.35, radius: 60, vfx: 'royal_encore' });
      }
    }
  }

  // 2. Spawn main Theater zone
  const isJokerFlush = combo === 'joker_flush';
  const theaterVfx = isJokerFlush ? 'royal_theater_joker' : (action.vfx || 'royal_theater');

  const theaterDmg = Math.round((action.dmg || 0) * mult);
  const main = makeZone(caster.id, centerX, centerY, {
    ...action,
    dmg: theaterDmg,
    vfx: theaterVfx,
  }) as any;
  main.srcSlot = ctx.source;
  state.zones.push(main);

  // 3. Queue final explosion (Finale) at the end of the theater's duration
  const isFlush = combo === 'flush' || combo === 'joker_flush';
  const finalDmg = isJokerFlush 
    ? (action.finalDmg || 55) * 3.0 
    : (isFlush ? (action.finalDmg || 55) * 2.2 : (action.finalDmg || 55));
  const finalKb = isFlush ? (action.finalKnockback || 120) * 1.5 : (action.finalKnockback || 120);

  const finale = makeZone(caster.id, centerX, centerY, {
    radius: action.finalRadius || 150,
    dmg: Math.round(finalDmg),
    lifetime: 0.18,
    tick: 0.18,
    delay: action.lifetime || 3.2,
    knockback: Math.round(finalKb),
    color: isJokerFlush ? '#7b2ff7' : (action.finalColor || '#ffd166'),
    vfx: isJokerFlush ? 'royal_theater_joker_finale' : 'royal_theater_finale',
  }) as any;
  finale.srcSlot = ctx.source;
  finale.royalFinale = true;
  state.zones.push(finale);

  addFx(state, { type: 'ultimate', x: centerX, y: centerY, facing: caster.facing, color: isJokerFlush ? '#7b2ff7' : action.color, life: 1.0, radius: action.radius, vfx: theaterVfx });
}

export const handlers = { royal_theater };
