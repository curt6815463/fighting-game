import { dist } from '../../../../../entities/math.ts';
import { dealDamage } from '../../../../../entities/damage.ts';
import { addFx } from '../../../../../entities/fx.ts';
import { isEnemy } from '../../../../../entities/team.ts';
import { outMult, applyEffectFrom } from '../../../../../actions/combat.ts';
import type { ActionContext } from '../../../../../types';

export function plaguenova(ctx: ActionContext) {
  const { state, caster, silent } = ctx;
  const action = ctx.action as any;
  const burst = action.burstPerStack || 8;
  const spreadRadius = action.spreadRadius || 200;
  const m = outMult(caster, action);

  const poisoned = (Object.values(state.players) as any[])
    .filter((o) => isEnemy(state, caster.id, o) && o.hp > 0 && o.effects && o.effects.poison)
    .sort((a, b) => Number(a.id) - Number(b.id));

  for (const o of poisoned) {
    const ps = o.effects.poison;
    const stacks = ps.stacks || 0;
    if (stacks <= 0) continue;
    dealDamage(state, o, stacks * burst * m, caster.id, { source: ctx.source });
    if (!silent) addFx(state, { type: 'hit', x: o.x, y: o.y, color: '#7ee787', life: 0.4, radius: 44, vfx: action.vfx });

    const half = Math.ceil(stacks / 2);
    if (half > 0) {
      for (const n of Object.values(state.players) as any[]) {
        if (n === o || !isEnemy(state, caster.id, n) || n.hp <= 0) continue;
        if (dist(o.x, o.y, n.x, n.y) <= spreadRadius) {
          applyEffectFrom(state, n, { kind: 'poison', stacks: half, dmgPerStack: ps.dmgPerStack, duration: ps.remaining || 5 }, caster.id, ctx.source);
        }
      }
    }
  }

  if (!silent) addFx(state, { type: 'ultimate', x: caster.x, y: caster.y, facing: caster.facing, color: action.color, life: 0.6, vfx: action.vfx });
}

export const handlers = { plaguenova };
