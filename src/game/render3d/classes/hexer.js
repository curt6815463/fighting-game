import * as THREE from 'three';

// 咒術師：深紫法袍 + 發光符文腰環 + 肩部尖刺 + 環繞的破碎詛咒晶 (兜帽由 HEADGEAR='hood')。
export function buildHexer(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, shoulderY, frontX, bodyTex,
    defaultBodyMat, defaultHeadMat, defaultBootMat,
    mkLimb, addAccent, faceGroup,
  } = ctx;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.44, torsoW * 0.66, torsoH + 4, 12), defaultBodyMat);

  // 符文腰環 (發光紫) + 胸前詛咒核心
  const runeMat = reg(mat(0xc77dff, { emissive: 0x8e44ad, ei: 2.2 }));
  const runeRing = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.55, 1.3, 8, 24), runeMat);
  runeRing.position.set(0, -torsoH * 0.16, 0); runeRing.rotation.x = Math.PI / 2; torso.add(runeRing);
  const curseCore = new THREE.Mesh(new THREE.OctahedronGeometry(torsoW * 0.16, 0), runeMat);
  curseCore.position.set(0, torsoH * 0.12, torsoD * 0.5 + 1.0); torso.add(curseCore);

  // 肩部尖刺
  const spikeMat = reg(mat(shade(base, -0.2), { metal: 0.5, rough: 0.5 }));
  for (const sz of [-1, 1]) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(2.4, 9, 6), spikeMat);
    spike.position.set(0, shoulderY + 2, sz * (torsoW * 0.5 + 2)); spike.rotation.z = sz * 0.4; addAccent(spike);
  }

  // 環繞身側的破碎詛咒晶 (靜態裝飾)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(2.0), runeMat);
    shard.position.set(Math.cos(a) * (torsoW * 0.7), torsoH * 0.1 + i * 3 - 3, Math.sin(a) * (torsoW * 0.7)); addAccent(shard);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.2 * bulk, 16, 12), defaultHeadMat);
  // 兜帽陰影下的發光紫眼
  const eyeMat = reg(mat(0xd8a3ff, { emissive: 0x9b59b6, ei: 2.9 }));
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 2.4), eyeMat);
    eye.position.set(frontX - 0.2, 0.8, sz * 2.3 * bulk); faceGroup.add(eye);
  }

  const robeMat = reg(mat(shade(base, -0.1), { rough: 0.75, metal: 0.08, map: bodyTex }));
  const robeBootMat = reg(mat(shade(base, -0.32), { rough: 0.82, metal: 0.05 }));
  const armL = mkLimb(0, -ctx.shoulderX, true, robeMat, robeBootMat, base);
  const armR = mkLimb(0, ctx.shoulderX, true, robeMat, robeBootMat, base);
  const legL = mkLimb(0, -ctx.hipX, false, robeMat, robeBootMat, base);
  const legR = mkLimb(0, ctx.hipX, false, robeMat, robeBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}
