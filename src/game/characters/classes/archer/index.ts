// @ts-nocheck
import { BaseCharacter } from '../../BaseCharacter.ts';
import { characterSprite } from '../../textureSprite.ts';
import { drawArcherTexture } from './texture.ts';
import { modelConfig, buildModel, buildWeapon } from './model.ts';
import { attachSkinGear } from './gear.ts';
import { tickArcherBarrage } from './actions/barrage/index.ts';
import './vfx.ts';
import './talent.ts';

const data = {
    id: 'archer', order: 4, evadeType: 'dash', name: '弓箭手', color: '#27ae60', shape: 'circle', sprite: characterSprite('archer', '#27ae60', true, drawArcherTexture),
    snapshotFields: ['barrage'],
    maxHp: 220, maxMana: 80, speed: 188,
    desc: '持續輸出的遠程 carry，全為直線箭術、不再自動追蹤。越遠越痛、貫穿箭洞穿一線；寄生箭植入後隨你的箭餵食累積、疊加易傷，時間到／補箭／擊殺時孵化引爆並擴散；大招天羽箭暴展翼三秒、朝鎖定方向狂射且可自由走位。需前排掩護走位。',
    role: '後排 · 持續輸出',
    synergy: '需前排(坦克/戰士)掩護拉開距離；越遠越痛，靠隊友 peel 發揮最大火力。',
    talent: { id: 'deadeye', name: '致命瞄準', desc: '對越遠的敵人傷害越高（最遠 +50%）。', bonus: 0.5, range: 520 },
    basic: { name: '射箭', type: 'projectile', dmg: 22, speed: 620, radius: 14, lifetime: 1.4, knockback: 70, cd: 0.5, color: '#2ecc71', vfx: 'archer_arrow' },
    skill1: { name: '貫穿箭', type: 'projectile', dmg: 60, speed: 920, radius: 14, lifetime: 0.9, pierce: true, knockback: 90, manaCost: 25, cd: 6, chargeMax: 1.5, color: '#7bed9f', vfx: 'archer_arrow' },
    skill2: { name: '寄生箭', type: 'projectile', dmg: 30, speed: 720, radius: 12, lifetime: 1.5, knockback: 30, manaCost: 30, cd: 8, color: '#1abc9c', effect: { kind: 'parasite', duration: 6, tick: 0.5, dmg: 8, vuln: 0.06, vulnStep: 0.04, vulnMax: 0.36, store: 0.3, burstMult: 1.0, burstCap: 250, burstRadius: 150, spreadDur: 3, color: '#1abc9c', burstVfx: 'archer_parasite', burstColor: '#1abc9c' }, vfx: 'archer_parasite' },
    ultimate: { name: '天羽箭暴', type: 'barrage', duration: 3.0, interval: 0.1, dmg: 12, speed: 950, radius: 13, lifetime: 0.9, pierce: true, knockback: 18, spread: 0.05, cd: 10, color: '#7bed9f', vfx: 'archer_ultimate' },
  };

export class ArcherCharacter extends BaseCharacter {
  constructor() {
    super(data, {
      modelConfig,
      buildModel,
      buildWeapon,
      paintTexture: drawArcherTexture, attachSkinGear,
      loadVfx: () => undefined,
      combatTick: tickArcherBarrage,
    });
  }
}

export default new ArcherCharacter();
