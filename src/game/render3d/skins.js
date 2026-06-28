// GLB 角色皮膚載入管線（選用，找不到檔案就安全回退到 models.js 的程序化模型）。
//
// === 如何加入皮膚 ===
// 1. 取得一個 rigged glTF 角色（含 idle / walk / attack / hit 動畫最佳）。
//    免費 CC0 來源建議：
//      - Quaternius  https://quaternius.com  （Universal Animation Library / RPG Characters，已綁骨含多段動畫）
//      - Kenney      https://kenney.nl/assets （Mini Characters / Blocky Characters）
//      - Mixamo      https://mixamo.com       （自動綁骨 + 動畫，匯出 glTF Binary）
// 2. 匯出成 model.glb，放到：public/assets/characters/<職業 slug>/model.glb
//    例如 public/assets/characters/warrior/model.glb。
// 3. 皮膚會自動依 bounding box 縮放對齊碰撞大小並貼地；若朝向不對調整 OVERRIDES 的 rotationY
//    (需要時也可加 scaleMul 微調視覺大小 / yOffset 微調高度)。
//
// 沒有放任何 .glb 時，本管線的 prepareSkin() 會因 404 回傳 null，遊戲照常使用程序化模型。

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { PLAYER_RADIUS } from '../constants.js';

// 皮膚自動縮放：俯視 footprint (長/寬取大者) 對齊到碰撞直徑的倍率。
// 1.0 = 完全貼合碰撞圈；>1 = 視覺略大於碰撞 (較有體積感)。
const FOOTPRINT_FILL = 6;

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
const modelUrl = (slug, format) => asset(`assets/characters/${slug}/model.${format}`);

// charId -> 職業資源資料夾 slug
const CHAR_SLUGS = [
  'warrior',
  'mage',
  'assassin',
  'tank',
  'archer',
  'healer',
  'berserker',
  'ninja',
  'elementalist',
  'fighter',
  'paladin',
  'chronohex',
  'bard',
  'samurai',
  'gunner',
  'summoner',
  'necromancer',
];

// charId -> 檔案格式
const CHAR_FORMATS = {
  0: 'gltf',
};

// 各動作的候選 clip 名稱 (對照 humanoid.glb 內建動畫)
const DEFAULT_CLIPS = {
  idle: ['idle', 'Idle'],
  walk: ['walk', 'Walk'],
  run: ['run', 'Run'],
  attack: ['agree', 'Punch', 'Attack'],
  hit: ['headShake', 'hit', 'Hit'],
};

// 每角色覆寫：微調人形的朝向、大小或高度
const DEFAULT_CFG = { scaleMul: 0.38, yOffset: 0, rotationY: Math.PI / 2 };
const OVERRIDES = {
  3: { scaleMul: 0.46 }, // 坦克稍微大一點
  6: { scaleMul: 0.42 }, // 狂戰士稍微大一點
};

export function getSkinConfig(charId) {
  const slug = CHAR_SLUGS[charId] || CHAR_SLUGS[0];
  const format = CHAR_FORMATS[charId] || 'glb';
  return {
    url: modelUrl(slug, format),
    clips: DEFAULT_CLIPS,
    ...DEFAULT_CFG,
    ...(OVERRIDES[charId] || {}),
  };
}

const loader = new GLTFLoader();
const cache = new Map(); // charId -> Promise<Template|null>

// 載入並快取 gltf 模板。無檔/失敗回 null。
export function prepareSkin(charId) {
  // 停用 GLB 皮膚，全面採用精緻的程序化二頭身鋼彈 Mecha 模型
  return Promise.resolve(null);
}

function pickClip(animations, names) {
  if (!animations.length) return null;
  for (const n of names) {
    const c = animations.find((a) => a.name === n);
    if (c) return c;
  }
  for (const n of names) {
    const low = n.toLowerCase();
    const c = animations.find((a) => a.name.toLowerCase().includes(low));
    if (c) return c;
  }
  return null;
}

// 由模板複製出可獨立播放動畫的實例：{ root, mixer, actions, cfg }
export function instantiateSkin(template) {
  if (!template) return null;
  const cfg = template.cfg;
  const root = cloneSkinned(template.scene);
  root.rotation.y = cfg.rotationY || 0;

  // ---- 自動縮放：量測 bounding box，把俯視 footprint 對齊碰撞直徑 ----
  // 換任何皮膚都會自動對齊碰撞大小 (PLAYER_RADIUS)，不需每角色手調 scale。
  // 於 bind-pose 量測 (動畫未播放)，尺寸穩定。
  root.scale.setScalar(1);
  root.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  const footprint = Math.max(size.x, size.z) || 1;       // 俯視佔地 (長/寬取大者)
  const target = PLAYER_RADIUS * 2 * FOOTPRINT_FILL;     // 目標直徑
  root.scale.setScalar((target / footprint) * (cfg.scaleMul || 1));

  // ---- 自動貼地：縮放後重新量測，把模型最低點對齊地面 (y = yOffset，預設 0) ----
  root.position.y = 0;
  root.updateMatrixWorld(true);
  const minY = new THREE.Box3().setFromObject(root).min.y;
  root.position.y = (cfg.yOffset || 0) - minY;

  // 逐實例 clone 材質（避免隱身淡出影響到共用同模型的其他玩家）
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.frustumCulled = false; // 骨架動畫會移動包圍盒，關閉視錐裁切避免閃失
    if (Array.isArray(o.material)) o.material = o.material.map((m) => m.clone());
    else if (o.material) o.material = o.material.clone();
  });

  const mixer = new THREE.AnimationMixer(root);
  const actions = {};
  for (const key of ['idle', 'walk', 'attack', 'hit']) {
    const clip = pickClip(template.animations, cfg.clips[key] || []);
    if (!clip) continue;
    const act = mixer.clipAction(clip);
    if (key === 'attack' || key === 'hit') {
      act.setLoop(THREE.LoopOnce, 1);
      act.clampWhenFinished = true;
    }
    actions[key] = act;
  }
  return { root, mixer, actions, cfg };
}
