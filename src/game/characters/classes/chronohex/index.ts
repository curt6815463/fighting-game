// @ts-nocheck
import { BaseCharacter } from '../../BaseCharacter.ts';
import { characterSprite } from '../../textureSprite.ts';
import { drawChronohexTexture } from './texture.ts';
import { modelConfig, buildModel, buildWeapon } from './model.ts';
import './vfx.ts';
import './talent.ts';

// 時厄術士：低 DPS、高瞬間爆發的「惱人」時空控制者。核心資源「時咒」(timehex) —— 普攻一直疊，
// 每層持續扣血(疊越多扣越多，最多 10 層)＋拖慢目標冷卻；普攻直擊極低，傷害全靠「引爆層數」。
// K 凝滯咒(著重緩速)、L 災厄咒(著重高傷)各丟一發引爆咒；大招重置技能冷卻＋回滿魔力＋上護盾，
// 立刻再丟兩發。不會穩定秒你，但很煩——控制黏人、爆發突然。
const data = {
    id: 'chronohex', order: 11, evadeType: 'blink', name: '時厄術士', color: '#7c5cff', shape: 'triangle', sprite: characterSprite('chronohex', '#7c5cff', false, drawChronohexTexture),
    maxHp: 195, maxMana: 140, speed: 170,
    desc: '低輸出、高爆發的惱人時空控制者。普攻直擊極低，但每發都疊「時咒」——每層持續扣血、疊越多扣越多(最多 10 層)，還拖慢你的技能冷卻。K 凝滯咒丟出一發引爆咒(著重緩速：短暈+長時間緩速)、L 災厄咒丟出一發引爆咒(著重傷害：短暈+依層數高額爆傷)，大招時序重構則重置自身技能冷卻、回滿魔力並罩上護盾，立刻再來一輪。DPS 普通，黏人控制與突然爆發才是本體。',
    role: '特殊 · 惱人控制/爆發',
    synergy: '靠普攻鋪滿時咒(扣血＋拖慢冷卻)，再用 K 緩速控場或 L 高額引爆爆發；大招重置後可連續引爆。脆皮、需走位風箏，配能咬住目標的隊友把握引爆窗口最佳。',
    talent: { id: 'causality', name: '因果', desc: '對帶有時咒的敵人，自身造成的傷害 +15%；帶時咒的敵人死亡時，剩餘時咒擴散給周圍 220 內的敵人（連同扣血與冷卻拖慢）。', curseAmp: 0.15, radius: 220, cdRefund: 1.5 },
    basic: { name: '時咒彈', type: 'projectile', dmg: 6, speed: 540, radius: 12, lifetime: 1.4, knockback: 18, cd: 0.55, color: '#b07cff', effect: { kind: 'timehex', stacks: 1, max: 10, duration: 8, vulnPer: 0, dmgPerStack: 1.5, cdSlowPer: 0.04 }, vfx: 'chronohex_bolt' },
    skill1: { name: '凝滯咒', type: 'projectile', dmg: 20, speed: 600, radius: 13, lifetime: 1.1, knockback: 30, manaCost: 25, cd: 9, color: '#80deea', detonate: { perStack: 16, consume: true, stun: 1.0, stunPerStack: 0.10, slow: { duration: 3, factor: 0.5 }, slowPerStack: 0.35, slowFactorPerStack: 0.02, slowFactorMin: 0.35 }, vfx: 'chronohex_bolt' },
    skill2: { name: '災厄咒', type: 'projectile', dmg: 28, speed: 640, radius: 13, lifetime: 1.1, knockback: 30, manaCost: 30, cd: 11, color: '#b07cff', detonate: { perStack: 34, consume: true, stun: 1.0, stunPerStack: 0.10 }, vfx: 'chronohex_bolt' },
    ultimate: { name: '時序重構', type: 'chronoreset', shield: 220, shieldDuration: 6, cd: 12, color: '#7c5cff', vfx: 'chronohex_ultimate' },
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
