import { ARENA, PLAYER_RADIUS } from '../../../../../constants.js';
import { clamp, dist } from '../../../../../entities/math.ts';
import { dealDamage } from '../../../../../entities/damage.ts';
import { applyEffect } from '../../../../../entities/effects.ts';
import { addFx } from '../../../../../entities/fx.ts';
import { isEnemy } from '../../../../../entities/team.ts';
import { meleeHit, outMult } from '../../../../../actions/combat.ts';
import type { ActionContext } from '../../../../../types';

function isControlled(o: any): boolean {
  const e = o.effects || {};
  return !!(e.root || e.stun || e.frozen);
}

function blinkBehind(caster: any, target: any) {
  const ang = target.facing + Math.PI;
  caster.x = clamp(target.x + Math.cos(ang) * (PLAYER_RADIUS * 2), PLAYER_RADIUS, ARENA.width - PLAYER_RADIUS);
  caster.y = clamp(target.y + Math.sin(ang) * (PLAYER_RADIUS * 2), PLAYER_RADIUS, ARENA.height - PLAYER_RADIUS);
  caster.facing = Math.atan2(target.y - caster.y, target.x - caster.x);
}

export function shadowstrike(ctx: ActionContext) {
  const { state, caster, cos, sin, silent } = ctx;
  const action = ctx.action as any;
  const range = action.range || 360;

  const cands = Object.values(state.players)
    .filter((o: any) => isEnemy(state, caster.id, o) && o.hp > 0 && isControlled(o))
    .sort((a: any, b: any) => {
      const da = dist(caster.x, caster.y, a.x, a.y);
      const db = dist(caster.x, caster.y, b.x, b.y);
      if (da !== db) return da - db;
      return Number(a.id) - Number(b.id);
    });
  const target = cands.find((o: any) => dist(caster.x, caster.y, o.x, o.y) <= range);

  if (target) {
    blinkBehind(caster, target);
    dealDamage(state, target, (action.dmg || 0) * outMult(caster, action), caster.id);
    if (action.knockback) {
      const dx = target.x - caster.x, dy = target.y - caster.y;
      const d = Math.hypot(dx, dy) || 1;
      target.kvx += dx / d * action.knockback;
      target.kvy += dy / d * action.knockback;
    }
    const sd = action.stealthDur || 1.5;
    applyEffect(caster, 'invis', { duration: sd });
    applyEffect(caster, 'evading', { duration: sd });
    if (!silent) {
      addFx(state, { type: 'blink', x: caster.x, y: caster.y, facing: caster.facing, range: range, color: action.color, life: 0.34, radius: action.hitRadius || PLAYER_RADIUS * 1.8, vfx: action.vfx, big: true });
    }
  } else {
    let dx = cos, dy = sin;
    const mvLen = Math.hypot(caster.vx || 0, caster.vy || 0);
    if (mvLen > 1) { dx = caster.vx / mvLen; dy = caster.vy / mvLen; }
    const r = action.fallbackRange || 300;
    caster.x = clamp(caster.x + dx * r, PLAYER_RADIUS, ARENA.width - PLAYER_RADIUS);
    caster.y = clamp(caster.y + dy * r, PLAYER_RADIUS, ARENA.height - PLAYER_RADIUS);
    meleeHit(state, caster, { dmg: (action.dmg || 0) * 0.4, range: action.hitRadius || 95, arc: 7, knockback: action.knockback, color: action.color, vfx: action.vfx }, silent, ctx.source);
    if (!silent) addFx(state, { type: 'blink', x: caster.x, y: caster.y, facing: caster.facing, range: r, color: action.color, life: 0.26, radius: PLAYER_RADIUS * 1.6, vfx: action.vfx });
  }
}

export function shadowflurry(ctx: ActionContext) {
  const { state, caster, silent } = ctx;
  const action = ctx.action as any;
  (caster as any)._ninjaClones = {
    remaining: action.duration || 3.5,
    count: action.count || 5,
    interval: action.interval || 0.26,
    dmg: action.dmg || 9,
    range: action.range || 460,
    orbit: action.orbit || 66,
    timer: 0,
    phase: 0,
  };
  if (!silent) addFx(state, { type: 'ultimate', x: caster.x, y: caster.y, facing: caster.facing, color: action.color, life: 0.6, vfx: action.vfx });
}

export const handlers = { shadowstrike, shadowflurry };
