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
// 傷害管線 hook（damage.ts，每次命中依序呼叫）：
//   modifyOutgoing  攻擊方輸出傷害修正（回傳新傷害）
//   modifyIncoming  受擊方承受傷害修正（回傳新傷害）
//   onDealt         造成傷害後的副作用（攻擊方；ctx.dmg = 實際造成的傷害）
//   onAttacked      受擊後副作用，回傳「反傷量」由 damage.ts 代為施加（避免循環匯入）
// 生命週期 hook（於各自 call-site 呼叫）：
//   cooldownRate    冷卻流速倍率（playerState tickCooldowns）       例：bloodlust 失血加速
//   onTimers        每幀計時（playerState tickCharacterTimers）     例：iaido 計時累積
//   onRecovery      每幀被動回復（playerState tickPassiveRecovery） 例：lifebloom 持續回血
//   beforeActionExecute 施放前、扣資源與設 CD 後、executeAction 前 例：iaido 設定本次居合窗口
//   onCastResolved  施放後（casting tryAction/tryUltimate）         例：timeprism 施放後自我 haste
//   modifyAppliedEffect 施加狀態前修正 effect 參數                 例：pyromancy 強化 burn / 抑制 chill 滿層
//   onEntityDeath  任一實體死亡後的場上反應                       例：causality 擴散 timehex
//   outgoingAura / onOwnedMinionDealt / modifyDotDamage / onDotDealt
//                  跨實體 aura、召喚物命中、DoT 傷害與 DoT 後續效果
// 每個角色只有一個天賦，故同一 hook 不會有跨天賦的順序問題（互斥）。
//
// 新增天賦時優先放在角色自己的 talent.ts，只有缺少合適 call-site 時才擴充此 registry。
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
  // ---- 傷害管線 hook（damage.ts，每次命中依序呼叫）----
  modifyOutgoing?(c: TalentCtx): number;
  modifyIncoming?(c: TalentCtx): number;
  onDealt?(c: TalentCtx): void;
  onAttacked?(c: TalentCtx): number | void;
  outgoingAura?(ctx: { state: any; owner: any; attacker: any; target: any; dmg: number; talent: any; isAlly: any }): number;
  onOwnedMinionDealt?(ctx: { state: any; owner: any; minion: any; target: any; dmg: number; talent: any; applyHeal: any }): void;
  modifyDotDamage?(ctx: { state: any; source: any; target: any; effect: any; kind: string; dmg: number; talent: any }): number;
  onDotDealt?(ctx: { state: any; source: any; target: any; effect: any; kind: string; dmg: number; talent: any; applyHeal: any }): void;
  // ---- 生命週期 hook（playerState / casting；參數較精簡，於各自 call-site 呼叫）----
  cooldownRate?(state: any, p: any, talent: any): number;            // 冷卻流速倍率（預設 1）— tickCooldowns
  onTimers?(state: any, p: any, dt: number, talent: any): void;      // 每幀計時 — tickCharacterTimers
  onRecovery?(state: any, p: any, dt: number, talent: any): void;    // 每幀被動回復 — tickPassiveRecovery
  beforeActionExecute?(state: any, p: any, action: any, slot: string, talent: any): void; // 執行 action 前 — casting
  onCastResolved?(state: any, p: any, action: any, slot: string, talent: any): void; // 施放後 — casting
  canCast?(state: any, p: any, slot: string, talent: any): boolean;                  // 施放前判定（回 false 阻擋施放）— casting
  modifyAppliedEffect?(ctx: { state: any; source: any; target: any; effect: any; talent: any; role: 'source' | 'target' }): any; // 施加狀態前 — combat.applyEffectFrom
  onEntityDeath?(ctx: { state: any; owner: any; corpse: any; killer: any; talent: any; applyEffect: any; addFx: any; isEnemy: any }): void;
}

const REGISTRY = new Map<string, TalentHooks>();

export function registerTalent(id: string, hooks: TalentHooks) {
  if (id) REGISTRY.set(id, hooks);
}

export function getTalentHooks(id: string | undefined | null): TalentHooks | undefined {
  return id ? REGISTRY.get(id) : undefined;
}
