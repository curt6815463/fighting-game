import { dealDamage } from '../../../entities/damage.ts';
import { addFx } from '../../../entities/fx.ts';
import { applyEffect } from '../../../entities/effects.ts';
import { registerProjectileAfterMoveHook, registerProjectileHitHook } from '../../../systems/projectileHooks.ts';
import type { ProjectileAfterMoveContext, ProjectileHitContext } from '../../../systems/projectileHooks.ts';

function segmentCircleIntersects(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, r: number) {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  if (len2 <= 1e-6) return Math.hypot(bx - cx, by - cy) <= r;
  const t = Math.max(0, Math.min(1, ((cx - ax) * abx + (cy - ay) * aby) / len2));
  const px = ax + abx * t;
  const py = ay + aby * t;
  return Math.hypot(px - cx, py - cy) <= r;
}

function empowerRoyalCardThroughHat({ state, projectile, prevX, prevY }: ProjectileAfterMoveContext) {
  if (!projectile.royalCardFan || projectile.royalEmpowered) return;
  
  // Find active Magic Hat zone owned by the same caster
  const hat = (state.zones as any[]).find((z) => (
    z.royalHat &&
    z.owner === projectile.owner &&
    z.lifetime > 0 &&
    segmentCircleIntersects(prevX, prevY, projectile.x, projectile.y, z.x, z.y, z.radius || 70)
  ));
  
  if (!hat) return;

  // Passing through Magic Hat shuffles the card directly into Flush (Empowered) card!
  projectile.royalEmpowered = true;
  projectile.dmg = Math.round((projectile.royalEmpoweredDmg || projectile.dmg) * 2.2);
  projectile.color = '#4cc9f0';
  projectile.vfx = 'royal_card_empowered';
  
  addFx(state, { type: 'hit', x: hat.x, y: hat.y, color: '#4cc9f0', life: 0.35, radius: hat.radius || 70, vfx: 'royal_card_empower' });
}

function encoreBurst({ state, projectile, target }: ProjectileHitContext) {
  // If basic attack (royal_card) hits, shuffle a new card into the royal hand
  if (projectile.vfx === 'royal_card') {
    const owner = state.players[projectile.owner];
    if (owner && owner.alive) {
      if (owner.royalCards === undefined || !Array.isArray(owner.royalCards)) {
        owner.royalCards = [];
      }
      // 10% Joker (J), 45% Red (R), 45% Blue (B)
      const rand = Math.random();
      const newCard = rand < 0.10 ? 'J' : (rand < 0.55 ? 'R' : 'B');

      if (owner.royalCards.length >= 4) {
        // Trigger 5th card negative effect: Overdraw Backlash (50 shield, 30% slow for 3s, 90% dmg_reduce for 10s)
        applyEffect(owner, 'shield', { amount: 50, duration: 3.0, state });
        applyEffect(owner, 'slow', { duration: 3.0, factor: 0.70 });
        applyEffect(owner, 'dmg_reduce', { duration: 10.0, factor: 0.90 });
        
        addFx(state, {
          type: 'popup',
          x: owner.x,
          y: owner.y - 45,
          color: '#c9184a',
          life: 1.2,
          text: '💥 魔力反噬！',
          kind: 'crit',
        });

        // 身上的手牌要丟光
        owner.royalCards = [];
      } else {
        owner.royalCards.push(newCard);
      }
    }
  }

  if (!projectile.royalCardFan) return;

  // Apply scramble (錯亂) for 1.5s if this is a Joker Homing card
  if (projectile.royalJokerHoming && target.effects) {
    applyEffect(target, 'scramble', { duration: 1.5 }, projectile.owner);
    addFx(state, { type: 'hit', x: target.x, y: target.y, color: '#7b2ff7', life: 0.35, radius: 48, vfx: 'royal_card_empower' });
  }

  // Apply root (定身) for 1.2s if this is a Flush (royalEmpowered) card
  if (projectile.royalEmpowered && !projectile.royalJokerHoming && target.effects) {
    applyEffect(target, 'root', { duration: 1.2 }, projectile.owner);
    addFx(state, { type: 'hit', x: target.x, y: target.y, color: '#4cc9f0', life: 0.35, radius: 48, vfx: 'royal_card_empower' });
  }

  const encore = target.effects && target.effects.encore;
  if (!encore || encore.srcId !== projectile.owner) return;
  const dmg = projectile.royalEncoreDmg || 14;
  if (dmg > 0) dealDamage(state, target, dmg, projectile.owner, { noTalent: true, source: projectile.srcSlot });
  addFx(state, { type: 'hit', x: target.x, y: target.y, color: '#ffd166', life: 0.3, radius: 58, vfx: 'royal_encore' });
  delete target.effects.encore;
}

registerProjectileAfterMoveHook(empowerRoyalCardThroughHat);
registerProjectileHitHook(encoreBurst);
