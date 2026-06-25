// 場景裝飾物體：依 boss theme 在競技場「外圍」散佈 (不可互動，純視覺)。
// 使用 InstancedMesh 一次 draw call；每個 instance 有獨立 alpha (aFade)，
// 阻擋玩家視線時自動半透明。
//
// 種類：tree (圓錐+樹幹) / rock (多面石) / crystal (高瘦多面體) / pillar (殘柱) / brazier (火盆)

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { ARENA } from '../constants.js';

// ---- 有機化工具：頂點噪聲 / 垂直漸層色 / 樹冠團塊 ----
// 平滑值噪 (多頻正弦疊加，~[-1,1])：給頂點位移用，比純亂數圓滑、像自然起伏
function lumpNoise(x, y, z) {
  return (
    Math.sin(x * 0.11 + y * 0.13) +
    Math.sin(y * 0.17 + z * 0.09 + 1.3) +
    Math.sin(z * 0.15 + x * 0.07 + 2.1) +
    0.5 * Math.sin(x * 0.31 + z * 0.27 + 4.2)
  ) / 3.5;
}

// 沿法線擾動頂點，讓「方塊/多面體」變成風化有機形。先 weld 避免接縫裂開。
function noisify(geo, amp) {
  let g = mergeVertices(geo);
  g.computeVertexNormals();
  const pos = g.attributes.position, nor = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const xv = pos.getX(i), yv = pos.getY(i), zv = pos.getZ(i);
    const d = amp * lumpNoise(xv, yv, zv);
    pos.setXYZ(i, xv + nor.getX(i) * d, yv + nor.getY(i) * d, zv + nor.getZ(i) * d);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

// 烘焙垂直漸層頂點色：底部暗、頂部亮 (陽光照樹冠/灌木的層次感，免額外貼圖)
function bakeVerticalColor(geo, botHex, topHex) {
  const pos = geo.attributes.position;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const span = Math.max(1, maxY - minY);
  const bot = new THREE.Color(botHex), top = new THREE.Color(topHex), tmp = new THREE.Color();
  const arr = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - minY) / span;
    tmp.copy(bot).lerp(top, t * t);
    arr[i * 3] = tmp.r; arr[i * 3 + 1] = tmp.g; arr[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

// 樹冠團塊：數顆偏移 icosphere 各自噪聲後融合 → 蓬鬆不規則樹冠 (取代圓錐)
function canopyClump() {
  const blobs = [
    [0, 20, 0, 48], [28, 8, 10, 36], [-24, 4, -12, 34], [8, -4, 26, 30], [-10, 0, -28, 28], [16, 14, -18, 26],
  ];
  const parts = [];
  for (const [ox, oy, oz, r] of blobs) {
    let b = new THREE.IcosahedronGeometry(r, 1);
    b = noisify(b, r * 0.24);
    b.scale(1, 0.82, 1);
    b.translate(ox, oy, oz);
    parts.push(b);
  }
  return mergeGeometries(parts, false);
}

// 在競技場「外環」散佈：保證 inner > arena 邊界，避免遮擋玩家
function scatterPositions(count, opts = {}) {
  const halfW = ARENA.width / 2;
  const halfH = ARENA.height / 2;
  const innerR = opts.inner || Math.max(halfW, halfH) * 1.05;
  const outerR = opts.outer || Math.max(halfW, halfH) * 1.7;
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = innerR + Math.random() * (outerR - innerR);
    pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, ang: Math.random() * Math.PI * 2, scale: 0.85 + Math.random() * 0.5 });
  }
  return pts;
}

// 為 InstancedMesh 注入 aFade attribute + shader 修改：實現 per-instance 透明度
function attachFade(im, mat, count) {
  const fadeArr = new Float32Array(count);
  for (let i = 0; i < count; i++) fadeArr[i] = 1;
  const fadeAttr = new THREE.InstancedBufferAttribute(fadeArr, 1);
  im.geometry.setAttribute('aFade', fadeAttr);
  mat.transparent = true;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = 'attribute float aFade;\nvarying float vFade;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvFade = aFade;'
    );
    shader.fragmentShader = 'varying float vFade;\n' + shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      'diffuseColor.a *= vFade;\n#include <opaque_fragment>'
    );
  };
  mat.needsUpdate = true;
  im.userData.fadeAttr = fadeAttr;
}

function makeInstanced(geo, mat, positions, baseScale = 1) {
  const im = new THREE.InstancedMesh(geo, mat, positions.length);
  im.castShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    dummy.position.set(p.x, 0, p.z);
    dummy.rotation.y = p.ang;
    dummy.scale.setScalar(baseScale * p.scale);
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
  }
  im.instanceMatrix.needsUpdate = true;
  attachFade(im, mat, positions.length);
  im.userData.positions = positions;
  return im;
}

