import { BaseBoss } from '../BaseBoss.ts';
import { BURN, STUN, SLOW, ROOT, CHILL } from '../effects.js';
import { aiProfile } from './ai.ts';
import { modelConfig, buildModel, buildWeapon } from './model.ts';
import { loadVfx } from './vfx.ts';

const data = {
    id: 100, round: 1, name: '巨木傀儡', subtitle: '森林守護者',
    color: '#6b8e23', shape: 'square', maxHp: 3500, maxMana: 999, speed: 110,
    baseHp: 3500,
    deathVfx: 'boss_golem_death',
    appearance: {
      size: '巨大 (約玩家 2.2 倍)',
      style: '木石魔像，覆滿樹皮與苔蘚的軀幹，胸口嵌一顆持續發光的綠色生命核心，雙臂是粗壯的樹幹。配色：樹皮褐 #6b4a2b + 苔綠 #6b8e23 + 核心翠光。',
      weapon: '雙樹幹臂 (無持械，以臂砸擊)',
      telegraph: '揮擊前樹幹臂發綠光並緩緩後拉、地面浮現弧形警示；旋掃前全身發光蓄力。動作整體緩慢、破綻大。',
    },
    ai: 'golem',
    mechanic: { backWeak: 0.5, aggroSwap: 3.0 }, // 背後受傷 +50%；每 3 秒換仇恨目標
    talent: { id: 'boss_backweak', name: '遲鈍核心', desc: '背後受到的傷害提高 50%。', backWeak: 0.5 },
    hint: '繞到背後攻擊，傷害 +50%！',
    tags: [
      { icon: '🪵', text: '背後弱點 +50%' },
      { icon: '🎯', text: '仇恨每 3 秒跳' },
    ],
    hazardText: '⚠️ 快離開攻擊範圍！',
    hazardColor: '#e6b352',
    // 靜態障礙 (世界座標)：神殿基座，擋住玩家移動。需與 theme.temple 對齊
    // (world = scene + half；temple x=760,z=-420 → 世界中心 1960,380)
    // 用 3 圓沿基座長軸(朝場中心)排列，貼合 646×408 的長方形基座，避免站上台階/空中隱形牆
    colliders: [
      { x: 1887, y: 249, r: 215 },
      { x: 1960, y: 380, r: 215 },
      { x: 2033, y: 511, r: 215 },
    ],
    // 森林神殿遺跡：苔蘚石造廢墟 + 參天古樹盤根 + 中央發光符文法陣
    theme: {
      sky: 0x243826, fog: 0x18271b, fogNear: 820, fogFar: 3000,
      floorStyle: 'mossy', outerGround: 0x6f7a54,
      wallStyle: 'natural', wallTrimGlow: 0,
      wallStone: 0x3c4a32, wallTrim: 0x3c4a32,
      hemiSky: 0x9fce5a, hemiGround: 0x243016, hemiInt: 0.6,
      sunColor: 0xfff0b0, sunInt: 2.2, rimColor: 0x6fae3e, rimInt: 0.45,
      decorations: ['godrays', 'temple', 'ruins', 'tree', 'roots', 'foliage', 'groundcover', 'rock', 'crystal'],
      godrays: { count: 7, color: 0xe8ffc8, opacity: 0.32 },
      temple: { color: 0x5e6450, moss: 0x4e6f30, glow: 0x6fd23a, x: 760, z: -420, scale: 1.7 },
      ruins: { count: 6, color: 0x636757, moss: 0x4e6f30, vine: 0x3e5e26, scale: 1.3 },
      tree: { count: 26, big: true, trunk: 0x3a2718, leaf: 0x274a1a, leafTop: 0x77b343 },
      roots: { count: 14, color: 0x2f2114 },
      foliage: { count: 32, low: 0x2c4a1a, high: 0x5f8a30 },
      groundcover: { splotches: 30, tufts: 18, rInner: 340, rOuter: 840, low: 0x2c4a1a, high: 0x5f8a30 },
      rock: { count: 16, color: 0x6a6560 },
      crystal: { count: 8, color: 0x9be86a, glow: 0x6fd23a, glowInt: 0.9 },
      atmosphere: { kind: 'leaves', color: '#a6c84a', rate: 16 },
      floorDecal: { kind: 'grove', color: '#9ff06a', glowColor: 0x7ad84a, opacity: 0.58, glow: 1.6, pulse: 0.55, size: 0.62 },
    },

    phases: [
      { hpPct: 0.66, name: '狂亂之根', sub: '怒火覺醒', color: '#a6d749', dmgMult: 1.0, speedMult: 1.1, cdMult: 0.85,
        tagsOverride: [
          { icon: '🪵', text: '背後弱點 +50%' },
          { icon: '🎯', text: '仇恨切換更快' },
          { icon: '⚡', text: '攻擊強化 +10%' },
        ] },
      { hpPct: 0.33, name: '森羅之怒', sub: '終末綻放', color: '#ff7a3d', dmgMult: 1.2, speedMult: 1.25, cdMult: 0.65,
        tagsOverride: [
          { icon: '🔥', text: '狂暴 — 攻擊 +50%' },
          { icon: '⚡', text: '出招間隔縮短' },
        ] },
    ],

    basic: { name: '橫掃巨臂', type: 'melee', dmg: 45, range: 300, arc: 1.5, knockback: 240, cd: 1.7, windup: 0.5, telegraph: 'arc', color: '#8fbf3f', vfx: 'boss_golem_sweep' },
    skill1: { name: '巨力砸地', type: 'zone', range: 260, radius: 220, dmg: 70, lifetime: 0.4, tick: 0.4, delay: 1.0, knockback: 200, effect: STUN(0.5), cd: 6.8, windup: 0.6, telegraph: 'circle', color: '#7a5a2b', vfx: 'boss_golem_slam' },
    skill2: { name: '纏根束縛', type: 'zone', range: 0, radius: 320, dmgPct: 0.025, lifetime: 1.2, tick: 0.5, pull: 200, effect: ROOT(1.2), cd: 9.8, windup: 0.5, telegraph: 'circle', color: '#4e7a2f', vfx: 'boss_golem_roots' },
    ultimate: { name: '森羅旋掃', type: 'zone', range: 0, radius: 280, dmg: 90, lifetime: 1.2, tick: 0.3, knockback: 500, effect: STUN(1.0), cd: 14.3, windup: 0.6, telegraph: 'circle', color: '#a6d749', vfx: 'boss_golem_ult' },
  };

export default new BaseBoss(data, { aiProfile, modelConfig, buildModel, buildWeapon, loadVfx });