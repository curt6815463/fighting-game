// 闖關模式統計：累計於 state.stats，跟著 snapshot 同步。
// 只在 mode === 'boss' 啟用；其他模式呼叫皆為 no-op。
import type { GameState, Player, EntityId } from '../types';

export function isBossRun(state: GameState) {
  return state && state.mode === 'boss';
}

export function initRunStats(state: GameState) {
  if (!isBossRun(state)) return;
  setupStats(state);
}

// 在任意模式啟用統計累計（供 DPS 練功房 / headless 量測框架使用）。
// 與 initRunStats 同構，但不檢查 mode → 可在 training/ffa 場景直接開啟。
export function setupStats(state: GameState) {
  state.stats = {
    runStart: state.time || 0,
    roundStart: state.time || 0,
    currentRound: state.round || 1,
    perRound: [],
    perPlayer: {},
  };
  ensureAllPlayerStats(state);
}

export function ensureAllPlayerStats(state: GameState) {
  if (!state.stats) return;
  for (const p of Object.values(state.players)) {
    if (p.team !== 1 || p.ownerId) continue; // 只統計真人玩家
    ensurePlayerStats(state, p);
  }
}

function ensurePlayerStats(state: GameState, p: Player) {
  if (!state.stats || !p || p.team !== 1 || p.ownerId) return null;
  let s = state.stats.perPlayer[p.id];
  if (!s) {
    s = state.stats.perPlayer[p.id] = {
      name: p.name, charId: p.charId,
      dmgDealt: 0, dmgTaken: 0, healing: 0,
      kills: 0, deaths: 0, revives: 0,
      skillUses: { basic: 0, skill1: 0, skill2: 0, ultimate: 0, evade: 0 },
      maxHit: 0, critCount: 0, ccApplied: 0,
      perSkill: {}, // DPS 歸因：source slot → 累積傷害
    };
  }
  // 角色可能在房間內換 — 用最新資料覆寫
  s.name = p.name; s.charId = p.charId;
  return s;
}

export function recordRoundStart(state: GameState) {
  if (!state.stats) return;
  state.stats.roundStart = state.time || 0;
  state.stats.currentRound = state.round || 1;
}

export function recordRoundEnd(state: GameState, opts: { bossName?: string; defeated?: boolean; retries?: number } = {}) {
  if (!state.stats) return;
  const duration = (state.time || 0) - (state.stats.roundStart || 0);
  state.stats.perRound.push({
    round: state.stats.currentRound,
    bossName: opts.bossName || '',
    duration,
    defeated: !!opts.defeated,
    retries: opts.retries || 0,
  });
}

export function recordRetry(state: GameState) {
  if (!state.stats) return;
  state.stats._retryCount = (state.stats._retryCount || 0) + 1;
}

export function recordDamage(state: GameState, attackerId: EntityId, target: Player, amount: number, opts: { isCrit?: boolean; source?: string } = {}) {
  if (!state.stats || amount <= 0) return;
  const attacker = state.players[attackerId];
  if (attacker) {
    // 召喚物擊殺歸功召喚者
    const ownerId = (attacker.isMinion || attacker.isSummon) && attacker.ownerId ? attacker.ownerId : attacker.id;
    const ownerP = state.players[ownerId];
    if (ownerP && ownerP.team === 1 && !ownerP.ownerId) {
      const s = ensurePlayerStats(state, ownerP);
      if (s) {
        // DPS 計時自「首次造成傷害」起算（練功房用；手動重置 setupStats 會清除重新等待）。
        if (state.stats.firstDamageTime == null) state.stats.firstDamageTime = state.time || 0;
        s.dmgDealt += amount;
        if (amount > s.maxHit) s.maxHit = amount;
        if (opts.isCrit) s.critCount += 1;
        const src = opts.source || 'other';
        if (!s.perSkill) s.perSkill = {};
        s.perSkill[src] = (s.perSkill[src] || 0) + amount;
      }
    }
  }
  if (target && target.team === 1 && !target.ownerId) {
    const s = ensurePlayerStats(state, target);
    if (s) s.dmgTaken += amount;
  }
}

export function recordHeal(state: GameState, p: Player, amount: number) {
  if (!state.stats || amount <= 0 || !p) return;
  const s = ensurePlayerStats(state, p);
  if (s) s.healing += amount;
}

export function recordKill(state: GameState, killerId: EntityId, target: Player) {
  if (!state.stats) return;
  // 只計擊殺 Boss 側 (含部位、小怪)
  if (!target || target.team !== 2) return;
  const killer = state.players[killerId];
  if (!killer) return;
  const ownerId = (killer.isMinion || killer.isSummon) && killer.ownerId ? killer.ownerId : killer.id;
  const ownerP = state.players[ownerId];
  if (!ownerP || ownerP.team !== 1 || ownerP.ownerId) return;
  const s = ensurePlayerStats(state, ownerP);
  if (s) s.kills += 1;
}

export function recordDeath(state: GameState, p: Player) {
  if (!state.stats || !p || p.team !== 1 || p.ownerId) return;
  const s = ensurePlayerStats(state, p);
  if (s) s.deaths += 1;
}

export function recordRevive(state: GameState, helperId: EntityId) {
  if (!state.stats) return;
  const helper = state.players[helperId];
  if (!helper || helper.team !== 1 || helper.ownerId) return;
  const s = ensurePlayerStats(state, helper);
  if (s) s.revives += 1;
}

export function recordSkillUse(state: GameState, p: Player, slot: string) {
  if (!state.stats || !p || p.team !== 1 || p.ownerId) return;
  const s = ensurePlayerStats(state, p);
  if (!s) return;
  if (!s.skillUses[slot] && s.skillUses[slot] !== 0) s.skillUses[slot] = 0;
  s.skillUses[slot] += 1;
}

export function recordCcApplied(state: GameState, casterId: EntityId) {
  if (!state.stats) return;
  const caster = state.players[casterId];
  if (!caster) return;
  const ownerId = (caster.isMinion || caster.isSummon) && caster.ownerId ? caster.ownerId : caster.id;
  const ownerP = state.players[ownerId];
  if (!ownerP || ownerP.team !== 1 || ownerP.ownerId) return;
  const s = ensurePlayerStats(state, ownerP);
  if (s) s.ccApplied += 1;
}

// 把某玩家的累積統計整理成 DPS 摘要（供練功房即時 HUD 使用）。
// DPS 視窗自「首次造成傷害」起算（firstDamageTime）；未攻擊前 elapsed/dps = 0。
// perSkill 依傷害由高到低排序，並附 dps 與佔比。
export function summarizeDps(state: GameState, playerId: EntityId) {
  const s = state.stats && state.stats.perPlayer[playerId as string];
  if (!s) return null;
  const started = state.stats.firstDamageTime != null;
  const elapsed = started ? Math.max(0, (state.time || 0) - (state.stats.firstDamageTime || 0)) : 0;
  const win = Math.max(1 / 30, elapsed); // 下限一個 tick，避免首幀除以近 0 暴衝
  const total = s.dmgDealt || 0;
  const perSkill = Object.keys(s.perSkill || {})
    .map((slot) => ({ slot, dmg: s.perSkill[slot], dps: started ? s.perSkill[slot] / win : 0, pct: total ? s.perSkill[slot] / total : 0 }))
    .sort((a, b) => b.dmg - a.dmg);
  return {
    elapsed,
    total,
    dps: started ? total / win : 0,
    dmgTaken: s.dmgTaken || 0,
    maxHit: s.maxHit || 0,
    critCount: s.critCount || 0,
    skillUses: { ...(s.skillUses || {}) },
    perSkill,
  };
}
