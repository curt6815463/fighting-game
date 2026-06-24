// 天賦（被動）hook registry。
//
// ── 為什麼存在 ──────────────────────────────────────────────────────
// 過去天賦邏輯以 `talent.id === 'xxx'` 內聯散在 damage.ts 等 hot-path：每加一個有被動的
// 角色都要回去編輯共用檔 → 多人協作衝突、且容易漏接（曾有 unbreakable/bulwark 只有資料
// 沒接邏輯）。改為「與角色 co-located 的 hook」：在 classes/<slug>/talent.ts 內
// registerTalent('<id>', { ... })，hot-path 改為查 registry 後呼叫該 hook。
//
// 慣例沿用 VFX：角色 index.ts 以 `import './talent.ts'` 觸發 side-effect 註冊。
//
// ── 目前涵蓋範圍 ────────────────────────────────────────────────────
// 本 registry 目前提供「傷害管線」hook（damage.ts 內，每次命中依序呼叫）：
//   modifyOutgoing  攻擊方輸出傷害修正（回傳新傷害）
//   modifyIncoming  受擊方承受傷害修正（回傳新傷害）
//   onDealt         造成傷害後的副作用（攻擊方；ctx.dmg = 實際造成的傷害）
//   onAttacked      受擊後副作用，回傳「反傷量」由 damage.ts 代為施加（避免循環匯入）
// 每個角色只有一個天賦，故同一 hook 不會有跨天賦的順序問題（互斥）。
//
// 尚未納入 registry、仍內聯於各檔的天賦邏輯（屬 aura / 跨實體 / 其他 hot-path，之後可加
// onTick / onCast 等 hook 增量搬移；call-site 註解已標示）：
//   warsong（bard，aura）、plague（hexer，死亡傳染 aura）、summonbond 的召喚物回主（damage.ts）、
//   bloodlust 攻速 / iaido 計時 / lifebloom 回血（playerState）、pyromancy（combat）、
//   undeath（effects DoT 汲取）、iaido 居合就緒 / timeprism（casting）。
// ──────────────────────────────────────────────────────────────────

export interface TalentCtx {
  state: any;
  attacker: any;
  target: any;
  dmg: number;
  talent: any; // 天賦資料（含 id 與各自參數，如 bonus/range/factor）
  // 副作用 helper（由 damage.ts 注入，避免 talent.ts 反向匯入 entities/* 造成循環）
  applyHeal: (state: any, p: any, amount: number) => void;
  addFx: (state: any, fx: any) => void;
}

export interface TalentHooks {
  modifyOutgoing?(c: TalentCtx): number;
  modifyIncoming?(c: TalentCtx): number;
  onDealt?(c: TalentCtx): void;
  onAttacked?(c: TalentCtx): number | void;
}

const REGISTRY = new Map<string, TalentHooks>();

export function registerTalent(id: string, hooks: TalentHooks) {
  if (id) REGISTRY.set(id, hooks);
}

export function getTalentHooks(id: string | undefined | null): TalentHooks | undefined {
  return id ? REGISTRY.get(id) : undefined;
}
