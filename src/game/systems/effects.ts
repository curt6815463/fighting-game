import { PLAYER_RADIUS } from '../constants.js';
import { getCharacter } from '../characters.js';
import { getTalentHooks } from '../characters/talents/registry';
import { dealDamage, hatchParasite } from '../entities/damage.ts';
import { applyEffect } from '../entities/effects.ts';
import { applyHeal } from '../entities/heal.ts';
import { addFx } from '../entities/fx.ts';
import type { GameState, Player, EntityId } from '../types';

function dotTalentCtx(state: GameState, srcId: EntityId | null | undefined, target: Player, effect: any, kind: string, dmg: number) {
  if (srcId == null) return null;
  const src = state.players[srcId];
  if (!src || !src.alive) return null;
  const talent = getCharacter(src.charId).talent;
  return { state, source: src, target, effect, kind, dmg, talent };
}

function modifyDotDamage(state: GameState, srcId: EntityId | null | undefined, target: Player, effect: any, kind: string, dmg: number) {
  const ctx = dotTalentCtx(state, srcId, target, effect, kind, dmg);
  if (!ctx) return dmg;
  const hook = getTalentHooks(ctx.talent?.id)?.modifyDotDamage;
  return hook ? hook(ctx) : dmg;
}

function onDotDealt(state: GameState, srcId: EntityId | null | undefined, target: Player, effect: any, kind: string, dmg: number) {
  if (!dmg) return;
  const ctx = dotTalentCtx(state, srcId, target, effect, kind, dmg);
  if (!ctx) return;
  getTalentHooks(ctx.talent?.id)?.onDotDealt?.({ ...ctx, applyHeal });
}

export function tickStatusEffects(state: GameState, p: Player, dt: number) {
  // 遞減 CC 冷卻
  if (p.ccCooldown) {
    for (const kind of Object.keys(p.ccCooldown)) {
      p.ccCooldown[kind] -= dt;
      if (p.ccCooldown[kind] <= 0) delete p.ccCooldown[kind];
    }
  }

  for (const kind of Object.keys(p.effects)) {
    const effect = p.effects[kind]!;
    effect.remaining -= dt;

    if (kind === 'burn') {
      effect.tickTimer -= dt;
      if (effect.tickTimer <= 0) {
        effect.tickTimer += effect.tick;
        const dmg = modifyDotDamage(state, effect.srcId, p, effect, kind, effect.dmg);
        dealDamage(state, p, dmg, effect.srcId, { source: effect.srcSlot });
        onDotDealt(state, effect.srcId, p, effect, kind, dmg);
        addFx(state, { type: 'burn', x: p.x, y: p.y, color: '#ff6b3d', life: 0.3, radius: PLAYER_RADIUS });
      }
    } else if (kind === 'bleed') {
      const moving = (Math.abs(p.vx) + Math.abs(p.vy)) > 1;
      effect.tickTimer -= dt * (moving ? effect.moveMult : 1);
      if (effect.tickTimer <= 0) {
        effect.tickTimer += effect.tick;
        const dmg = modifyDotDamage(state, effect.srcId, p, effect, kind, effect.dmg);
        dealDamage(state, p, dmg, effect.srcId, { source: effect.srcSlot });
        onDotDealt(state, effect.srcId, p, effect, kind, dmg);
        addFx(state, { type: 'burn', x: p.x, y: p.y, color: '#e84141', life: 0.3, radius: PLAYER_RADIUS });
      }
    } else if (kind === 'poison') {
      // 劇毒：每 tick 依層數造成傷害（stacks × dmgPerStack），層數越高越痛。
      effect.tickTimer -= dt;
      if (effect.tickTimer <= 0) {
        effect.tickTimer += effect.tick;
        const baseDmg = (effect.stacks || 1) * (effect.dmgPerStack || 3);
        const dmg = modifyDotDamage(state, effect.srcId, p, effect, kind, baseDmg);
        dealDamage(state, p, dmg, effect.srcId, { dot: true, source: effect.srcSlot });
        onDotDealt(state, effect.srcId, p, effect, kind, dmg);
        addFx(state, { type: 'burn', x: p.x, y: p.y, color: '#7ee787', life: 0.3, radius: PLAYER_RADIUS });
      }
    } else if (kind === 'timehex') {
      // 時咒：每 tick 依層數蝕傷（stacks × dmgPerStack），時間在啃食目標。
      effect.tickTimer -= dt;
      if (effect.tickTimer <= 0) {
        effect.tickTimer += effect.tick;
        const dmg = (effect.stacks || 1) * (effect.dmgPerStack || 1);
        dealDamage(state, p, dmg, effect.srcId, { dot: true, source: effect.srcSlot });
        addFx(state, { type: 'burn', x: p.x, y: p.y, color: '#b07cff', life: 0.3, radius: PLAYER_RADIUS });
      }
    } else if (kind === 'parasite') {
      effect.tickTimer -= dt;
      if (effect.tickTimer <= 0) {
        effect.tickTimer += effect.tick;
        const dmg = modifyDotDamage(state, effect.srcId, p, effect, kind, effect.dmg);
        dealDamage(state, p, dmg, effect.srcId, { dot: true, source: effect.srcSlot });
        onDotDealt(state, effect.srcId, p, effect, kind, dmg);
        addFx(state, { type: 'burn', x: p.x, y: p.y, color: effect.color || '#7ee787', life: 0.3, radius: PLAYER_RADIUS });
      }
      // 時間到 → 孵化引爆（DoT 已先擊殺者由死亡區引爆，此處以 p.alive 防重複）。
      if (effect.remaining <= 0 && p.alive) hatchParasite(state, p);
    } else if (kind === 'chill') {
      if (effect.stacks >= effect.max && !effect.froze) {
        effect.froze = true;
        applyEffect(p, 'stun', { duration: effect.freezeDur });
        applyEffect(p, 'frozen', { duration: effect.freezeDur });
        effect.remaining = 0;
        addFx(state, { type: 'hit', x: p.x, y: p.y, color: effect.freezeColor || '#9fe8ff', life: 0.4, radius: PLAYER_RADIUS * 2.5, vfx: effect.freezeVfx || null });
      }
    } else if (kind === 'regen_hot') {
      effect.tickTimer -= dt;
      if (effect.tickTimer <= 0) {
        effect.tickTimer += 1.0;
        applyHeal(state, p, effect.amountPerSec, { burst: true });
      }
    }

    if (effect.remaining <= 0) delete p.effects[kind];
  }
}