function buildTrees(theme) {
  const cfg = theme.tree || {};
  const positions = scatterPositions(cfg.count || 26);
  const group = new THREE.Group();
  const big = !!cfg.big;
  const trunkMat = new THREE.MeshStandardMaterial({ color: cfg.trunk || 0x5a3a26, roughness: 0.95 });
  if (big) {
    // 古樹：噪聲粗幹 + 板根外擴 + 蓬鬆團塊樹冠 (頂點漸層色)
    const trunkH = cfg.trunkH || 168;
    let trunk = new THREE.CylinderGeometry(11, 19, trunkH, 9, 3);
    trunk.translate(0, trunkH / 2, 0);
    trunk = noisify(trunk, 5);
    group.add(makeInstanced(trunk, trunkMat, positions, 1.1));
    let flare = new THREE.CylinderGeometry(19, 36, 30, 9);
    flare.translate(0, 14, 0);
    flare = noisify(flare, 6);
    group.add(makeInstanced(flare, trunkMat, positions, 1.1));
    const canopy = canopyClump();
    bakeVerticalColor(canopy, cfg.leaf || 0x2f5524, cfg.leafTop || 0x6fae3e);
    canopy.translate(0, trunkH + 28, 0);
    const canMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    group.add(makeInstanced(canopy, canMat, positions, 1.1));
  } else {
    const crownMat = new THREE.MeshStandardMaterial({ color: cfg.leaf || 0x3d6b32, roughness: 0.95 });
    const trunkGeo = new THREE.CylinderGeometry(6, 9, 80, 6);
    trunkGeo.translate(0, 40, 0);
    group.add(makeInstanced(trunkGeo, trunkMat, positions));
    const crownGeo = new THREE.ConeGeometry(36, 90, 8);
    crownGeo.translate(0, 110, 0);
    group.add(makeInstanced(crownGeo, crownMat, positions));
  }
  group.userData.positions = positions;
  return group;
}

function buildRocks(theme) {
  const cfg = theme.rock || {};
  const positions = scatterPositions(cfg.count || 22);
  let geo = new THREE.DodecahedronGeometry(22, 1);
  geo = noisify(geo, 7);
  geo.scale(1, 0.78, 1); // 略壓扁，像半埋地的卵石
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color || 0x6b6660, roughness: 0.98, metalness: 0.03 });
  return makeInstanced(geo, mat, positions);
}

function buildCrystals(theme) {
  const cfg = theme.crystal || {};
  const positions = scatterPositions(cfg.count || 18);
  const geo = new THREE.OctahedronGeometry(28, 0);
  geo.scale(0.6, 1.5, 0.6);
  geo.translate(0, 36, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color || 0x74e0ff,
    emissive: cfg.glow || 0x49b0d0, emissiveIntensity: cfg.glowInt != null ? cfg.glowInt : 0.6,
    roughness: 0.2, metalness: 0.1, opacity: 0.85,
  });
  return makeInstanced(geo, mat, positions);
}

function buildPillars(theme) {
  const cfg = theme.pillar || {};
  const positions = scatterPositions(cfg.count || 12);
  const geo = new THREE.CylinderGeometry(14, 18, 130, 8);
  geo.translate(0, 65, 0);
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color || 0x8a7060, roughness: 0.9 });
  const im = new THREE.InstancedMesh(geo, mat, positions.length);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    dummy.position.set(p.x, -Math.random() * 30, p.z);
    dummy.rotation.set(Math.random() * 0.15 - 0.07, p.ang, Math.random() * 0.15 - 0.07);
    dummy.scale.setScalar(p.scale);
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
  }
  im.castShadow = true;
  im.instanceMatrix.needsUpdate = true;
  attachFade(im, mat, positions.length);
  im.userData.positions = positions;
  return im;
}

function buildBraziers(theme) {
  const cfg = theme.brazier || {};
  const positions = scatterPositions(cfg.count || 8, { inner: Math.max(ARENA.width, ARENA.height) / 2 * 1.06, outer: Math.max(ARENA.width, ARENA.height) / 2 * 1.3 });
  const group = new THREE.Group();
  const baseGeo = new THREE.CylinderGeometry(12, 16, 30, 8);
  baseGeo.translate(0, 15, 0);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x3b2a20, roughness: 0.9, metalness: 0.4 });
  group.add(makeInstanced(baseGeo, baseMat, positions));
  const flameGeo = new THREE.IcosahedronGeometry(10, 1);
  flameGeo.translate(0, 38, 0);
  const flameMat = new THREE.MeshStandardMaterial({
    color: cfg.flame || 0xff7a3d, emissive: cfg.flameGlow || 0xff5a1f, emissiveIntensity: 2.4,
    opacity: 0.95,
  });
  group.add(makeInstanced(flameGeo, flameMat, positions));
  group.userData.positions = positions;
  return group;
}

