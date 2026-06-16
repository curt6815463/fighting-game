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
//
// Boss 皮膚 (id >= 100)：
//   - boss_golem.fbx (id: 100 巨木傀儡) — 使用 FBXLoader，running 動畫同時對應 walk / run 槽位

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
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
  'hexer',
  'bard',
  'samurai',
  'gunner',
  'summoner',
  'necromancer',
  'chronomancer',
];

// charId -> 檔案格式
const CHAR_FORMATS = {
  0: 'gltf',
};

// Boss 皮膚設定 (id >= 100)
const BOSS_SKIN_FILES = {
  100: { file: 'boss_golem.fbx', format: 'fbx' }, // R1 巨木傀儡
};

// 各動作的候選 clip 名稱 (對照 humanoid.glb 內建動畫)
const DEFAULT_CLIPS = {
  idle: ['idle', 'Idle'],
  walk: ['walk', 'Walk'],
  run: ['run', 'Run'],
  attack: ['agree', 'Punch', 'Attack'],
  hit: ['headShake', 'hit', 'Hit'],
};

// Boss FBX 動畫 clip 對應：Running.fbx 的動畫名稱不確定，
// 直接抓第一個動畫同時對應 idle / walk / run（共用同一段跑步動畫）
const BOSS_CLIPS = {
  idle:   ['mixamo.com', 'Running', 'Run', 'Walk', 'Idle', 'idle'],
  walk:   ['mixamo.com', 'Running', 'Run', 'Walk', 'walk'],
  run:    ['mixamo.com', 'Running', 'Run', 'run'],
  attack: ['Attack', 'attack', 'Punch', 'punch'],
  hit:    ['Hit', 'hit', 'headShake'],
};

// 每角色覆寫：微調人形的朝向、大小或高度
const DEFAULT_CFG = { scaleMul: 0.38, yOffset: 0, rotationY: Math.PI / 2 };
const OVERRIDES = {
  3: { scaleMul: 0.46 }, // 坦克稍微大一點
  6: { scaleMul: 0.42 }, // 狂戰士稍微大一點
};

// Boss 皮膚覆寫設定
const BOSS_OVERRIDES = {
  // R1 巨木傀儡
  // rotationY: Mixamo FBX 面向 +Z，遊戲模型期望面向 +X，需旋轉 +90°
  // scaleMul: FBX 單位為 cm，boss group 本身已有 2.2x scale，
  //           自動縮放公式 = (PLAYER_RADIUS*2*FOOTPRINT_FILL / footprint) * scaleMul * 2.2
  //           footprint ≈ 60 (cm), target ≈ 216 (=18*2*6)
  //           scaleMul=1.2 → scale≈(216/60)*1.2*2.2 ≈ 9.5  (合理的大型 boss)
  100: {
    scaleMul: 1.2,
    yOffset: 0,
    rotationY: Math.PI / 2,   // Mixamo +Z → 遊戲 +X
    clips: BOSS_CLIPS,
    isBoss: true,
  },
};

export function getSkinConfig(charId) {
  const slug = CHAR_SLUGS[charId] || CHAR_SLUGS[0];

  // Boss 皮膚
  if (charId >= 100 && BOSS_SKIN_FILES[charId]) {
    const bossFile = BOSS_SKIN_FILES[charId];
    const bossOvr = BOSS_OVERRIDES[charId] || {};
    return {
      url: asset(`assets/characters/warrior/${bossFile.file}`),
      format: bossFile.format,
      clips: BOSS_CLIPS,
      scaleMul: 0.18,
      yOffset: 0,
      rotationY: 0,
      isBoss: true,
      ...bossOvr,
    };
  }

  const format = CHAR_FORMATS[charId] || 'glb';
  return {
    url: modelUrl(slug, format),
    clips: DEFAULT_CLIPS,
    ...DEFAULT_CFG,
    ...(OVERRIDES[charId] || {}),
  };
}

const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();
const cache = new Map(); // charId -> Promise<Template|null>

