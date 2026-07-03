import { ARENA, PLAYER_RADIUS } from '../../../../../constants.js';
import { clamp } from '../../../../../entities/math.ts';
import { addFx } from '../../../../../entities/fx.ts';
import { isEnemy } from '../../../../../entities/team.ts';
import type { ActionContext } from '../../../../../types';

export function risingdragon(ctx: ActionContext) {
  const { state, caster, action, cos, sin, silent } = ctx;
  const maxChi = action.maxChi || 5;
  const chi = Math.min(maxChi, caster.chi || 0);
  caster.chi = 0;
  caster.chiGainCd = Math.max(caster.chiGainCd || 0, (action.dur || 0.5) + 0.2);
  const dmg = (action.dmg || 160) + chi * (action.dmgPerChi || 55);
  const range = action.range || 320;

  let aimX = caster.x + cos * range;
  let aimY = caster.y + sin * range;
  let best: any = null, bestD = Infinity;
  for (const o of Object.values(state.players) as any[]) {
    if (!o.alive || !isEnemy(state, caster.id, o)) continue;
    const d = Math.hypot(o.x - caster.x, o.y - caster.y);
    if (d < bestD) { bestD = d; best = o; }
  }
  if (best) {
    const d = Math.max(1, bestD);
    const reach = Math.min(d, range);
    aimX = caster.x + (best.x - caster.x) / d * reach;
    aimY = caster.y + (best.y - caster.y) / d * reach;
  }
  const tx = clamp(aimX, PLAYER_RADIUS, ARENA.width - PLAYER_RADIUS);
  const ty = clamp(aimY, PLAYER_RADIUS, ARENA.height - PLAYER_RADIUS);

  caster.leap = {
    t: 0,
    dur: action.dur || 0.5,
    fromx: caster.x,
    fromy: caster.y,
    tx,
    ty,
    dmg,
    radius: action.radius || 150,
    knockback: action.knockback || 650,
    effect: action.effect || null,
    leaveZone: null,
    color: action.color,
    vfx: action.vfx,
    srcSlot: ctx.source,
  };

  void silent;
  const dragonX = best ? best.x : tx;
  const dragonY = best ? best.y : ty;
  const targetR = best ? (best.hitR || PLAYER_RADIUS) : PLAYER_RADIUS;
  addFx(state, { type: 'ultimate', x: dragonX, y: dragonY, facing: caster.facing, color: action.color, life: 1.5, vfx: 'fighter_dragon', chi, dur: action.dur || 0.5, targetR });
}

export const handlers = { risingdragon };