// 疊鼓式古石柱：數段石鼓相疊 (圓潤、像真石柱，非錐形薄板)
function drumColumn(stone, drums, rad = 15, drumH = 34) {
  const c = new THREE.Group();
  for (let i = 0; i < drums; i++) {
    let g = new THREE.CylinderGeometry(rad * 0.9, rad, drumH, 10, 1);
    g.translate(0, drumH / 2 + i * (drumH - 2), 0);
    g = noisify(g, 2.5);
    const m = new THREE.Mesh(g, stone); m.castShadow = true; m.receiveShadow = true;
    c.add(m);
  }
  c.userData.top = drums * (drumH - 2);
  return c;
}
function mossSlab(moss, rad) {
  const m = new THREE.Mesh(noisify(new THREE.IcosahedronGeometry(rad, 1), rad * 0.3), moss);
  m.scale.set(1.1, 0.45, 1.1);
  return m;
}

// 散落石造廢墟：牌坊(雙柱+斷樑) / 低矮斷牆 / 倒柱石鼓。皆貼地、少傾斜，當神殿外圍殘跡。
function buildRuins(theme) {
  const cfg = theme.ruins || {};
  const stone = new THREE.MeshStandardMaterial({ color: cfg.color || 0x65695a, roughness: 0.96, metalness: 0.03 });
  const moss = new THREE.MeshStandardMaterial({ color: cfg.moss || 0x4e6f30, roughness: 1.0 });
  const baseScale = cfg.scale || 1.0;
  const count = cfg.count || 6;
  const halfMax = Math.max(ARENA.width, ARENA.height) / 2;
  const innerR = halfMax * 1.06, outerR = halfMax * 1.42;
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = Math.PI + (i / count) * Math.PI + (Math.random() - 0.5) * 0.5; // 背景半圈
    const r = innerR + Math.random() * (outerR - innerR);
    const px = Math.cos(a) * r, pz = Math.sin(a) * r;
    const unit = new THREE.Group();
    unit.position.set(px, 0, pz);
    unit.rotation.y = Math.atan2(-px, -pz);
    const s = baseScale * (0.85 + Math.random() * 0.5);
    const span = 58 + Math.random() * 26;
    const kind = Math.random();
    if (kind < 0.5) {
      // 牌坊：雙柱 (可能一根斷) + 斷裂橫樑 + 藤蔓
      const tops = [];
      for (const sx of [-1, 1]) {
        const broken = Math.random() < 0.3;
        const col = drumColumn(stone, broken ? (1 + (Math.random() * 2 | 0)) : (3 + (Math.random() * 2 | 0)));
        col.position.set(sx * span, 0, 0); col.rotation.y = Math.random() * Math.PI;
        unit.add(col);
        const cap = mossSlab(moss, 14); cap.position.set(sx * span, col.userData.top + 1, 0); unit.add(cap);
        if (!broken) tops.push(col.userData.top);
      }
      if (tops.length === 2) {
        const y = Math.min(tops[0], tops[1]);
        const beam = new THREE.Mesh(noisify(new THREE.BoxGeometry(span * 2 + 38, 26, 36, 4, 1, 2), 3), stone);
        beam.position.set(0, y + 13, 0); beam.rotation.z = (Math.random() - 0.5) * 0.04; beam.castShadow = true;
        unit.add(beam);
        const bm = mossSlab(moss, 16); bm.scale.set((span * 2) / 28, 0.4, 1.0); bm.position.set(0, y + 26, 0); unit.add(bm);
        const vineMat = new THREE.MeshStandardMaterial({ color: cfg.vine || 0x3e5e26, roughness: 1.0 });
        for (let v = 0; v < 2 + (Math.random() * 2 | 0); v++) {
          const len = 36 + Math.random() * 64;
          const vine = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.0, len, 4), vineMat);
          vine.position.set((Math.random() - 0.5) * span * 2, y + 2 - len / 2, 15);
          vine.rotation.z = (Math.random() - 0.5) * 0.2; unit.add(vine);
        }
      }
    } else if (kind < 0.78) {
      // 崩塌石牆：數塊高低不一的風化砌石並排，頂緣參差 (非單一方塊)
      const segN = 4 + (Math.random() * 3 | 0);
      let cursorX = 0;
      const widths = [];
      for (let sgi = 0; sgi < segN; sgi++) widths.push(46 + Math.random() * 26);
      const totalW = widths.reduce((s, w) => s + w, 0);
      cursorX = -totalW / 2;
      for (let sgi = 0; sgi < segN; sgi++) {
        const ww = widths[sgi];
        const wh = 26 + Math.random() * 58;        // 高低不齊 → 殘破頂緣
        const w = new THREE.Mesh(noisify(new THREE.BoxGeometry(ww, wh, 34, 2, 2, 2), 6), stone);
        w.position.set(cursorX + ww / 2, wh / 2 - 6, (Math.random() - 0.5) * 12);
        w.rotation.set((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.14, (Math.random() - 0.5) * 0.05);
        w.castShadow = true; w.receiveShadow = true; unit.add(w);
        if (Math.random() < 0.5) { const m = mossSlab(moss, 12); m.scale.set(ww / 22, 0.4, 1.0); m.position.set(w.position.x, wh - 7, 0); unit.add(m); }
        cursorX += ww;
      }
    } else {
      // 倒柱 + 散石鼓 (rubble，全部貼地)
      const fallen = new THREE.Mesh(noisify(new THREE.CylinderGeometry(14, 15, 90 + Math.random() * 56, 10, 1), 3), stone);
      fallen.rotation.set(Math.PI / 2, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
      fallen.position.set(0, 14, 0); fallen.castShadow = true; unit.add(fallen);
      for (let d = 0; d < 2 + (Math.random() * 2 | 0); d++) {
        const dr = new THREE.Mesh(noisify(new THREE.CylinderGeometry(13, 14, 22, 10, 1), 2.5), stone);
        dr.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
        dr.position.set((Math.random() - 0.5) * 86, 12, (Math.random() - 0.5) * 64); dr.castShadow = true; unit.add(dr);
      }
    }
    unit.scale.setScalar(s);
    group.add(unit);
  }
  return group;
}

