import { bodyR } from '../actions/combat.ts';
import { ARENA, PLAYER_RADIUS } from '../constants.js';
import { clamp } from '../entities/math.ts';
import type { GameState } from '../types';

// 靜態圓形障礙 (世界座標，如神殿基座)：把輕量實體推出圈外，讓它「佔空間」。
// host 權威；於 resolveCollisions 之後呼叫。Boss 為重型不被推。
export function resolveStaticColliders(state: GameState) {
  if (state.mode !== 'boss') return;
  const cols = state.colliders;
  if (!cols || !cols.length) return;
  for (const p of Object.values(state.players)) {
    if (!p.alive || p.isBoss || p.isPart) continue;
    const pr = bodyR(p);
    let pushed = false;
    for (const c of cols) {
      const dx = p.x - c.x, dy = p.y - c.y;
      const d = Math.hypot(dx, dy);
      const minD = c.r + pr;
      if (d >= minD) continue;
      const nx = d > 0.0001 ? dx / d : 1;
      const ny = d > 0.0001 ? dy / d : 0;
      const overlap = minD - d;
      p.x += nx * overlap;
      p.y += ny * overlap;
      pushed = true;
    }
    if (pushed) {
      p.x = clamp(p.x, PLAYER_RADIUS, ARENA.width - PLAYER_RADIUS);
      p.y = clamp(p.y, PLAYER_RADIUS, ARENA.height - PLAYER_RADIUS);
    }
  }
}

// 逐對實體碰撞分離。Boss/部位為「重型」(不被推開，只推開輕量方)。
export function resolveCollisions(state: GameState) {
  const arr = Object.values(state.players).filter((p) => p.alive);
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i];
      const b = arr[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const minD = bodyR(a) + bodyR(b);
      if (d >= minD) continue;

      const nx = d > 0.0001 ? dx / d : 1;
      const ny = d > 0.0001 ? dy / d : 0;
      const overlap = minD - d;
      const aHeavy = a.isBoss || a.isPart;
      const bHeavy = b.isBoss || b.isPart;
      if (aHeavy && bHeavy) continue;
      if (aHeavy) {
        b.x += nx * overlap;
        b.y += ny * overlap;
      } else if (bHeavy) {
        a.x -= nx * overlap;
        a.y -= ny * overlap;
      } else {
        const push = overlap / 2;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }
}