// 載入並快取 gltf/fbx 模板。無檔/失敗回 null。
export function prepareSkin(charId) {
  // 一般角色 (id < 100)：停用 GLB 皮膚，全面採用精緻的程序化二頭身鋼彈 Mecha 模型
  if (charId < 100) {
    return Promise.resolve(null);
  }

  // Boss 皮膚：僅對有設定的 boss 啟用
  if (!BOSS_SKIN_FILES[charId]) {
    return Promise.resolve(null);
  }

  if (cache.has(charId)) return cache.get(charId);

  const cfg = getSkinConfig(charId);

  let promise;
  if (cfg.format === 'fbx') {
    // FBX 載入流程
    promise = new Promise((resolve) => {
      fbxLoader.load(
        cfg.url,
        (fbxGroup) => {
          // FBX 載入後的結構與 GLTF 不同，直接包裝成一致格式
          resolve({
            scene: fbxGroup,
            animations: fbxGroup.animations || [],
            cfg,
            isFBX: true,
          });
        },
        undefined, // onProgress
        (err) => {
          console.warn(`[skins] FBX 載入失敗 charId=${charId}:`, err?.message || err);
          resolve(null);
        }
      );
    });
  } else {
    // GLTF/GLB 載入流程
    promise = new Promise((resolve) => {
      gltfLoader.load(
        cfg.url,
        (gltf) => {
          resolve({ scene: gltf.scene, animations: gltf.animations || [], cfg });
        },
        undefined,
        (err) => {
          console.warn(`[skins] GLB 載入失敗 charId=${charId}:`, err?.message || err);
          resolve(null);
        }
      );
    });
  }

  cache.set(charId, promise);
  return promise;
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

  let root;
  if (template.isFBX) {
    // FBX 不透過 SkeletonUtils.clone（會有問題），直接使用原始場景（單人 boss 不需複製）
    // 注意：若需多個 boss 實例，此處要改為深複製
    root = template.scene;
  } else {
    root = cloneSkinned(template.scene);
  }

  root.rotation.y = cfg.rotationY || 0;

  // ---- 自動縮放：量測 bounding box，把俯視 footprint 對齊碰撞直徑 ----
  root.scale.setScalar(1);
  root.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  const footprint = Math.max(size.x, size.z) || 1;
  const target = PLAYER_RADIUS * 2 * FOOTPRINT_FILL;
  root.scale.setScalar((target / footprint) * (cfg.scaleMul || 1));

  // ---- 自動貼地 ----
  root.position.y = 0;
  root.updateMatrixWorld(true);
  const minY = new THREE.Box3().setFromObject(root).min.y;
  root.position.y = (cfg.yOffset || 0) - minY;

  // 逐實例 clone 材質（避免隱身淡出影響到共用同模型的其他玩家）
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.frustumCulled = false;
    if (Array.isArray(o.material)) o.material = o.material.map((m) => m.clone());
    else if (o.material) o.material = o.material.clone();
  });

  // ---- 移除 Root Motion（FBX 專用）----
  // Mixamo FBX 的 running 動畫在根骨骼（Hips/Root/Pelvis）的 position track
  // 帶有 X/Z 位移資料，播放時會讓模型物理漂移離開碰撞位置。
  // 解法：過濾掉根骨骼的 .position track，只保留 .quaternion / .scale，
  //        讓 Y 軸 position (起伏感) 也一並移除，避免浮空/陷地閃爍。
  if (template.isFBX) {
    for (const clip of template.animations || []) {
      clip.tracks = clip.tracks.filter((track) => {
        if (!track.name.includes('.position')) return true; // 保留非 position track
        const boneName = track.name.split('.')[0].toLowerCase();
        // 移除根骨骼的 position（Hips / mixamorigHips / Root / Pelvis 等命名）
        return !(
          boneName.includes('hips') ||
          boneName.includes('root') ||
          boneName.includes('pelvis') ||
          boneName === 'mixamorig:hips'
        );
      });
    }
  }

  const mixer = new THREE.AnimationMixer(root);
  const clipMap = cfg.clips || DEFAULT_CLIPS;
  const animations = template.animations || [];

  // 若是 FBX 且沒有動畫名稱命中，自動用第一個動畫對應 idle/walk/run
  const actions = {};

  if (template.isFBX && animations.length > 0) {
    // 先嘗試按名稱匹配
    for (const key of ['idle', 'walk', 'run', 'attack', 'hit']) {
      const clip = pickClip(animations, clipMap[key] || []);
      if (clip) {
        const act = mixer.clipAction(clip);
        if (key === 'attack' || key === 'hit') {
          act.setLoop(THREE.LoopOnce, 1);
          act.clampWhenFinished = true;
        }
        actions[key] = act;
      }
    }

    // 若 idle/walk/run 有任一沒命中，用第一個動畫補上（Running.fbx 通常只有一個 clip）
    const firstClip = animations[0];
    const fallbackKeys = ['idle', 'walk', 'run'];
    for (const key of fallbackKeys) {
      if (!actions[key] && firstClip) {
        const act = mixer.clipAction(firstClip);
        actions[key] = act;
      }
    }

    console.log(
      `[skins] FBX boss(${cfg.isBoss ? 'boss' : 'char'}) 動畫: [${animations.map((a) => a.name).join(', ')}]`,
      '→ actions:', Object.keys(actions)
    );
  } else {
    // GLB 標準流程
    for (const key of ['idle', 'walk', 'run', 'attack', 'hit']) {
      const clip = pickClip(animations, clipMap[key] || []);
      if (!clip) continue;
      const act = mixer.clipAction(clip);
      if (key === 'attack' || key === 'hit') {
        act.setLoop(THREE.LoopOnce, 1);
        act.clampWhenFinished = true;
      }
      actions[key] = act;
    }
  }

  return { root, mixer, actions, cfg };
}