// 廢棄神殿：階梯基座 + 前後排列柱(部分斷) + 斷裂橫樑 + 發光神龕。背景正後方明確地標。
function buildTemple(theme) {
  const cfg = theme.temple || {};
  const stone = new THREE.MeshStandardMaterial({ color: cfg.color || 0x6a6e5d, roughness: 0.95, metalness: 0.03 });
  const moss = new THREE.MeshStandardMaterial({ color: cfg.moss || 0x4e6f30, roughness: 1.0 });
  const group = new THREE.Group();
  const halfMax = Math.max(ARENA.width, ARENA.height) / 2;
  // 位置：可用 cfg.x/cfg.z 指定 (例：場內右上角)；否則背景後方半圈
  let px, pz;
  if (cfg.x != null && cfg.z != null) {
    px = cfg.x; pz = cfg.z;
  } else {
    const a = 1.5 * Math.PI + (cfg.angle != null ? cfg.angle : (Math.random() - 0.5) * 0.35);
    const r = halfMax * (cfg.dist || 1.4);
    px = Math.cos(a) * r; pz = Math.sin(a) * r;
  }
  group.position.set(px, 0, pz);
  group.rotation.y = cfg.facing != null ? cfg.facing : Math.atan2(-px, -pz);
  // 階梯基座 (3 階)
  const steps = [[380, 38, 240], [336, 32, 200], [296, 28, 168]];
  let by = 0;
  for (const [w, h, d] of steps) {
    const m = new THREE.Mesh(noisify(new THREE.BoxGeometry(w, h, d, 4, 1, 3), 2.5), stone);
    m.position.set(0, by + h / 2, 0); m.castShadow = true; m.receiveShadow = true; group.add(m); by += h;
  }
  // 前緣列柱 5 根 (第 2、5 根斷)
  const intact = [];
  [-120, -60, 0, 60, 120].forEach((cx, i) => {
    const broken = (i === 1 || i === 4);
    const col = drumColumn(stone, broken ? (1 + (Math.random() * 2 | 0)) : 4, 17, 38);
    col.position.set(cx, by, -58); group.add(col);
    const cap = mossSlab(moss, 16); cap.position.set(cx, by + col.userData.top + 1, -58); group.add(cap);
    if (!broken) intact.push({ x: cx, y: by + col.userData.top });
  });
  // 後排 3 根矮柱 (深度感)
  for (const cx of [-90, 0, 90]) { const col = drumColumn(stone, 3, 17, 38); col.position.set(cx, by, 58); group.add(col); }
  // 斷裂橫樑：架在左側完整柱上、右側崩塌
  if (intact.length >= 2) {
    const xs = intact.map(p => p.x);
    const xL = Math.min(...xs) - 18, xR = (intact.length > 2 ? intact[2].x : Math.max(...xs)) + 18;
    const y = Math.min(...intact.map(p => p.y));
    const beamW = Math.max(70, xR - xL);
    const beam = new THREE.Mesh(noisify(new THREE.BoxGeometry(beamW, 26, 46, 6, 1, 2), 2.5), stone);
    beam.position.set((xL + xR) / 2, y + 14, -58); beam.castShadow = true; group.add(beam);
    const bm = mossSlab(moss, 20); bm.scale.set(beamW / 34, 0.4, 1.1); bm.position.set((xL + xR) / 2, y + 27, -58); group.add(bm);
    // 三角山牆 (pediment) + 斜屋頂殘段，立於橫樑上 → 明確「神殿正面」
    const cxBeam = (xL + xR) / 2, topY = y + 27;
    const pedW = beamW * 0.96, pedH = 66;
    const shape = new THREE.Shape();
    shape.moveTo(-pedW / 2, 0); shape.lineTo(pedW / 2, 0); shape.lineTo(10, pedH); shape.closePath(); // 頂點略偏 → 不死板
    let pedGeo = new THREE.ExtrudeGeometry(shape, { depth: 48, bevelEnabled: false });
    pedGeo.translate(0, 0, -24);
    pedGeo = noisify(pedGeo, 3);
    const ped = new THREE.Mesh(pedGeo, stone);
    ped.position.set(cxBeam, topY, -58); ped.castShadow = true; group.add(ped);
    const pm = mossSlab(moss, 20); pm.scale.set(pedW / 42, 0.4, 1.1); pm.position.set(cxBeam - pedW * 0.18, topY + pedH * 0.46, -58); group.add(pm);
    // 左坡屋簷殘板 (右坡崩塌)
    const eave = new THREE.Mesh(noisify(new THREE.BoxGeometry(pedW * 0.62, 9, 54, 4, 1, 2), 2), stone);
    eave.position.set(cxBeam - pedW * 0.22, topY + pedH * 0.5, -58);
    eave.rotation.z = 0.62; eave.castShadow = true; group.add(eave);
  }
  // 神龕發光核心 (呼應 boss 翠綠生命核心)
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(18, 1),
    new THREE.MeshStandardMaterial({ color: 0x9be86a, emissive: cfg.glow || 0x6fd23a, emissiveIntensity: 1.5, roughness: 0.4, metalness: 0.1 }));
  core.position.set(0, by + 46, 4); group.add(core);
  // 基座上散落柱鼓
  for (let d = 0; d < 4; d++) {
    const dr = new THREE.Mesh(noisify(new THREE.CylinderGeometry(15, 16, 24, 10, 1), 2.5), stone);
    dr.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.5, Math.random() * Math.PI, Math.random() * 0.6);
    dr.position.set((Math.random() - 0.5) * 230, by + 14, (Math.random() - 0.5) * 110); dr.castShadow = true; group.add(dr);
  }
  group.scale.setScalar(cfg.scale || 1.7);
  return group;
}

