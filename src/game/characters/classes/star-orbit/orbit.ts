import { addFx } from '../../../entities/fx.ts';
import { dealDamage } from '../../../entities/damage.ts';
import { isEnemy } from '../../../entities/team.ts';
import { bodyR, outMult } from '../../../actions/combat.ts';
import type { ActionContext, Player } from '../../../types';

const MAX_SHARDS = 3;
const REGEN_TIME = 2.0;

function ensureOrbit(p: Player) {
  if (!p.starOrbit) {
    p.starOrbit = { shards: MAX_SHARDS, regenTimer: 0, visTimer: 0, angle: 0 };
  }
  p.starOrbit.shards = Math.max(0, Math.min(MAX_SHARDS, p.starOrbit.shards ?? MAX_SHARDS));
  p.starOrbit.regenTimer = p.starOrbit.regenTimer || 0;
  p.starOrbit.visTimer = p.starOrbit.visTimer || 0;
  p.starOrbit.angle = p.starOrbit.angle || 0;
  return p.starOrbit;
}

export function addStarShard(p: Player, amount = 1) {
  const orbit = ensureOrbit(p);
  orbit.shards = Math.min(MAX_SHARDS, orbit.shards + amount);
  orbit.regenTimer = 0;
}

export function startStarOrbitGuard(ctx: ActionContext) {
  const orbit = ensureOrbit(ctx.caster);
  orbit.shards = Math.max(orbit.shards, Math.min(MAX_SHARDS, ctx.action.refillTo || MAX_SHARDS));
  orbit.regenTimer = 0;
  if (!ctx.silent) {
    addFx(ctx.state, { type: 'buff', x: ctx.caster.x, y: ctx.caster.y, color: ctx.action.color || '#ffd166', life: 0.5, radius: 100, vfx: ctx.action.vfx, shards: orbit.shards });
  }
}

export function fireStarOrbitCannon(ctx: ActionContext) {
  const orbit = ensureOrbit(ctx.caster);
  const spent = Math.max(1, orbit.shards || 0);
  orbit.shards = 0;
  orbit.regenTimer = 0;
  const dmg = ((ctx.action.dmg || 46) + spent * (ctx.action.shardBonus || 24)) * outMult(ctx.caster, ctx.action) * ctx.damageMultiplier;
  const width = (ctx.action.width || 22) + spent * (ctx.action.shardWidth || 5);
  resolveBeam(ctx.state, ctx.caster, {
    dmg,
    range: ctx.action.range || 720,
    width,
    facing: ctx.caster.facing,
    knockback: ctx.action.knockback || 0,
    color: spent >= MAX_SHARDS ? '#ffd166' : (ctx.action.color || '#5ad7ff'),
    vfx: ctx.action.vfx,
    shards: spent,
    final: spent >= MAX_SHARDS,
  });
}

export function startStarOrbitBurst(ctx: ActionContext) {
  const orbit = ensureOrbit(ctx.caster);
  orbit.burst = {
    pulsesLeft: ctx.action.pulses || 3,
    totalPulses: ctx.action.pulses || 3,
    timer: 0,
    interval: ctx.action.interval || 0.34,
    range: ctx.action.range || 780,
    width: ctx.action.width || 42,
    finalWidth: ctx.action.finalWidth || ctx.action.width || 42,
    facing: ctx.caster.facing,
    dmg: ctx.action.dmg || 55,
    finalDmg: ctx.action.finalDmg || ctx.action.dmg || 55,
    knockback: ctx.action.knockback || 0,
    color: ctx.action.color || '#ffd166',
    vfx: ctx.action.vfx,
    srcSlot: ctx.source,
  };
  orbit.shards = 0;
}

export function tickStarOrbit(state: any, p: Player, dt: number) {
  const orbit = ensureOrbit(p);
  orbit.angle = (orbit.angle + dt * 2.8) % (Math.PI * 2);
  if (orbit.shards < MAX_SHARDS) {
    orbit.regenTimer += dt;
    while (orbit.shards < MAX_SHARDS && orbit.regenTimer >= REGEN_TIME) {
      orbit.regenTimer -= REGEN_TIME;
      orbit.shards += 1;
      addFx(state, { type: 'buff', x: p.x, y: p.y, color: '#5ad7ff', life: 0.24, radius: 52, vfx: 'star_orbit_shard', shards: orbit.shards, angle: orbit.angle });
    }
  } else {
    orbit.regenTimer = 0;
  }

  if (orbit.burst) tickBurst(state, p, orbit, dt);
}

function tickBurst(state: any, p: Player, orbit: any, dt: number) {
  const burst = orbit.burst;
  burst.timer -= dt;
  while (burst.pulsesLeft > 0 && burst.timer <= 0) {
    const pulseIndex = (burst.totalPulses || 3) - burst.pulsesLeft;
    const isFinal = burst.pulsesLeft === 1;
    const wobble = (pulseIndex - 1) * 0.035;
    resolveBeam(state, p, {
      range: burst.range,
      width: isFinal ? burst.finalWidth : burst.width,
      facing: burst.facing + wobble,
      dmg: isFinal ? burst.finalDmg : burst.dmg,
      knockback: burst.knockback,
      color: isFinal ? '#ffd166' : '#5ad7ff',
      vfx: burst.vfx,
      shards: isFinal ? 3 : pulseIndex + 1,
      final: isFinal,
      srcSlot: burst.srcSlot,
    });
    burst.pulsesLeft -= 1;
    burst.timer += burst.interval;
  }
  if (burst.pulsesLeft <= 0) {
    orbit.burst = null;
    orbit.regenTimer = 0;
  }
}

function resolveBeam(state: any, p: Player, beam: any) {
  const cos = Math.cos(beam.facing);
  const sin = Math.sin(beam.facing);
  for (const o of Object.values(state.players) as any[]) {
    if (!o.alive || !isEnemy(state, p.id, o)) continue;
    const dx = o.x - p.x;
    const dy = o.y - p.y;
    const forward = dx * cos + dy * sin;
    if (forward < -bodyR(o) || forward > beam.range + bodyR(o)) continue;
    const side = Math.abs(dx * -sin + dy * cos);
    if (side > beam.width + bodyR(o)) continue;
    dealDamage(state, o, beam.dmg, p.id, { source: beam.srcSlot });
    if (beam.knockback) {
      o.kvx += cos * beam.knockback;
      o.kvy += sin * beam.knockback;
    }
  }
  addFx(state, { type: 'hit', x: p.x, y: p.y, facing: beam.facing, color: beam.color, life: beam.final ? 0.42 : 0.3, range: beam.range, radius: beam.width, width: beam.width, vfx: beam.vfx, shards: beam.shards, final: beam.final });
}
