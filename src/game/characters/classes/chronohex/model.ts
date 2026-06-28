// @ts-nocheck
import * as THREE from 'three';
import { buildChronohexWeapon } from './weapon.ts';

export const modelConfig = { bulk: 1.84, weapon: 'chronohexstaff', robe: true, skinKind: 'cloth', headgear: 'hood' };

// 時厄術士：靛紫法袍融合青藍時光。胸前時鐘核心(青) + 詛咒符文腰環(紫) + 肩部尖刺 +
// 背後懸浮齒輪 + 環繞破碎時咒晶。兜帽由 HEADGEAR='hood'；時咒法杖為手持武器。
export function buildModel(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, shoulderY, frontX, bodyTex,
    defaultBodyMat, defaultHeadMat, goldMat,
    mkLimb, addAccent, faceGroup,
  } = ctx;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.45, torsoW * 0.65, torsoH + 4, 12), defaultBodyMat);

  // 胸前時鐘核心 (青藍發光鐘面 + 金環 + 指針)
  const faceMat = reg(mat(0xeafdff, { emissive: 0x4dd0e1, ei: 1.8 }));
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(torsoW * 0.22, 20), faceMat);
  clockFace.position.set(0, torsoH * 0.1, torsoD * 0.5 + 0.9); torso.add(clockFace);
  const clockRim = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.22, 0.85, 8, 24), goldMat);
  clockRim.position.set(0, torsoH * 0.1, torsoD * 0.5 + 1.0); torso.add(clockRim);
  const handLong = new THREE.Mesh(new THREE.BoxGeometry(0.65, torsoW * 0.18, 0.4), goldMat);
  handLong.position.set(0, torsoH * 0.13, torsoD * 0.5 + 1.2); torso.add(handLong);

  // 詛咒符文腰環 (紫發光)
  const runeMat = reg(mat(0xc77dff, { emissive: 0x8e44ad, ei: 2.2 }));
  const runeRing = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.55, 1.2, 8, 24), runeMat);
  runeRing.position.set(0, -torsoH * 0.18, 0); runeRing.rotation.x = Math.PI / 2; torso.add(runeRing);

  // 肩部尖刺
  const spikeMat = reg(mat(shade(base, -0.2), { metal: 0.5, rough: 0.5 }));
  for (const sz of [-1, 1]) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(2.2, 8.5, 6), spikeMat);
    spike.position.set(0, shoulderY + 2, sz * (torsoW * 0.5 + 2)); spike.rotation.z = sz * 0.4; addAccent(spike);
  }

  // 背後懸浮齒輪 (青)
  const gearMat = reg(mat(0x4dd0e1, { emissive: 0x00bcd4, ei: 1.6, metal: 0.4 }));
  const gear = new THREE.Mesh(new THREE.TorusGeometry(4.3, 1.3, 6, 8), gearMat);
  gear.position.set(-torsoD * 0.5 - 4, torsoH * 0.2, 0); gear.rotation.x = Math.PI / 2; addAccent(gear);

  // 環繞身側的破碎時咒晶 (紫青交錯)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(1.9), i % 2 ? gearMat : runeMat);
    shard.position.set(Math.cos(a) * (torsoW * 0.7), torsoH * 0.1 + i * 3 - 3, Math.sin(a) * (torsoW * 0.7)); addAccent(shard);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.2 * bulk, 16, 12), defaultHeadMat);
  // 兜帽陰影下的發光眼 (青紫漸層感：以亮青眼 + 紫高光近似)
  const eyeMat = reg(mat(0xbfe9ff, { emissive: 0x6c4ad6, ei: 2.9 }));
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 2.4), eyeMat);
    eye.position.set(frontX - 0.2, 0.85, sz * 2.3 * bulk); faceGroup.add(eye);
  }

  const robeMat = reg(mat(shade(base, -0.08), { rough: 0.74, metal: 0.1, map: bodyTex }));
  const robeBootMat = reg(mat(shade(base, -0.32), { rough: 0.8, metal: 0.06 }));
  const armL = mkLimb(0, -ctx.shoulderX, true, robeMat, robeBootMat, base);
  const armR = mkLimb(0, ctx.shoulderX, true, robeMat, robeBootMat, base);
  const legL = mkLimb(0, -ctx.hipX, false, robeMat, robeBootMat, base);
  const legR = mkLimb(0, ctx.hipX, false, robeMat, robeBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}

export const buildWeapon = buildChronohexWeapon;
