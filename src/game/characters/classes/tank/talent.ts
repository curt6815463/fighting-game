// 天賦 bulwark（鋼鐵壁壘）＋【怒氣】引擎。
//
// 過去 bulwark 只有資料定義、無減傷邏輯（damage.ts 註解曾標示「待補」）→ 坦克核心身分形同虛設。
// 此處正式實作，並把「承傷」做成有獎勵的主動坦資源迴圈：
//   • modifyIncoming：12%→30% 減傷（隨怒氣提升），同時依承受傷害累積怒氣。
//   • modifyOutgoing：怒氣越高輸出越痛（最高 +35%）——低基礎傷害、靠承傷滾雪球。
//   • onDealt：命中累積少量怒氣（次要來源）。
//   • onRecovery：脫戰衰減；怒氣達門檻「戰意沸騰」給 overdrive（移動＋攻速）貼身擾亂。
//   • onCastResolved：守護壁壘額外蓄怒；大招釋放全部怒氣，依怒氣量化身不動壁壘（護體＋反射）。
// 怒氣存於 p.fury（0..FURY_MAX，snapshot 同步給加入者 HUD），脫戰計時用 p.furyIdle。
import { registerTalent } from '../../talents/registry';
import { applyEffect } from '../../../entities/effects.ts';
import { FURY_MAX } from './constants.ts';

registerTalent('bulwark', {
  // 受擊：減傷隨怒氣 12%→30%，並依面對的傷害累積怒氣。
  modifyIncoming({ target, dmg, talent }) {
    const ratio = Math.min(1, (target.fury || 0) / FURY_MAX);
    const base = talent.dr ?? 0.12;
    const dr = base + ((talent.drMax ?? 0.30) - base) * ratio;
    target.fury = Math.min(FURY_MAX, (target.fury || 0) + dmg * (talent.gainTake ?? 0.55));
    target.furyIdle = 0;
    return dmg * (1 - dr);
  },

  // 越怒越痛：最高 +35% 輸出（基礎傷害刻意壓低，價值在承傷後的反擊）。
  modifyOutgoing({ attacker, dmg, talent }) {
    const ratio = Math.min(1, (attacker.fury || 0) / FURY_MAX);
    return dmg * (1 + (talent.dmgMax ?? 0.35) * ratio);
  },

  // 命中蓄怒（次要來源）。
  onDealt({ attacker, dmg, talent }) {
    attacker.fury = Math.min(FURY_MAX, (attacker.fury || 0) + dmg * (talent.gainDeal ?? 0.16));
    attacker.furyIdle = 0;
  },

  // 每幀：脫戰衰減；戰意沸騰（怒氣達門檻）給 overdrive 貼身。
  onRecovery(_state, p, dt, talent) {
    p.furyIdle = (p.furyIdle || 0) + dt;
    if (p.furyIdle > (talent.idleGrace ?? 3) && (p.fury || 0) > 0) {
      p.fury = Math.max(0, p.fury - (talent.decay ?? 14) * dt);
    }
    if (p.alive && (p.fury || 0) >= (talent.threshold ?? 55)) {
      const hf = talent.hasteFactor ?? 1.16;
      applyEffect(p, 'overdrive', { duration: 0.3, speed: hf, atkSpeed: hf });
    }
  },

  // 施放後：守護壁壘額外蓄怒；大招釋放全部怒氣化身不動壁壘。
  onCastResolved(_state, p, _action, slot, talent) {
    if (slot === 'skill1') {
      p.fury = Math.min(FURY_MAX, (p.fury || 0) + (talent.brace ?? 20));
      p.furyIdle = 0;
      return;
    }
    if (slot === 'ultimate') {
      const f = p.fury || 0;
      const dur = talent.ultBuffDur ?? 6;
      const protect = Math.min(0.5, (talent.ultProtect ?? 0.20) + (talent.ultProtectPerFury ?? 0.0022) * f);
      const reflect = Math.min(0.5, (talent.ultReflect ?? 0.20) + (talent.ultReflectPerFury ?? 0.0025) * f);
      applyEffect(p, 'protect', { duration: dur, factor: protect });
      applyEffect(p, 'reflect', { duration: dur, factor: reflect });
      p.fury = 0; // 釋放怒氣
    }
  },
});
