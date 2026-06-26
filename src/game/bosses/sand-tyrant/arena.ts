// 風沙法皇的場地：黃沙砂暴遺跡 — 乾裂荒漠地、升起的金砂漩渦、嶙峋黑岩尖石、半埋砂岩門坊石柱、金色餘燼飄浮。
//
// 沿用 golem/arena.ts 的「rich arena」結構（見 render3d/decorations/README.md）。
// 配色呼應 boss：砂金 #d4af37 + 法袍褐 #5c4033 + 砂色 #dfc48c。依參考美術圖做「明亮塵霾白晝」的沙暴感，
// 與 R1（暖陽神殿森林）、R2（陰鬱毒沼祭壇）三關鮮明區隔：本場明亮去飽和的暖褐塵霧 + 金砂發光點綴。
// 注意：刻意「不放魔法陣」（無 floorDecal）。地板用風吹沙丘（sand：暖金沙＋風紋波痕），結構上有別於 R1 苔泥地 / R2 砌石祭壇。

import type { ArenaDef } from '../../render3d/arena.types.ts';
import { buildSandVortices, buildSpires, buildPyramid, buildOasis } from './props.js';

export const arena: ArenaDef = {
  theme: {
    sky: 0xc6b591, fog: 0xa89476, fogNear: 600, fogFar: 3800,
    floorStyle: 'sand', floorTint: 0xe2cda0, outerGround: 0x8a724c,
    wallStyle: 'natural', wallTrimGlow: 0,
    wallStone: 0x6b5640, wallTrim: 0x7e6a48,
    hemiSky: 0xe8d4a0, hemiGround: 0x3a2c1c, hemiInt: 0.6,
    sunColor: 0xffe6ad, sunInt: 1.8, rimColor: 0xd4af37, rimInt: 0.35,
    decorations: ['pyramid', 'rock', 'spires', 'pillar', 'ruins', 'oasis', 'vortices'],
    props: { pyramid: buildPyramid, oasis: buildOasis, vortices: buildSandVortices, spires: buildSpires },
    // 金字塔：場外後方偏右（避開中央血條與左側綠洲），基座最近緣 z≈-840 < 邊界 -800，不戳進場內。
    pyramid: { x: 900, z: -1380, height: 720, radius: 540, color: 0x705c3c },
    // 綠洲：多片（不規則湖岸）。共用色＋各片位置。一片在場內（純裝飾、可穿越、無棕櫚）。
    oasis: {
      water: 0x4fb0bf, deep: 0x2b7e93, frond: 0x4f8a2e, grass: 0x5a8f30, bank: 0xb89a68,
      spots: [
        { x: -1300, z: -150, rx: 200, rz: 165, palms: 4 }, // 左側邊界（水覆過左牆 →「牆水交界」）
        { x: 1320, z: 240, rx: 195, rz: 160, palms: 3 },   // 右側場外
        { x: -560, z: -1070, rx: 235, rz: 150, palms: 4 }, // 後方場外（遠離金字塔 x=900）
        { x: 360, z: 360, rx: 150, rz: 110, palms: 0 },    // 場內·可穿越（小、不長棕櫚）
      ],
    },
    rock: { count: 10, color: 0x5a4a38 },
    spires: { count: 9, color: 0x4a3d30 },
    pillar: { count: 7, color: 0x6e5a40 },
    ruins: { count: 5, color: 0x6e5a42, moss: 0x7a6844, vine: 0x6a5836, scale: 1.2 },
    vortices: { count: 5, color: 0xf2e2bc, opacity: 0.55 },
    atmosphere: { kind: 'embers', color: '#dfc48c', rate: 20 },
    // 不放魔法陣：刻意省略 floorDecal。
  },
  // 開放沙場，無擋路地標 → 不設 colliders。
};