// 巨大盤根：半埋入地面的拱形樹根 (torus 弧段豎立)，散在外環貼近古樹
function buildRoots(theme) {
  const cfg = theme.roots || {};
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color || 0x36271a, roughness: 1.0 });
  const count = cfg.count || 12;
  const halfMax = Math.max(ARENA.width, ARENA.height) / 2;
  const innerR = halfMax * 1.0, outerR = halfMax * 1.32;
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = innerR + Math.random() * (outerR - innerR);
    const x0 = Math.cos(a) * r, z0 = Math.sin(a) * r;
    const rad = 42 + Math.random() * 70;
    const tube = 6 + Math.random() * 8;
    const arc = Math.PI * (0.7 + Math.random() * 0.6);
    const geo = new THREE.TorusGeometry(rad, tube, 6, 16, arc);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    m.position.set(x0, -rad * 0.12, z0);            // 略沉入地，像鑽出地面
    m.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5; // 豎成拱
    m.rotation.z = Math.random() * Math.PI * 2;
    m.scale.set(1, 1, 0.55 + Math.random() * 0.7);
    group.add(m);
  }
  return group;
}

// 地被灌木：低矮有機團塊，跨越場邊把地面與樹林銜接 (帶頂點漸層色)
function buildFoliage(theme) {
  const cfg = theme.foliage || {};
  const count = cfg.count || 26;
  const halfMax = Math.max(ARENA.width, ARENA.height) / 2;
  const innerR = halfMax * 0.94, outerR = halfMax * 1.26;
  let bush = new THREE.IcosahedronGeometry(20, 1);
  bush = noisify(bush, 8);
  bush.scale(1.35, 0.62, 1.35);
  bush.translate(0, 8, 0);
  bakeVerticalColor(bush, cfg.low || 0x2f4f1c, cfg.high || 0x5f8a30);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1.0 });
  const positions = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = innerR + Math.random() * (outerR - innerR);
    positions.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, ang: Math.random() * Math.PI * 2, scale: 0.6 + Math.random() * 1.0 });
  }
  return makeInstanced(bush, mat, positions);
}

// 光束貼圖：垂直亮帶 (頂端入光最亮、向下淡出) + 左右柔邊，給加法混色光柱用
let _shaftTex = null;
function shaftTexture() {
  if (_shaftTex) return _shaftTex;
  const W = 32, H = 128;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0.0, 'rgba(255,255,255,0)');
  g.addColorStop(0.12, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.34)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const gx = x.createLinearGradient(0, 0, W, 0);   // 左右淡出遮罩
  gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.5, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalCompositeOperation = 'destination-in'; x.fillStyle = gx; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; _shaftTex = t; return t;
}

