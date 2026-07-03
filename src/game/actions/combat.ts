import { PLAYER_RADIUS } from '../constants.js';
import { getCharacter } from '../characters.js';
import { getTalentHooks } from '../characters/talents/registry';
import { angleDiff, dist } from '../entities/math.ts';
import { dealDamage, hatchParasite } from '../entities/damage.ts';
import { applyEffect } from '../entities/effects.ts';
import { applyShield } from '../entities/shield.ts';
import { addFx } from '../entities/fx.ts';
import { isEnemy } from '../entities/team.ts';
import type { GameState, Player, EntityId } from '../types';

// 被命中半徑：魔王/部位依模型放大，其餘 = PLAYER_RADIUS。
export function bodyR(o: { hitR?: number }): number {
  return o.hitR || PLAYER_RADIUS;
}

// 輸出傷害倍率：殘血加成 / 血怒 / 過載。a 為動作物件（可能是合成 action）。
export function outMult(p: Player, a: any): number {
  let m = 1;
  if (a.lowHpBonus) m *= 1 + (1 - p.hp / p.maxHp);
  if (p.effects.rage) m *= p.effects.rage.dmg;
  if (p.effects.overdrive && p.effects.overdrive.dmg) m *= p.effects.overdrive.dmg;
  return m;
}

function modifyAppliedEffect(state: GameState, source: Player | undefined, target: Player, effect: any) {
  let e = effect;
  if (source) {
    const talent = getCharacter(source.charId).talent;
    const hook = getTalentHooks(talent?.id)?.modifyAppliedEffect;
    if (hook) e = hook({ state, source, target, effect: e, talent, role: 'source' }) || e;
  }
  const targetTalent = getCharacter(target.charId).talent;
  const targetHook = getTalentHooks(targetTalent?.id)?.modifyAppliedEffect;
  if (targetHook) e = targetHook({ state, source, target, effect: e, talent: targetTalent, role: 'target' }) || e;
  return e;
}

export function applyEffectFrom(state: GameState, target: Player, effect: any, srcId: EntityId, source?: string | null) {
  const src = state.players[srcId];
  // DPS 歸因：DoT 記住來源 slot（呼叫端 source 優先，否則回退施法者同步施放期的 _srcSlot）。
  const srcSlot = source != null ? source : (src && src._srcSlot != null ? src._srcSlot : null);
  const e = modifyAppliedEffect(state, src, target, effect);
  if (e.kind === 'shield') {
    applyShield(state, target, e.amount, e.duration || 5);
    return;
  }
  // 孵化寄生：再補一箭 → 先引爆既有寄生（依累積量），再植入全新一隻。
  if (e.kind === 'parasite' && target.effects && target.effects.parasite) hatchParasite(state, target);
  applyEffect(target, e.kind, srcSlot != null ? { ...e, srcSlot } : e, srcId);
}

// 近戰揮击：扱弧內所有敵人（full arc 不限角）。a 可為合成動作物件（leap/blink 內部套用）。
export function meleeHit(state: GameState, p: Player, a: any, silent?: boolean, source?: string | null) {
  const m = outMult(p, a);
  const full = a.arc >= 6;
  for (const o of Object.values(state.players)) {
    if (!isEnemy(state, p.id, o)) continue;
    const dx = o.x - p.x, dy = o.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > a.range + bodyR(o)) continue;
    if (!full && d > 0.1) {
      const ang = Math.atan2(dy, dx);
      if (Math.abs(angleDiff(ang, p.facing)) > a.arc / 2) continue;
    }
    let dmg = a.dmg * m;
    if (a.detonate && o.effects.mark) {
      dmg *= a.detonate.mult || 2;
      delete o.effects.mark;
      addFx(state, { type: 'hit', x: o.x, y: o.y, color: a.color, life: 0.26, radius: 64, vfx: a.vfx });
    }
    if (a.execute && o.hp <= o.maxHp * (a.execute.threshold || 0.25)) dmg *= a.execute.mult || 5;
    dealDamage(state, o, dmg, p.id, { meleeHit: true, source });
    if (a.knockback && d > 0) { o.kvx += (dx / d) * a.knockback; o.kvy += (dy / d) * a.knockback; }
    if (a.effect) applyEffectFrom(state, o, a.effect, p.id, source);
  }
  if (!silent) addFx(state, { type: 'melee', x: p.x, y: p.y, facing: p.facing, range: a.range, arc: full ? 7 : a.arc, color: a.color, life: 0.18, vfx: a.vfx });
}
