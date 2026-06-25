import { angleDiff } from '../../../entities/math.ts';
import { addFx } from '../../../entities/fx.ts';
import { applyShield } from '../../../entities/shield.ts';
import { dealDamage } from '../../../entities/damage.ts';
import { isEnemy } from '../../../entities/team.ts';
import { applyEffectFrom, bodyR } from '../../../actions/combat.ts';
import type { ActionContext } from '../../../types';

export function startSamuraiIaijutsu(ctx: ActionContext) {
  const { state, caster, action, cos, sin, silent } = ctx;
  const count = action.count || 3;
  const delay = action.strikeDelay || 0.32;
  const spread = action.spread ?? 0.42;
  const offsets = count === 3
    ? [-spread, spread, 0]
    : Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * spread);

  caster.samuraiIaijutsu = {
    strikes: offsets.map((offset, i) => ({
      x: caster.x,
      y: caster.y,
      facing: caster.facing + offset,
      range: action.range || 760,
      radius: action.radius || 34,
      dmg: i === count - 1 ? (action.finalDmg || action.dmg || 80) : (action.dmg || 80),
      knockback: action.knockback || 0,
      effect: i === count - 1 ? action.effect : null,
      remaining: delay * (i + 1),
      telegraphLife: delay * (i + 1),
      color: i === count - 1 ? (action.color || '#d94343') : (action.telegraphColor || '#f2f0dc'),
      impactColor: action.color || '#d94343',
      vfx: action.vfx,
      final: i === count - 1,
      srcSlot: ctx.source,
    })),
  };

  if (action.self?.shield) {
    applyShield(state, caster, action.self.shield, action.self.duration || 1);
  }
  if (!silent) {
    addFx(state, {
      type: 'ultimate',
      x: caster.x + cos * 24,
      y: caster.y + sin * 24,
      facing: caster.facing,
      color: action.color || '#d94343',
      life: 0.45,
      radius: 120,
      vfx: action.vfx,
    });
  }
}

export function tickSamuraiIaijutsu(state: any, samurai: any, dt: number) {
  const seq = samurai.samuraiIaijutsu;
  if (!seq || !seq.strikes || !seq.strikes.length) return;
  const keep = [];
  for (const strike of seq.strikes) {
    strike.remaining -= dt;
    const total = Math.max(0.01, strike.telegraphLife || 0.32);
    const progress = Math.max(0, Math.min(1, 1 - strike.remaining / total));
    addFx(state, {
      type: 'telegraph',
      x: strike.x,
      y: strike.y,
      facing: strike.facing,
      color: strike.remaining <= 0.12 ? '#d94343' : strike.color || '#f2f0dc',
      radius: strike.radius,
      range: strike.range,
      shape: 'line',
      progress,
      life: 0.12,
      danger: 'lethal',
    });
    if (strike.remaining > 0) {
      keep.push(strike);
      continue;
    }
    resolveSamuraiStrike(state, samurai, strike);
  }
  if (keep.length) seq.strikes = keep;
  else samurai.samuraiIaijutsu = null;
}

function resolveSamuraiStrike(state: any, samurai: any, strike: any) {
  const cos = Math.cos(strike.facing);
  const sin = Math.sin(strike.facing);
  for (const o of Object.values(state.players) as any[]) {
    if (!o.alive || !isEnemy(state, samurai.id, o)) continue;
    const dx = o.x - strike.x;
    const dy = o.y - strike.y;
    const forward = dx * cos + dy * sin;
    if (forward < -bodyR(o) || forward > strike.range + bodyR(o)) continue;
    const perp = Math.abs(Math.sin(angleDiff(Math.atan2(dy, dx), strike.facing)) * Math.hypot(dx, dy));
    if (perp > strike.radius + bodyR(o)) continue;
    dealDamage(state, o, strike.dmg || 0, samurai.id, { meleeHit: true, source: strike.srcSlot });
    if (strike.knockback) {
      o.kvx += cos * strike.knockback;
      o.kvy += sin * strike.knockback;
    }
    if (strike.effect) applyEffectFrom(state, o, strike.effect, samurai.id, strike.srcSlot);
  }
  addFx(state, {
    type: 'hit',
    x: strike.x + cos * Math.min(strike.range * 0.55, 420),
    y: strike.y + sin * Math.min(strike.range * 0.55, 420),
    facing: strike.facing,
    color: strike.impactColor || '#d94343',
    life: 0.24,
    radius: strike.radius * 2.2,
    vfx: strike.vfx,
  });
}
