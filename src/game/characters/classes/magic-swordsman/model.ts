// @ts-nocheck
import * as THREE from 'three';
import { buildMagicSwordsmanWeapon } from './weapon.ts';

// pauldron set to false so we can craft highly-detailed pauldrons manually inside buildModel
// headgear set to 'custom' to bypass the default eyes/mouth rendering and prevent facial clipping
export const modelConfig = { bulk: 1.9, weapon: 'magic-sword', skinKind: 'metal', headgear: 'custom', pauldron: false, swingStyle: 'horizontal', stretchBlade: true };

export function buildModel(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, frontX, shoulderX, hipX,
    shoulderY, hipY,
    defaultBodyMat, darkMat, goldMat,
    faceGroup, helmAddons, mkLimb, addAccent, materialTex,
  } = ctx;

  // ── 取得程序化繪製材質貼圖 ──
  const hairTex = materialTex ? materialTex('cloth', 'hair') : null;
  const armorTex = materialTex ? materialTex('metal', 'armor') : null;
  const steelTex = materialTex ? materialTex('steel', 'metal') : null;
  const glassTex = materialTex ? materialTex('glass', 'gem') : null;
  const robeTex = materialTex ? materialTex('cloth', 'robe') : null;
  const capeInnerTex = materialTex ? materialTex('cloth', 'cape-inner') : null;
  const faceTex = materialTex ? materialTex('metal', 'face') : null;

  // ── 精緻與多色彩材質定義 ──
  // 使用灰黑基色微調乘法貼圖亮度，使黑鐵裝甲與披風呈現極深沉的曜黑/玄黑色調
  const armorMat = reg(mat('#8c8c8c', { map: armorTex, rough: 0.25, metal: 0.85 }));
  const steelMat = reg(mat('#ffffff', { map: steelTex, rough: 0.18, metal: 0.9 }));
  const tunicMat = reg(mat('#6b6b6b', { map: armorTex, rough: 0.75, metal: 0.15 }));
  const coreMat = reg(mat('#00f0ff', { map: glassTex, emissive: new THREE.Color('#00d2ff'), ei: 2.2, rough: 0.1, metal: 0.5 }));
  const innerCoreMat = reg(mat('#ffffff', { emissive: new THREE.Color('#e0ffff'), ei: 3.8, rough: 0.05, metal: 0.2 }));
  const sapphireMat = reg(mat('#0055ff', { map: glassTex, emissive: new THREE.Color('#0033aa'), ei: 1.8, rough: 0.1, metal: 0.4 }));
  
  // 漸層長髮材質 (髮根深藍、髮梢銀白)
  const hairMat = reg(mat('#ffffff', { map: hairTex, emissive: new THREE.Color('#8fa8c0'), ei: 0.35, rough: 0.45, metal: 0.2 }));
  const robeMat = reg(mat('#8c8c8c', { map: robeTex, rough: 0.7, metal: 0.2 }));
  const cosmicMat = reg(mat('#ffffff', { map: capeInnerTex, emissive: new THREE.Color('#8b5cf6'), ei: 1.2, rough: 0.5, metal: 0.25, side: THREE.DoubleSide }));
  
  const cyanCrystal = reg(mat('#00f3ff', { map: glassTex, emissive: new THREE.Color('#00d2ff'), ei: 2.0, rough: 0.1, metal: 0.5, transparent: true, opacity: 0.85 }));
  const darkSteel = reg(mat('#08090a', { rough: 0.6, metal: 0.7 }));
  const ribbonMat = reg(mat('#e0f7fc', { emissive: new THREE.Color('#00d2ff'), ei: 1.5, rough: 0.3, metal: 0.5, side: THREE.DoubleSide }));
  const faceMat = reg(mat('#a0a0a0', { map: faceTex, rough: 0.25, metal: 0.85 }));

  // ── 1. 多段式精緻「修長」軀幹 (Slender Modular Torso Group) ──
  const torso = new THREE.Group();

  // A. 內層極修長深紫襯衣 (Slender Inner Tunic Base) - 收窄寬度與厚度 (torsoW * 0.3)
  const innerTunic = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.32, torsoW * 0.36, torsoH, 6), tunicMat);
  innerTunic.position.y = 0;
  torso.add(innerTunic);

  // B. 左右對稱雙側胸甲片 (Left/Right Chest Armor Plates) - 呈現 V 字裝甲層次，且附帶冷銀裝飾線
  const chestL = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.26, torsoH * 0.44, 1.4), armorMat);
  chestL.position.set(frontX * 0.26, torsoH * 0.24, -torsoW * 0.16);
  chestL.rotation.set(0.12, 0.22, -0.08);
  chestL.castShadow = true;

  const chestTrimL = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.28, 0.4, 0.4), steelMat);
  chestTrimL.position.set(0, 0, 0.8);
  chestL.add(chestTrimL);
  torso.add(chestL);

  const chestR = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.26, torsoH * 0.44, 1.4), armorMat);
  chestR.position.set(frontX * 0.26, torsoH * 0.24, torsoW * 0.16);
  chestR.rotation.set(-0.12, -0.22, 0.08);
  chestR.castShadow = true;

  const chestTrimR = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.28, 0.4, 0.4), steelMat);
  chestTrimR.position.set(0, 0, -0.8);
  chestR.add(chestTrimR);
  torso.add(chestR);

  // C. 領口冷銀護圈 (Collar Guard)
  const collarGuard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, torsoW * 0.34), steelMat);
  collarGuard.position.set(frontX * 0.24, torsoH * 0.42, 0);
  torso.add(collarGuard);

  // D. 3D 腹部立體層次甲板 (Abdominal V-Plates) - 排列成極窄、精緻的腹甲片
  const absGroup = new THREE.Group();
  absGroup.position.set(frontX * 0.42, -torsoH * 0.04, 0);
  
  const absUpper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, torsoW * 0.24), steelMat);
  absUpper.rotation.z = -0.15;
  absGroup.add(absUpper);

  const absMid = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, torsoW * 0.20), armorMat);
  absMid.position.set(0.12, -1.3, 0);
  absMid.rotation.z = -0.15;
  absGroup.add(absMid);

  const absLower = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, torsoW * 0.16), steelMat);
  absLower.position.set(0.24, -2.5, 0);
  absLower.rotation.z = -0.15;
  absGroup.add(absLower);

  torso.add(absGroup);

  // E. 胸甲縫隙間的「嵌入式」魔能星形徽記 (Embedded Star Brooch Core)
  const broochGroup = new THREE.Group();
  broochGroup.position.set(frontX * 0.28, torsoH * 0.24, 0);
  
  const broochWingsL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.8), steelMat);
  broochWingsL.position.set(-0.1, 0, -0.8);
  broochWingsL.rotation.set(0.3, 0, -0.3);
  broochGroup.add(broochWingsL);
  
  const broochWingsR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.8), steelMat);
  broochWingsR.position.set(-0.1, 0, 0.8);
  broochWingsR.rotation.set(-0.3, 0, -0.3);
  broochGroup.add(broochWingsR);

  // 縮小的星藍魔能核
  const broochGem = new THREE.Mesh(new THREE.OctahedronGeometry(1.3, 0), sapphireMat);
  broochGroup.add(broochGem);
  torso.add(broochGroup);

  // F. 星海環繞核心環 (縮小貼合)
  const chestRing = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.22, 0.5, 8, 20), coreMat);
  chestRing.position.copy(broochGroup.position);
  chestRing.rotation.set(Math.PI / 3, Math.PI / 2, 0);
  torso.add(chestRing);

  // G. 頸部能量圍巾 (Astral Cowl)
  const collar = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.28, 1.2, 8, 16), armorMat);
  collar.position.set(0, shoulderY - torsoH * 0.08, 0);
  collar.rotation.x = Math.PI / 2;
  torso.add(collar);

  // H. 纖細腰帶與冷銀帶扣
  const belt = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.38, 1.0, 6, 6), darkSteel);
  belt.position.set(0, -torsoH * 0.26, 0);
  belt.rotation.x = Math.PI / 2;
  torso.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 1.8), steelMat);
  buckle.position.set(frontX * 0.28, -torsoH * 0.26, 0);
  torso.add(buckle);

  // 側身立體冷銀護甲裝飾線 (Flank vertical silver lines)
  const flankLineL = new THREE.Mesh(new THREE.BoxGeometry(0.4, torsoH * 0.55, 0.4), steelMat);
  flankLineL.position.set(0, -torsoH * 0.05, -torsoW * 0.35);
  torso.add(flankLineL);
  
  const flankLineR = new THREE.Mesh(new THREE.BoxGeometry(0.4, torsoH * 0.55, 0.4), steelMat);
  flankLineR.position.set(0, -torsoH * 0.05, torsoW * 0.35);
  torso.add(flankLineR);

  // I. 下腹臀基座 (Pelvis Base)
  const lowerPelvis = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.26, torsoW * 0.32, torsoH * 0.22, 6), armorMat);
  lowerPelvis.position.y = -torsoH * 0.36;
  lowerPelvis.castShadow = true;
  torso.add(lowerPelvis);

  // J. 左右兩側修長護臀板 (Side Faulds)
  const fauldL = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.6, torsoW * 0.28), steelMat);
  fauldL.position.set(0, -torsoH * 0.32, -torsoW * 0.36);
  fauldL.rotation.set(-0.15, 0, -0.08);
  fauldL.castShadow = true;
  torso.add(fauldL);

  const fauldR = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.6, torsoW * 0.28), steelMat);
  fauldR.position.set(0, -torsoH * 0.32, torsoW * 0.36);
  fauldR.rotation.set(0.15, 0, -0.08);
  fauldR.castShadow = true;
  torso.add(fauldR);

  // K. 四片環繞修長垂裙 (4 Slim Tassets)
  const addTasset = (px, pz, ry, rz, sideStr) => {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.2, 2.5), armorMat);
    plate.position.set(px, -torsoH * 0.46, pz);
    plate.rotation.set(0.15 * sideStr, ry, rz);
    plate.castShadow = true;
    
    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 2.7), steelMat);
    trim.position.y = -2.8;
    plate.add(trim);
    torso.add(plate);
  };
  addTasset(frontX * 0.20, -1.8, 0.15, -0.12, -1); // 前左
  addTasset(frontX * 0.20, 1.8, -0.15, -0.12, 1);  // 前右
  addTasset(-frontX * 0.15, -1.8, -0.15, 0.12, -1); // 後左
  addTasset(-frontX * 0.15, 1.8, 0.15, 0.12, 1);  // 後右

  // ── 2. 披風：星軌圓弧流光披風 (Wrapping Ribbon-Streamer Cape) ──
  const cape = new THREE.Group();
  cape.position.set(-torsoD * 0.32, shoulderY - 0.2, 0); // 對齊肩膀

  // 背部黃金星月環 (Golden Crescent Clasp)
  const claspRing = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.34, 0.8, 8, 24, Math.PI * 1.4), steelMat);
  claspRing.position.set(-0.3, 0.2, 0);
  claspRing.rotation.set(0, Math.PI / 2, Math.PI / 2);
  claspRing.castShadow = true;
  cape.add(claspRing);

  const claspGem = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), sapphireMat);
  claspGem.position.set(-0.3, 0.2, 0);
  cape.add(claspGem);

  // 雙層圓弧包裹緞帶 (5 Banners wrapping the body in a semicircle)
  const addWrappingStreamer = (len, localX, localZ, rotX, rotY, rotZ) => {
    const sGroup = new THREE.Group();
    sGroup.position.set(localX, 0, localZ);
    sGroup.rotation.set(rotX, rotY, rotZ);

    // 外側布料
    const outerCyl = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.15, torsoW * 0.04, len, 5), robeMat);
    outerCyl.scale.set(0.20, 1.0, 1.55);
    outerCyl.position.y = -len / 2;
    outerCyl.castShadow = true;
    sGroup.add(outerCyl);

    // 內層發光星雲
    const innerCyl = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.13, torsoW * 0.03, len - 0.6, 5), cosmicMat);
    innerCyl.scale.set(0.18, 1.0, 1.45);
    innerCyl.position.set(0.15, -len / 2, 0);
    sGroup.add(innerCyl);

    cape.add(sGroup);
  };

  // 圓弧軌道佈局 (等比縮放，形成圓弧環抱)
  addWrappingStreamer(torsoH * 1.70, -torsoD * 0.45, 0, 0, 0, -0.04);                                  // 中央
  addWrappingStreamer(torsoH * 1.55, -torsoD * 0.35, -torsoW * 0.22, 0.16, 0.25, -0.08);               // 左中
  addWrappingStreamer(torsoH * 1.55, -torsoD * 0.35, torsoW * 0.22, -0.16, -0.25, -0.08);              // 右中
  addWrappingStreamer(torsoH * 1.35, -torsoD * 0.05, -torsoW * 0.42, 0.38, 0.65, -0.15);               // 左外 (往前包覆)
  addWrappingStreamer(torsoH * 1.35, -torsoD * 0.05, torsoW * 0.42, -0.38, -0.65, -0.15);              // 右外 (往前包覆)

  // 披風下緣發光軌跡 (capeTrim)
  const capeTrim = new THREE.Group();
  capeTrim.position.copy(cape.position);

  const addWrappingEnergy = (len, localX, localZ, rotX, rotY, rotZ) => {
    const sGroup = new THREE.Group();
    sGroup.position.set(localX - 0.2, 0, localZ);
    sGroup.rotation.set(rotX, rotY, rotZ);

    const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.05, len, 4), cyanCrystal);
    trail.scale.set(0.18, 1.0, 1.0);
    trail.position.y = -len / 2;
    sGroup.add(trail);
    capeTrim.add(sGroup);
  };

  addWrappingEnergy(torsoH * 1.6, -torsoD * 0.45, 0, 0, 0, -0.06);
  addWrappingEnergy(torsoH * 1.4, -torsoD * 0.35, -torsoW * 0.28, 0.22, 0.3, -0.1);
  addWrappingEnergy(torsoH * 1.4, -torsoD * 0.35, torsoW * 0.32, -0.22, -0.3, -0.1);

  // ── 3. 浮游星之刃 (5 柄) ──
  const swordEnergyOrbs = [];
  for (let i = 0; i < 5; i++) {
    const orb = new THREE.Group();
    const isLast = i === 4;
    const size = isLast ? 1.35 : 1.0;
    const col = isLast ? '#ffffff' : '#00f3ff';
    const bladeMat = isLast ? steelMat : cyanCrystal;
    const coreColMat = reg(new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
    
    const daggerBlade = new THREE.Mesh(new THREE.ConeGeometry(2.0 * size, 11.0 * size, 4), bladeMat);
    daggerBlade.rotation.x = Math.PI;
    daggerBlade.position.y = 3.5 * size;
    daggerBlade.castShadow = true;
    orb.add(daggerBlade);

    const daggerGuard = new THREE.Mesh(new THREE.BoxGeometry(3.5 * size, 0.8 * size, 1.2 * size), steelMat);
    daggerGuard.position.y = -2.0 * size;
    daggerGuard.castShadow = true;
    orb.add(daggerGuard);

    const daggerGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.6 * size, 0.6 * size, 3.5 * size, 4), darkSteel);
    daggerGrip.position.y = -4.0 * size;
    daggerGrip.castShadow = true;
    orb.add(daggerGrip);

    const daggerRing = new THREE.Mesh(new THREE.TorusGeometry(3.6 * size, 0.4, 4, 12), coreColMat);
    daggerRing.rotation.x = Math.PI / 2;
    daggerRing.position.y = -1.8 * size;
    orb.add(daggerRing);

    orb.userData.swordEnergyIndex = i;
    orb.visible = false;
    orb.castShadow = true;
    swordEnergyOrbs.push(orb);
  }

  // ── 4. 浮游星塵晶格 (3 顆) ──
  const extraOrbs = [];
  for (let i = 0; i < 3; i++) {
    const extra = new THREE.Mesh(new THREE.OctahedronGeometry(2.8, 0), cyanCrystal);
    extra.userData.extraOrbitIndex = i;
    extra.visible = true;
    extra.castShadow = true;
    extraOrbs.push(extra);
  }

  // ── 5. 頭部：面罩頭盔與髮型 (Bypassed default face to avoid clipping) ──
  // 使用 SphereGeometry 作為頭部主體盔甲 ( armorMat )
  const head = new THREE.Mesh(new THREE.SphereGeometry(6.2 * bulk, 16, 12), armorMat);
  head.castShadow = true;

  // ── 精緻紋路面罩 (Texture-mapped Face Mask) ──
  // 使用 faceMat 面具貼圖，將眉線、頰甲格線、T形發光眼面鏡等細節，完美呈現在一塊面罩板上，避免多塊3D幾何重疊穿模
  const faceMask = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.8 * bulk, 7.8 * bulk), faceMat);
  faceMask.position.set(frontX * 0.45, 0, 0);
  faceMask.castShadow = true;
  head.add(faceMask);

  // ── 雙眼發光體 3D 覆蓋層 (3D Glowing Eyes Overlay - ensure gaze is highly visible with emissive intensity) ──
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42 * bulk, 1.15 * bulk), coreMat);
  eyeL.position.set(frontX * 0.48, 0.6 * bulk, -1.8 * bulk);
  eyeL.rotation.set(0.12, 0.2, -0.2); // angled angry eyes
  head.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42 * bulk, 1.15 * bulk), coreMat);
  eyeR.position.set(frontX * 0.48, 0.6 * bulk, 1.8 * bulk);
  eyeR.rotation.set(-0.12, -0.2, -0.2);
  head.add(eyeR);

  // 耀白瞳孔光點
  const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.20 * bulk, 0.4 * bulk), innerCoreMat);
  pupilL.position.set(frontX * 0.49, 0.6 * bulk, -1.75 * bulk);
  pupilL.rotation.copy(eyeL.rotation);
  head.add(pupilL);

  const pupilR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.20 * bulk, 0.4 * bulk), innerCoreMat);
  pupilR.position.set(frontX * 0.49, 0.6 * bulk, 1.75 * bulk);
  pupilR.rotation.copy(eyeR.rotation);
  head.add(pupilR);

  // ── 3D 立體金屬裝飾條 (3D Metal Accents Overlay) ──
  // 鼻樑垂直冷銀格柵 (3D Nose Guard)
  const noseRidge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 0.8), steelMat);
  noseRidge.position.set(frontX * 0.49, 0.2, 0);
  head.add(noseRidge);

  // 生氣的冷銀眉棱裝甲線 (3D Brow Guards)
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 3.8), steelMat);
  browL.position.set(frontX * 0.46, 2.2, -2.4);
  browL.rotation.set(0.12, 0.2, -0.2);
  head.add(browL);

  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 3.8), steelMat);
  browR.position.set(frontX * 0.46, 2.2, 2.4);
  browR.rotation.set(-0.12, -0.2, -0.2);
  head.add(browR);

  // 冷銀頭飾羽翼徽記 (Crest Wings)
  const crest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 6.0), steelMat);
  crest.position.set(frontX * 0.2, 6.0, 0);
  head.add(crest);
  const crestGem = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), sapphireMat);
  crestGem.position.set(frontX * 0.2, 5.5, 0);
  head.add(crestGem);

  // ── 6. 不對稱低多邊形動漫髮型 (No-Gap Hair Cap Base & Thick Hair Locks) ──
  // 建立無縫髮貼基底 (Hair Cap) - 向後下方偏移，露出更精美的面罩線條
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(6.3 * bulk, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
  hairCap.position.set(-0.8 * bulk, 0.4 * bulk, 0);
  hairCap.rotation.set(0.26, 0, 0);
  head.add(hairCap);

  // 髮前冷銀頭帶/皇冠 (Tiara Headband Ornament)
  const tiara = new THREE.Mesh(new THREE.TorusGeometry(6.4 * bulk, 0.45, 6, 24, Math.PI * 0.8), steelMat);
  tiara.position.set(-0.2 * bulk, 1.2 * bulk, 0);
  tiara.rotation.set(0.24, Math.PI / 2, Math.PI / 2);
  head.add(tiara);

  const tiaraGem = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), coreMat);
  tiaraGem.position.set(frontX * 0.22, 3.2 * bulk, 0);
  head.add(tiaraGem);

  // 側髮魔能星徽髮夾 L/R (Star Hair Clips for sideburns)
  const clipL = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), coreMat);
  clipL.position.set(frontX * 0.16, -0.6 * bulk, -5.2 * bulk);
  head.add(clipL);

  const clipR = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), coreMat);
  clipR.position.set(frontX * 0.16, -0.6 * bulk, 5.2 * bulk);
  head.add(clipR);

  // ── 後方立體綁髮與束髮馬尾 (3D Ponytail - replacing flat paper ribbons) ──
  // 綁髮金裝飾環 (Hair Knot ring)
  const hairKnot = new THREE.Mesh(new THREE.TorusGeometry(1.6 * bulk, 0.4 * bulk, 6, 12), steelMat);
  hairKnot.position.set(-6.0 * bulk, 1.8 * bulk, 0);
  hairKnot.rotation.set(0, Math.PI / 2, Math.PI / 2);
  head.add(hairKnot);

  // 多段下垂粗壯馬尾 (Ponytail locks)
  const addPonytailSegment = (radius, height, px, py, pz, rz) => {
    const seg = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 4), hairMat);
    seg.position.set(px, py, pz);
    seg.rotation.set(0, 0, rz);
    seg.castShadow = true;
    head.add(seg);
  };
  // 雙節自然重力下垂馬尾
  addPonytailSegment(1.8 * bulk, 8.0 * bulk, -7.8 * bulk, -1.8 * bulk, 0, Math.PI + 0.15);
  addPonytailSegment(1.4 * bulk, 6.0 * bulk, -9.2 * bulk, -4.5 * bulk, 0, Math.PI + 0.22);

  // 粗壯且富有層次的低多邊形動漫髮瓣 (Thick Cone Locks)
  // 設定合理半徑與高度，並定位於 hairCap 表面
  const addHairLock = (radius, height, px, py, pz, rx, ry, rz, sx = 1.0, sy = 1.0, sz = 1.0) => {
    const lock = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 4), hairMat);
    lock.position.set(px, py, pz);
    lock.rotation.set(rx, ry, rz);
    lock.scale.set(sx, sy, sz);
    lock.castShadow = true;
    head.add(lock);
  };

  // 側邊髮鬢 L/R (厚實垂落，包覆臉部)
  addHairLock(2.0, 7.5, frontX * 0.22, -1.0 * bulk, -5.2 * bulk, 0.15, 0.4, Math.PI + 0.15, 1.2, 1.2, 0.55);
  addHairLock(2.0, 7.5, frontX * 0.22, -1.0 * bulk, 5.2 * bulk, -0.15, -0.4, Math.PI - 0.15, 1.2, 1.2, 0.55);

  // 後側束髮 L/R (粗壯髮簇)
  addHairLock(2.4, 9.0, -3.8 * bulk, -2.5 * bulk, -3.2 * bulk, 0.2, 0.6, Math.PI + 0.2, 1.1, 1.1, 0.6);
  addHairLock(2.4, 9.0, -3.8 * bulk, -2.5 * bulk, 3.2 * bulk, -0.2, -0.6, Math.PI - 0.2, 1.1, 1.1, 0.6);

  // 頭頂星型蓬鬆刺角 L/R (朝上生長)
  addHairLock(1.6, 5.2, -1.2 * bulk, 4.5 * bulk, -2.5 * bulk, 0.1, 0.2, 0.45, 1.1, 1.0, 0.6);
  addHairLock(1.6, 5.2, -1.2 * bulk, 4.5 * bulk, 2.5 * bulk, -0.1, -0.2, 0.45, 1.1, 1.0, 0.6);

  // 前額瀏海髮瓣 L/R (Front bangs, Sprouting down over the forehead to frame visor)
  addHairLock(1.2, 4.5, frontX * 0.32, 4.0 * bulk, -2.0 * bulk, 0.1, 0.2, Math.PI - 0.5, 1.0, 1.0, 0.65);
  addHairLock(1.2, 4.5, frontX * 0.32, 4.0 * bulk, 2.0 * bulk, -0.1, -0.2, Math.PI - 0.5, 1.0, 1.0, 0.65);

  // ── 7. 四肢：精緻化肢體與護甲裝甲線 (Custom Detailed Limbs) ──
  const limbMat = reg(mat('#ffffff', { map: armorTex, rough: 0.3, metal: 0.8 }));
  const limbBootMat = reg(mat('#ffffff', { map: armorTex, rough: 0.4, metal: 0.7 }));

  const armL = mkLimb(0, -shoulderX, true, limbMat, limbBootMat, '#00d2ff');
  const armR = mkLimb(0, shoulderX, true, limbMat, limbBootMat, '#00d2ff');
  const legL = mkLimb(0, -hipX, false, limbMat, limbBootMat, '#00d2ff');
  const legR = mkLimb(0, hipX, false, limbMat, steelMat, '#00d2ff'); // Use steelMat on boots for contrast

  const rebuildArm = (pivot, isLeft) => {
    if (typeof pivot.clear === 'function') pivot.clear();
    else while (pivot.children.length > 0) pivot.remove(pivot.children[0]);

    const w = 4.6 * bulk;
    const len = 14;

    // 肩關節球
    const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(w * 0.42, 8, 8), darkSteel);
    shoulderJoint.castShadow = true;
    pivot.add(shoulderJoint);

    // 上臂裝甲
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.32, w * 0.28, len * 0.45, 6), armorMat);
    upperArm.position.y = -len * 0.22;
    upperArm.castShadow = true;
    pivot.add(upperArm);

    // 手肘能量關節
    const elbowJoint = new THREE.Mesh(new THREE.OctahedronGeometry(w * 0.38, 0), coreMat);
    elbowJoint.position.y = -len * 0.48;
    elbowJoint.castShadow = true;
    pivot.add(elbowJoint);

    // 下臂護手
    const gauntletW = w * 0.85;
    const gauntletH = len * 0.48;
    const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(gauntletW, gauntletH, gauntletW), armorMat);
    gauntlet.position.y = -len * 0.5 - gauntletH / 2;
    gauntlet.castShadow = true;
    pivot.add(gauntlet);

    // 護手冷銀飾邊
    const gauntletTrim = new THREE.Mesh(new THREE.BoxGeometry(gauntletW + 0.3, 1.0, gauntletW + 0.3), steelMat);
    gauntletTrim.position.y = -len * 0.5 - gauntletH + 0.5;
    gauntletTrim.castShadow = true;
    pivot.add(gauntletTrim);

    // 外側魔能防護水晶盾片
    const shieldPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, gauntletH * 0.8, gauntletW * 0.75), cyanCrystal);
    shieldPlate.position.set(isLeft ? -gauntletW * 0.42 : gauntletW * 0.42, -len * 0.5 - gauntletH / 2, 0);
    shieldPlate.castShadow = true;
    pivot.add(shieldPlate);
  };

  const rebuildLeg = (pivot, isLeft) => {
    if (typeof pivot.clear === 'function') pivot.clear();
    else while (pivot.children.length > 0) pivot.remove(pivot.children[0]);

    const w = 5.2 * bulk;
    const len = 14;

    // 髖部關節球
    const hipJoint = new THREE.Mesh(new THREE.SphereGeometry(w * 0.44, 8, 8), darkSteel);
    hipJoint.castShadow = true;
    pivot.add(hipJoint);

    // 大腿裝甲
    const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.38, w * 0.32, len * 0.45, 6), armorMat);
    upperLeg.position.y = -len * 0.22;
    upperLeg.castShadow = true;
    pivot.add(upperLeg);

    // 膝蓋魔能關節
    const kneeJoint = new THREE.Mesh(new THREE.OctahedronGeometry(w * 0.40, 0), coreMat);
    kneeJoint.position.y = -len * 0.48;
    kneeJoint.castShadow = true;
    pivot.add(kneeJoint);

    // 冷銀外側護膝
    const kneeGuard = new THREE.Mesh(new THREE.SphereGeometry(w * 0.45, 6, 4), steelMat);
    kneeGuard.scale.set(1.2, 0.6, 1.0);
    kneeGuard.position.set(w * 0.3, -len * 0.48, 0);
    kneeGuard.castShadow = true;
    pivot.add(kneeGuard);

    // 下肢靴裝甲
    const bootW = w * 0.95;
    const bootH = len * 0.48;
    const boot = new THREE.Mesh(new THREE.BoxGeometry(bootW, bootH, bootW), armorMat);
    boot.position.y = -len * 0.5 - bootH / 2;
    boot.castShadow = true;

    // 靴子正面垂直冷銀飾條 (Boot vertical stripe)
    const bootStripe = new THREE.Mesh(new THREE.BoxGeometry(0.35, bootH * 0.8, 0.4), steelMat);
    bootStripe.position.set(bootW * 0.45, 0, 0); // face front (+X)
    boot.add(bootStripe);
    pivot.add(boot);

    // 靴頂冷銀飾邊
    const bootTrim = new THREE.Mesh(new THREE.BoxGeometry(bootW + 0.3, 1.2, bootW + 0.3), steelMat);
    bootTrim.position.y = -len * 0.5 - 0.6;
    bootTrim.castShadow = true;
    pivot.add(bootTrim);
  };

  rebuildArm(armL, true);
  rebuildArm(armR, false);
  rebuildLeg(legL, true);
  rebuildLeg(legR, false);

  // ── 自訂肩甲 ──
  for (const [arm, side] of [[armL, -1], [armR, 1]]) {
    const pGroup = new THREE.Group();
    
    // 肩甲主板
    const mainPlate = new THREE.Mesh(new THREE.BoxGeometry(5.8, 6.0, 7.5), armorMat);
    mainPlate.castShadow = true;
    mainPlate.position.set(0, 1.0, side * 0.5);
    mainPlate.rotation.z = -side * 0.15;
    pGroup.add(mainPlate);
    
    // 頂邊冷銀飾條
    const edgeTrim = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.2, 8.0), steelMat);
    edgeTrim.castShadow = true;
    edgeTrim.position.set(0, 3.2, 0);
    mainPlate.add(edgeTrim);
    
    // 側邊星藍魔能核心
    const pCore = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), coreMat);
    pCore.position.set(2.6 * side, 0, 0);
    pCore.rotation.y = Math.PI / 2;
    mainPlate.add(pCore);

    arm.add(pGroup);
  }

  return {
    torso,
    head,
    armL,
    armR,
    legL,
    legR,
    attachments: [cape, capeTrim, ...swordEnergyOrbs, ...extraOrbs],
    customUpdate(dt, _group, ud, info) {
      const se = info.p && info.p.magicSwordsman;
      const count = se ? Math.max(0, Math.min(5, se.swordEnergy || 0)) : 0;
      const baseY = 18;
      for (let i = 0; i < swordEnergyOrbs.length; i++) {
        const orb = swordEnergyOrbs[i];
        orb.visible = i < count;
        if (!orb.visible) continue;
        const a = ud.breathe * 1.4 + i * (Math.PI * 2 / Math.max(1, count));
        const r = 48 + count * 3;
        orb.position.set(Math.cos(a) * r, baseY + Math.sin(a * 1.5 + i * 1.2) * 8, Math.sin(a) * r);
        orb.rotation.x += dt * 1.6;
        orb.rotation.y += dt * 2.5;
        orb.rotation.z += dt * 1.0;
        orb.scale.setScalar(1 + Math.sin(ud.breathe * 3 + i * 1.5) * 0.08);
      }
      for (let i = 0; i < extraOrbs.length; i++) {
        const extra = extraOrbs[i];
        const a = ud.breathe * 0.6 + i * (Math.PI * 2 / 3);
        const r = 62;
        extra.position.set(Math.cos(a) * r, 22 + Math.sin(a * 2 + i) * 5, Math.sin(a) * r);
        extra.rotation.x += dt * 0.8;
        extra.rotation.y += dt * 1.2;
        extra.rotation.z += dt * 0.4;
        extra.scale.setScalar(1 + Math.sin(ud.breathe * 1.5 + i) * 0.05);
      }
      cape.rotation.z = Math.sin(ud.breathe * 0.8) * 0.06;
      capeTrim.rotation.z = Math.sin(ud.breathe * 0.8 + 0.3) * 0.08;
    },
  };
}

export const buildWeapon = buildMagicSwordsmanWeapon;
