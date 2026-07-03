import { PLAYER_RADIUS } from '../../../../../constants.js';
import { makeProjectile } from '../../../../../entities/factories.ts';
import { addFx } from '../../../../../entities/fx.ts';
import type { ActionContext } from '../../../../../types';

function analyzeHand(hand: any[]): { combo: string; mult: number; extraCount: number } {
  if (Array.isArray(hand) && hand.includes('J')) {
    return { combo: 'joker_flush', mult: 2.8, extraCount: 12 };
  }
  if (!Array.isArray(hand) || hand.length < 4) {
    return { combo: 'high_card', mult: 1.0, extraCount: 0 };
  }
  
  let r = 0, b = 0;
  for (const c of hand) {
    if (c === 'R') r++;
    if (c === 'B') b++;
  }

  // 1. Flush (同花): 4 of the same color
  if (r === 4 || b === 4) {
    return { combo: 'flush', mult: 2.2, extraCount: 8 };
  }
  // 2. Two Pairs (兩對): 2 red + 2 blue
  if (r === 2 && b === 2) {
    return { combo: 'two_pairs', mult: 1.6, extraCount: 8 };
  }
  // 3. Three of a Kind (三條): 3 of one color, 1 of another
  if (r === 3 || b === 3) {
    return { combo: 'three_of_a_kind', mult: 1.3, extraCount: 4 };
  }

  return { combo: 'high_card', mult: 1.0, extraCount: 0 };
}

export function royal_card_fan(ctx: ActionContext) {
  const { state, caster, action } = ctx;
  
  // Read current hand cards
  const hand = caster.royalCards !== undefined ? caster.royalCards : [];
  const { combo, mult, extraCount } = analyzeHand(hand);

  // Consume all hand cards (reset to empty array)
  caster.royalCards = [];

  // Show floating text popup for the Poker Combination
  let comboText = '';
  let popupColor = '#ffffff';
  if (combo === 'joker_flush') {
    comboText = '🃏 鬼牌狂歡 (Joker Flush) 🃏';
    popupColor = '#7b2ff7';
  } else if (combo === 'flush') {
    comboText = '♠ 同花 (Flush) ♠';
    popupColor = '#4cc9f0';
  } else if (combo === 'two_pairs') {
    comboText = '♥ 兩對 (Two Pairs) ♥';
    popupColor = '#7b2ff7';
  } else if (combo === 'three_of_a_kind') {
    comboText = '♣ 三條 (Three) ♣';
    popupColor = '#ffd166';
  } else {
    comboText = '♦ 雜牌 (High Card) ♦';
    popupColor = '#a8a8a8';
  }

  addFx(state, {
    type: 'popup',
    x: caster.x,
    y: caster.y - 45,
    color: popupColor,
    life: 1.2,
    text: comboText,
    kind: 'crit',
  });

  const baseCount = action.count !== undefined ? action.count : 3;
  const isRoyalFlush = combo === 'flush' || combo === 'joker_flush';
  const isJokerFlush = combo === 'joker_flush';
  const isTwoPairs = combo === 'two_pairs';
  
  const spread = action.spread || 0.42;
  const speed = action.speed || 820;
  const radius = action.radius || 9;
  const lifetime = action.lifetime || 1.0;
  
  // 1. Shoot base card fan
  for (let i = 0; i < baseCount; i++) {
    const offset = baseCount <= 1 ? 0 : (i / (baseCount - 1) - 0.5) * spread;
    const ang = caster.facing + offset;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    
    // Scale base damage by the combo multiplier
    const finalDmg = Math.round((action.dmg || 0) * mult);
    
    state.projectiles.push(makeProjectile(caster.id, caster.x + c * PLAYER_RADIUS, caster.y + s * PLAYER_RADIUS, c * speed, s * speed, {
      dmg: finalDmg,
      radius: isRoyalFlush ? radius * 1.25 : radius,
      lifetime,
      color: isJokerFlush ? '#7b2ff7' : (isRoyalFlush ? '#4cc9f0' : (isTwoPairs ? '#7b2ff7' : action.color)),
      knockback: isRoyalFlush ? (action.knockback || 0) * 1.4 : (action.knockback || 0),
      pierce: true,
      vfx: isJokerFlush ? 'royal_card_joker' : (isRoyalFlush ? 'royal_card_empowered' : action.vfx),
      srcSlot: ctx.source,
      royalCardFan: true,
      royalEmpowered: isRoyalFlush,
      royalEmpoweredDmg: action.empoweredDmg || action.dmg,
      royalEncoreDmg: action.encoreDmg || 14,
    }));
  }
  
  // 2. Shoot extra homing cards (based on combo strength)
  if (extraCount > 0) {
    const enemies = (Object.values(state.players) as any[]).filter((p: any) => p.id !== caster.id && p.alive);
    if ((state as any).bosses) {
      enemies.push(...(Object.values((state as any).bosses) as any[]).filter((b: any) => b.alive));
    }
    
    let targetEntity: any = null;
    let minDist = 999999;
    for (const enemy of enemies) {
      const d = Math.hypot(enemy.x - caster.x, enemy.y - caster.y);
      if (d < minDist) {
        minDist = d;
        targetEntity = enemy;
      }
    }
    
    for (let i = 0; i < extraCount; i++) {
      const angleOffset = extraCount <= 1 ? 0 : (i / (extraCount - 1) - 0.5) * 0.8;
      const ang = caster.facing + angleOffset;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      
      const homingDmg = isRoyalFlush 
        ? Math.round((action.dmg || 0) * 1.1) 
        : Math.round((action.dmg || 0) * 0.75);

      state.projectiles.push(makeProjectile(caster.id, caster.x + c * PLAYER_RADIUS, caster.y + s * PLAYER_RADIUS, c * speed * 0.8, s * speed * 0.8, {
        dmg: homingDmg,
        radius: isJokerFlush ? radius * 1.25 : radius * 0.75,
        lifetime: lifetime * 1.3,
        color: isJokerFlush ? '#7b2ff7' : (isRoyalFlush ? '#4cc9f0' : '#ffd166'),
        knockback: (action.knockback || 0) * 0.35,
        pierce: true,
        vfx: isJokerFlush ? 'royal_card_joker' : (isRoyalFlush ? 'royal_card_empowered' : 'royal_card_fan'),
        srcSlot: ctx.source,
        royalCardFan: true,
        royalEmpowered: isRoyalFlush,
        royalEmpoweredDmg: action.empoweredDmg || action.dmg,
        royalEncoreDmg: action.encoreDmg || 14,
        homing: isJokerFlush ? 5.5 : 4.5,
        royalJokerHoming: isJokerFlush,
      }));
    }
  }
}

export const handlers = { royal_card_fan };
