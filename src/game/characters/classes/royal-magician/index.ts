// @ts-nocheck
import { BaseCharacter } from '../../BaseCharacter.ts';
import { characterSprite } from '../../textureSprite.ts';
import { drawRoyalMagicianTexture, drawRoyalMagicianMaterialTexture } from './texture.ts';
import { modelConfig, buildModel, buildWeapon } from './model.ts';
import { tickRoyalMagician } from './talent.ts';
import './projectileHooks.ts';
import './vfx.ts';

const data = {
  id: 'royal-magician', order: 22, evadeType: 'blink', name: '皇家魔術師', color: '#c9184a', shape: 'diamond', sprite: characterSprite('royal-magician', '#c9184a', false, drawRoyalMagicianTexture),
  maxHp: 190, maxMana: 110, speed: 190,
  desc: '中距離花色連段法師。特色【皇家手牌】花色組合，普攻命中隨機獲得紅/藍牌，1/10 機率抽到鬼牌 (Joker)。魔術飛刀消耗手牌，根據組合爆發傷害；若手牌已滿 4 張仍超抽將觸發「魔力反噬」，丟光所有手牌並獲得 50 護盾、移速減 30% 持續 3 秒，且傷害減 90% 持續 10 秒！',
  role: '中距離 · 花色連段',
  synergy: '用普攻積攢手牌，1/10 機率獲得鬼牌（混沌王牌，直接視為同花且分裂錯亂追蹤彈）。滿手牌超抽會丟光牌並嚴重降低傷害與速度，須拿捏節奏！',
  talent: { id: 'royal_encore', name: '安可手牌', desc: '飛牌印記。飛牌隨機抽取皇家手牌（10% 鬼牌，上限 4）。溢出超抽將會丟光手牌，並獲得 50 點護盾、移動速度減少 30% 持續 3 秒，且傷害降低 90% 持續 10 秒。' },
  basic: { name: '飛牌', desc: '快速射出旋轉卡牌，命中附加安可，並隨機抽取 1 張皇家手牌（1/10 機率為鬼牌）。', type: 'projectile', dmg: 18, speed: 760, radius: 10, lifetime: 1.15, knockback: 35, cd: 0.48, color: '#c9184a', effect: { kind: 'encore', duration: 2 }, vfx: 'royal_card' },
  skill1: { name: '魔術飛刀', desc: '扇形射出飛刀並消耗手牌。手牌含「鬼牌」或湊出「同花」（4張同色）造成 2.2x 傷害且擊退定身 1.2 秒（若有鬼牌會分裂追蹤「鬼牌能量彈」造成錯亂 1.5 秒）；「兩對」造成 1.6x 傷害且分裂追蹤飛刀；「三條」造成 1.3x 傷害。', type: 'royal_card_fan', dmg: 12, empoweredDmg: 26, encoreDmg: 12, count: 3, spread: 0.42, pierce: true, speed: 820, radius: 9, lifetime: 1.0, knockback: 40, manaCost: 20, cd: 5.2, color: '#ffd166', vfx: 'royal_card_fan' },
  skill2: { name: '帽子戲法', desc: '朝指定方向拋出魔術高帽（持續 4 秒）。若場上有高帽，再次施放則瞬間與之對調位置。飛牌穿過帽子會直接被「洗牌」升級為同花射出。', type: 'royal_hat_trick', range: 180, cd: 6, color: '#4cc9f0', vfx: 'royal_hat_blink' },
  ultimate: { name: '皇家幻象劇場', desc: '若場上有高帽，在帽子處展開舞台圓陣，拉回所有【安可】標記的敵人。消耗所有手牌，有鬼牌或同花時，劇場卡牌落下傷害翻倍且追加終段大爆炸與擊飛。', type: 'royal_theater', radius: 285, dmg: 34, tick: 0.45, lifetime: 3.2, knockback: 180, finalDmg: 55, finalRadius: 150, finalKnockback: 120, cd: 10, color: '#c9184a', finalColor: '#ffd166', vfx: 'royal_theater', self: { shield: 120, duration: 4 } },
};

export class RoyalMagicianCharacter extends BaseCharacter {
  constructor() {
    super(data, {
      modelConfig,
      buildModel,
      buildWeapon,
      paintTexture: drawRoyalMagicianTexture,
      paintMaterialTexture: drawRoyalMagicianMaterialTexture,
      loadVfx: () => undefined,
      tick: tickRoyalMagician,
    });
  }
}

export default new RoyalMagicianCharacter();