// 神殿光束 (god-ray)：加法混色錐柱，自樹冠灑下；微閃爍 + 緩慢自轉 (見 updateDecorationFade)
function buildLightShafts(theme) {
  const cfg = theme.godrays || {};
  const count = cfg.count || 6;
  const color = new THREE.Color(cfg.color || 0xcdeb9f);
  const baseOp = cfg.opacity != null ? cfg.opacity : 0.16;
  const tex = shaftTexture();
  const halfW = ARENA.width / 2, halfH = ARENA.height / 2;
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const h = 620 + Math.random() * 240;
    const rT = 14 + Math.random() * 16, rB = 60 + Math.random() * 70;
    const geo = new THREE.CylinderGeometry(rT, rB, h, 14, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      map: tex, color, transparent: true, opacity: baseOp,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false,
    });
    const m = new THREE.Mesh(geo, mat);
    let x, z;
    if (i < 3) { // 主光束：斜插入可見的法陣中央區
      x = (Math.random() - 0.5) * halfW * 0.85;
      z = -halfH * 0.2 + (Math.random() - 0.5) * halfH * 0.55;
    } else {     // 背景補光
      x = (Math.random() - 0.5) * ARENA.width;
      z = -halfH * (0.4 + Math.random() * 0.7);
    }
    m.position.set(x, h / 2 - 30, z);
    m.rotation.z = -0.17 - Math.random() * 0.07;   // 朝陽光方向傾斜 (god-ray 角度)
    m.rotation.x = 0.13 + Math.random() * 0.06;
    m.renderOrder = 6;
    m.userData.baseOp = baseOp * (0.7 + Math.random() * 0.6);
    m.userData.phase = Math.random() * Math.PI * 2;
    m.userData.spin = (Math.random() - 0.5) * 0.05;
    group.add(m);
  }
  return group;
}

