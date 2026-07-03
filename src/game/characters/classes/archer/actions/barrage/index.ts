import { PLAYER_RADIUS } from '../../../../../constants.js';
import { makeProjectile } from '../../../../../entities/factories.ts';
import { addFx } from '../../../../../entities/fx.ts';
import { outMult } from '../../../../../actions/combat.ts';
import type { ActionContext, GameState, Player } from '../../../../../types';

export function barrage(ctx: ActionContext) {
  const { caster, action } = ctx;
  caster.barrage = {
    remaining: action.duration || 3,
    fireTimer: 0,
    interval: action.interval || 0.1,
    facing: caster.facing,
    dmg: action.dmg || 12,
    speed: action.speed || 900,
    radius: action.radius || 13,
    lifetime: action.lifetime || 0.9,
    knockback: action.knockback || 0,
    pierce: !!action.pierce,
    spread: action.spread || 0,
    color: action.color,
    vfx: action.vfx,
    effect: action.effect || null,
    srcSlot: ctx.source,
  };
  caster.actionFacingLock = 'archer-barrage';
}

export function tickArcherBarrage(state: GameState, p: Player, dt: number) {
  const b = p.barrage;
  if (!b) {
    if (p.actionFacingLock === 'archer-barrage') p.actionFacingLock = null;
    return;
  }

  p.actionFacingLock = 'archer-barrage';
  p.facing = b.facing;
  b.remaining -= dt;
  b.fireTimer -= dt;
  const m = outMult(p, b);
  while (b.fireTimer <= 0) {
    b.fireTimer += b.interval;
    const ang = b.facing + (b.spread ? (Math.random() - 0.5) * b.spread : 0);
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    state.projectiles.push(makeProjectile(p.id, p.x + c * PLAYER_RADIUS, p.y + s * PLAYER_RADIUS, c * b.speed, s * b.speed, {
      dmg: b.dmg * m,
      radius: b.radius,
      lifetime: b.lifetime,
      color: b.color,
      knockback: b.knockback,
      pierce: b.pierce,
      effect: b.effect,
      vfx: b.vfx,
      srcSlot: b.srcSlot,
    }));
    addFx(state, { type: 'hit', x: p.x + c * PLAYER_RADIUS, y: p.y + s * PLAYER_RADIUS, color: b.color, life: 0.12, radius: b.radius * 1.4, vfx: b.vfx });
  }

  if (b.remaining <= 0) {
    p.barrage = null;
    if (p.actionFacingLock === 'archer-barrage') p.actionFacingLock = null;
  }
}

export const handlers = { barrage };
