import type { ActionContext } from '../../../types';

// 連射狀態（弓箭手大招「天羽箭暴」）：施放後進入 barrage 狀態，
// 由 actions/runtime.ts processBarrage 每 tick 朝鎖定方向自動連射。
// 與 channel/charge 同屬「掛在 player 上的持續狀態」，但不接管移動（可自由走位）。
export function barrage(ctx: ActionContext) {
  const { caster, action } = ctx;
  caster.barrage = {
    remaining: action.duration || 3,
    fireTimer: 0,
    interval: action.interval || 0.1,
    facing: caster.facing,          // 鎖定施法瞬間方向（面向同一個地方）
    dmg: action.dmg || 12,
    speed: action.speed || 900,
    radius: action.radius || 13,
    lifetime: action.lifetime || 0.9,
    knockback: action.knockback || 0,
    pierce: !!action.pierce,
    spread: action.spread || 0,     // 每發隨機抖動幅度
    color: action.color,
    vfx: action.vfx,
    effect: action.effect || null,
    srcSlot: ctx.source,
  };
}

export const handlers = { barrage };
