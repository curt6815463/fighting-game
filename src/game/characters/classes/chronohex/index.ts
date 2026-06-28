// @ts-nocheck
import { BaseCharacter } from '../../BaseCharacter.ts';
import { characterSprite } from '../../textureSprite.ts';
import { drawChronohexTexture } from './texture.ts';
import { modelConfig, buildModel, buildWeapon } from './model.ts';
import './vfx.ts';
import './talent.ts';

// 時厄術士：低 DPS、高瞬間爆發的「惱人」時空控制者。核心資源「時咒」(timehex) —— 堆疊式時空詛咒，
// 每層只造成低額蝕傷，但會讓目標「技能/閃避冷卻變慢」(惱人)＋微量易傷；爆發全靠「引爆時咒」。
// 一身奇怪的擾亂機制（錯亂反向操作、致盲黑屏、重力漩渦拉扯、冷卻拖慢、瞬間引爆）—— 不會秒你，
// 但會讓你很不想遇到他。價值在控場與把握爆發窗口，而非穩定輸出。
const data = {
    id: 'chronohex', order: 11, evadeType: 'blink', name: '時厄術士', color: '#7c5cff', shape: 'triangle', sprite: characterSprite('chronohex', '#7c5cff', false, drawChronohexTexture),
    maxHp: 195, maxMana: 140, speed: 170,
    desc: '低輸出、高爆發的惱人時空控制者。堆疊式「時咒」讓目標冷卻變慢、微量易傷；時咒彈慢慢鋪層、時間錯亂把敵人操作反向＋致盲黑屏並引爆已疊的詛咒、時間漩渦把敵群吸進去鎖死，大招時空奇點將敵人內爆聚攏並一次清算時咒造成高額瞬爆。DPS 普通，惡心人的控制與爆發才是本體。',
    role: '特殊 · 惱人控制/爆發',
    synergy: '不穩定輸出，靠控制與瞬爆惡心對手：疊時咒拖慢敵人冷卻、錯亂/致盲/漩渦封鎖走位，再用時間錯亂或大招奇點引爆爆發。配能收割殘血的隊友把握引爆窗口最佳。',
    talent: { id: 'causality', name: '因果', desc: '對帶有時咒的敵人，自身造成的傷害 +5%/層（放大引爆）；時咒每層使目標技能冷卻流速 −7%（最多 −35%，惱人）；帶時咒的敵人死亡時，剩餘時咒擴散給周圍 220 內的敵人。', ampPerStack: 0.05, radius: 220, cdRefund: 1.5 },
    basic: { name: '時咒彈', type: 'projectile', dmg: 12, speed: 540, radius: 12, lifetime: 1.4, knockback: 24, cd: 0.55, color: '#b07cff', effect: { kind: 'timehex', stacks: 1, duration: 7, vulnPer: 0.04, dmgPerStack: 1, cdSlowPer: 0.07 }, vfx: 'chronohex_bolt' },
    skill1: { name: '時間錯亂', type: 'chronoaccel', radius: 300, accelBurst: 20, refreshDur: 7, scramble: 1.6, blind: 1.4, slow: { duration: 1.4, factor: 0.5 }, manaCost: 30, cd: 9, color: '#80deea', vfx: 'chronohex_accel' },
    skill2: { name: '時間漩渦', type: 'zone', range: 130, radius: 165, dmg: 8, lifetime: 3.5, tick: 0.5, pull: 150, effects: [{ kind: 'stun', duration: 0.8 }, { kind: 'timehex', stacks: 1, duration: 7, vulnPer: 0.04, dmgPerStack: 1, cdSlowPer: 0.07 }, { kind: 'slow', duration: 0.7, factor: 0.6 }, { kind: 'dmg_reduce', duration: 0.7, factor: 0.25 }], manaCost: 40, cd: 11, color: '#00bcd4', vfx: 'chronohex_field' },
    ultimate: { name: '時空奇點', type: 'chronocollapse', range: 150, radius: 260, dmg: 40, collapseBurst: 32, refreshStacks: 5, refreshDur: 4, root: 1.4, stun: 0.9, pull: 480, cd: 12, color: '#7c5cff', vfx: 'chronohex_ultimate' },
  };

export class ChronohexCharacter extends BaseCharacter {
  constructor() {
    super(data, {
      modelConfig,
      buildModel,
      buildWeapon,
      paintTexture: drawChronohexTexture,
      loadVfx: () => undefined,
    });
  }
}

export default new ChronohexCharacter();