// 苔斑貼圖：多顆綠色柔邊圓疊加，邊緣破碎自然
let _mossTex = null;
function mossSplotchTexture() {
  if (_mossTex) return _mossTex;
  const S = 128; const c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  const greens = ['60,96,40', '78,118,52', '46,78,34', '92,130,58'];
  for (let i = 0; i < 24; i++) {
    const px = S / 2 + (Math.random() - 0.5) * 64, py = S / 2 + (Math.random() - 0.5) * 64, r = 14 + Math.random() * 34;
    const col = greens[(Math.random() * greens.length) | 0];
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(${col},0.55)`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; _mossTex = t; return t;
}

// 青苔地被：法陣外環的平鋪苔斑 (貼地) + 立體苔蕨叢，營造被叢林吞沒感
function buildGroundcover(theme) {
  const cfg = theme.groundcover || {};
  const group = new THREE.Group();
  const rInner = cfg.rInner || 360, rOuter = cfg.rOuter || 820;
  // 平鋪苔斑 (InstancedMesh，貼地，不投影/不淡出)
  const splotches = cfg.splotches || 26;
  const sgeo = new THREE.PlaneGeometry(1, 1);
  const smat = new THREE.MeshStandardMaterial({ map: mossSplotchTexture(), transparent: true, opacity: 0.72, depthWrite: false, roughness: 1.0 });
  const sim = new THREE.InstancedMesh(sgeo, smat, splotches);
  sim.renderOrder = 2;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < splotches; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = rInner + Math.random() * (rOuter - rInner);
    const sz = 70 + Math.random() * 150;
    dummy.position.set(Math.cos(a) * r, 0.6 + Math.random() * 0.3, Math.sin(a) * r);
    dummy.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2);
    dummy.scale.set(sz, sz, 1);
    dummy.updateMatrix();
    sim.setMatrixAt(i, dummy.matrix);
  }
  sim.instanceMatrix.needsUpdate = true;
  group.add(sim);
  // 立體苔蕨叢 (低矮團塊，環邊散佈，帶頂點漸層色)
  const tufts = cfg.tufts || 16;
  let tuft = new THREE.IcosahedronGeometry(12, 1);
  tuft = noisify(tuft, 5);
  tuft.scale(1.5, 0.7, 1.5);
  tuft.translate(0, 5, 0);
  bakeVerticalColor(tuft, cfg.low || 0x2c4a1a, cfg.high || 0x5f8a30);
  const tmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1.0 });
  const positions = [];
  for (let i = 0; i < tufts; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = rOuter * (0.66 + Math.random() * 0.4);
    positions.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, ang: Math.random() * Math.PI * 2, scale: 0.6 + Math.random() * 0.9 });
  }
  group.add(makeInstanced(tuft, tmat, positions));
  return group;
}

const BUILDERS = {
  tree: buildTrees,
  rock: buildRocks,
  crystal: buildCrystals,
  pillar: buildPillars,
  brazier: buildBraziers,
  ruins: buildRuins,
  temple: buildTemple,
  roots: buildRoots,
  foliage: buildFoliage,
  godrays: buildLightShafts,
  groundcover: buildGroundcover,
};

// ---- 地面圖案：每隻 Boss 不同 (打破方形單調感) ----
//   kinds: 'arcane' 法陣 / 'cracks' 裂縫 / 'hex' 六角網格 / 'rings' 同心圓 / 'flame' 火紋 / 'snowflake' 雪花
function makeFloorPattern(kind, color, scale = 1) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  x.clearRect(0, 0, S, S);
  x.strokeStyle = color || '#ffffff';
  x.fillStyle = color || '#ffffff';
  x.lineCap = 'round';
  const cx = S / 2, cy = S / 2;

  if (kind === 'arcane') {
    x.lineWidth = 6;
    // 三重同心法陣 + 內部六角星
    for (const r of [320, 240, 160]) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke(); }
    x.beginPath();
    for (let i = 0; i < 6; i++) {
      const a1 = i * Math.PI / 3, a2 = (i + 2) * Math.PI / 3;
      x.moveTo(cx + Math.cos(a1) * 200, cy + Math.sin(a1) * 200);
      x.lineTo(cx + Math.cos(a2) * 200, cy + Math.sin(a2) * 200);
    }
    x.stroke();
  } else if (kind === 'cracks') {
    x.lineWidth = 5;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r1 = 80 + Math.random() * 60;
      const r2 = 360 + Math.random() * 80;
      x.beginPath();
      let prev = { x: cx + Math.cos(a) * r1, y: cy + Math.sin(a) * r1 };
      x.moveTo(prev.x, prev.y);
      const segs = 6;
      for (let s = 1; s <= segs; s++) {
        const f = s / segs;
        const ang = a + (Math.random() - 0.5) * 0.35;
        const rr = r1 + (r2 - r1) * f;
        const nx = cx + Math.cos(ang) * rr;
        const ny = cy + Math.sin(ang) * rr;
        x.lineTo(nx, ny); prev = { x: nx, y: ny };
      }
      x.stroke();
    }
  } else if (kind === 'hex') {
    x.lineWidth = 4;
    const step = 80;
    for (let row = -8; row <= 8; row++) {
      for (let col = -8; col <= 8; col++) {
        const ox = cx + col * step + (row % 2 ? step / 2 : 0);
        const oy = cy + row * step * 0.866;
        x.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3;
          const px = ox + Math.cos(a) * 36;
          const py = oy + Math.sin(a) * 36;
          if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
        }
        x.closePath(); x.stroke();
      }
    }
  } else if (kind === 'rings') {
    x.lineWidth = 6;
    for (let i = 0; i < 5; i++) {
      const r = 100 + i * 80;
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
    }
  } else if (kind === 'flame') {
    x.lineWidth = 5;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 120);
      const ctrlX = cx + Math.cos(a + 0.3) * 280;
      const ctrlY = cy + Math.sin(a + 0.3) * 280;
      const endX = cx + Math.cos(a) * 380;
      const endY = cy + Math.sin(a) * 380;
      x.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
      x.stroke();
    }
  } else if (kind === 'snowflake') {
    x.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      x.save();
      x.translate(cx, cy); x.rotate(a);
      x.beginPath(); x.moveTo(0, 0); x.lineTo(380, 0); x.stroke();
      for (const offset of [120, 200, 280]) {
        x.beginPath();
        x.moveTo(offset, 0);
        x.lineTo(offset - 30, -30);
        x.moveTo(offset, 0);
        x.lineTo(offset - 30, 30);
        x.stroke();
      }
      x.restore();
    }
  } else if (kind === 'grove') {
    // 森林神殿符文法陣：外圈符文帶 + 多重同心環 + 放射輻條 + 中央交織六芒 + 發光核心
    const ring = (r, w) => { x.lineWidth = w; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke(); };
    // 外圈雙環 + 符文刻紋帶
    ring(482, 11); ring(452, 4);
    for (let i = 0; i < 56; i++) {
      const a = (i / 56) * Math.PI * 2;
      const c1 = Math.cos(a), s1 = Math.sin(a);
      x.lineWidth = 6;
      x.beginPath();
      x.moveTo(cx + c1 * 452, cy + s1 * 452);
      x.lineTo(cx + c1 * 482, cy + s1 * 482);
      x.stroke();
      // 偽符文：每隔一格加一道斜橫劃，營造刻字感
      if (i % 2 === 0) {
        const rm = 467;
        x.lineWidth = 4;
        x.beginPath();
        x.moveTo(cx + Math.cos(a - 0.05) * rm, cy + Math.sin(a - 0.05) * rm);
        x.lineTo(cx + Math.cos(a + 0.05) * rm, cy + Math.sin(a + 0.05) * rm);
        x.stroke();
      }
    }
    // 中環組
    ring(400, 8); ring(330, 5);
    // 放射輻條 12 道，端點帶符文節點
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const c1 = Math.cos(a), s1 = Math.sin(a);
      x.lineWidth = 5;
      x.beginPath();
      x.moveTo(cx + c1 * 165, cy + s1 * 165);
      x.lineTo(cx + c1 * 398, cy + s1 * 398);
      x.stroke();
      x.lineWidth = 4;
      x.beginPath(); x.arc(cx + c1 * 365, cy + s1 * 365, 10, 0, Math.PI * 2); x.stroke();
    }
    // 內環
    ring(248, 7); ring(158, 4);
    // 中央交織雙三角（六芒星）
    x.lineWidth = 7;
    for (const off of [0, Math.PI / 3]) {
      x.beginPath();
      for (let i = 0; i <= 3; i++) {
        const a = off + (i % 3) * (Math.PI * 2 / 3) - Math.PI / 2;
        const px = cx + Math.cos(a) * 150, py = cy + Math.sin(a) * 150;
        if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
      }
      x.closePath(); x.stroke();
    }
    // 發光核心
    ring(66, 5);
    x.beginPath(); x.arc(cx, cy, 30, 0, Math.PI * 2); x.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildFloorDecal(theme) {
  const dc = theme.floorDecal;
  if (!dc) return null;
  const tex = makeFloorPattern(dc.kind, dc.color, dc.scale);
  const size = Math.max(ARENA.width, ARENA.height) * (dc.size || 0.55);
  const opts = {
    map: tex, transparent: true, opacity: dc.opacity != null ? dc.opacity : 0.45,
    roughness: 1.0, metalness: 0.0, depthWrite: false,
  };
  // 發光符文：同一張貼圖當 emissiveMap，僅線條發亮（吃 bloom）
  if (dc.glow) {
    opts.emissiveMap = tex;
    opts.emissive = new THREE.Color(dc.glowColor || dc.color || 0xffffff);
    opts.emissiveIntensity = dc.glow;
  }
  const mat = new THREE.MeshStandardMaterial(opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.4;
  m.userData.isDecoration = true;
  m.userData.decalMat = mat;
  m.userData.glowBase = dc.glow || 0;     // 基準發光強度
  m.userData.pulse = dc.pulse || 0;       // 呼吸幅度 0..1
  return m;
}

export function applyDecorations(themeGroup, theme) {
  for (let i = themeGroup.children.length - 1; i >= 0; i--) {
    const c = themeGroup.children[i];
    if (c.userData.isDecoration) {
      themeGroup.remove(c);
      if (c.geometry) c.geometry.dispose?.();
      if (c.material) (Array.isArray(c.material) ? c.material : [c.material]).forEach((m) => m.dispose?.());
      if (c.isGroup) c.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.());
      });
    }
  }
  const decoMeshes = [];
  themeGroup.userData.shafts = null;
  const decos = (theme && theme.decorations) || [];
  for (const kind of decos) {
    const builder = BUILDERS[kind];
    if (!builder) continue;
    const obj = builder(theme);
    obj.userData.isDecoration = true;
    themeGroup.add(obj);
    decoMeshes.push(obj);
    if (kind === 'godrays') themeGroup.userData.shafts = obj;
  }
  // 地面圖案
  const decal = buildFloorDecal(theme || {});
  if (decal) themeGroup.add(decal);
  themeGroup.userData.decoMeshes = decoMeshes;
  themeGroup.userData.decal = decal || null;
  themeGroup.userData._t = 0;
}

// 每幀更新所有裝飾的 instance 透明度：阻擋玩家視線時平滑 fade
export function updateDecorationFade(themeGroup, focus, dt) {
  themeGroup.userData._t = (themeGroup.userData._t || 0) + dt;
  const t = themeGroup.userData._t;
  // 符文法陣呼吸發光
  const decal = themeGroup.userData.decal;
  if (decal && decal.userData.pulse) {
    const base = decal.userData.glowBase;
    decal.userData.decalMat.emissiveIntensity =
      base * (1 + decal.userData.pulse * 0.55 * Math.sin(t * 1.7));
  }
  // 神殿光束：微閃爍 + 緩慢自轉
  const shafts = themeGroup.userData.shafts;
  if (shafts) {
    for (const m of shafts.children) {
      const u = m.userData;
      m.material.opacity = u.baseOp * (0.62 + 0.38 * Math.sin(t * 0.7 + u.phase));
      m.rotation.y += u.spin * dt;
    }
  }
  const meshes = themeGroup.userData.decoMeshes;
  if (!meshes || !focus) return;
  const lerpK = Math.min(1, dt * 8);
  for (const node of meshes) {
    const targets = node.isGroup ? node.children : [node];
    for (const im of targets) {
      const positions = im.userData?.positions || node.userData?.positions;
      const fadeAttr = im.userData?.fadeAttr;
      if (!positions || !fadeAttr) continue;
      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        // 物件在玩家「鏡頭側」的小區域內 (xz 接近、z 略大代表更靠相機)
        const dx = p.x - focus.x, dz = p.z - focus.z;
        const dist = Math.hypot(dx, dz);
        const inFront = dz > -20;            // 物件在玩家或更靠近相機那一側
        const blocked = inFront && dist < 100;
        const target = blocked ? 0.18 : 1.0;
        const cur = fadeAttr.getX(i);
        fadeAttr.setX(i, cur + (target - cur) * lerpK);
      }
      fadeAttr.needsUpdate = true;
    }
  }
}
