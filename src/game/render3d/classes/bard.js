import * as THREE from 'three';

// 吟遊詩人：玫瑰品紅輕裝 + 斜披風 + 羽飾帽 (帽由 HEADGEAR='hat')，胸前音符徽記。
export function buildBard(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, shoulderY, frontX,
    defaultBodyMat, defaultHeadMat, defaultArmMat, defaultBootMat,
    goldMat, faceGroup, helmAddons, mkLimb, addAccent,
  } = ctx;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.46, torsoW * 0.58, torsoH, 12), defaultBodyMat);

  // 胸前音符徽記 (發光) + 金腰帶
  const noteMat = reg(mat(0xffe3ef, { emissive: 0xff6fa5, ei: 1.8 }));
  const noteHead = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), noteMat); noteHead.position.set(0, -1, torsoD * 0.5 + 1.0); torso.add(noteHead);
  const noteStem = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7, 0.8), noteMat); noteStem.position.set(2.0, 2.4, torsoD * 0.5 + 1.0); torso.add(noteStem);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.5, 1.4, 8, 16), goldMat); belt.position.set(0, -torsoH * 0.24, 0); belt.rotation.x = Math.PI / 2; torso.add(belt);

  // 單肩斜披風 (品紅，扁平垂布)
  const capeMat = reg(mat(shade(base, 0.05), { rough: 0.6, metal: 0.1 }));
  const cape = new THREE.Mesh(new THREE.BoxGeometry(1.6, torsoH + 12, torsoW * 0.66), capeMat);
  cape.position.set(-torsoD * 0.5, -6, torsoW * 0.18); cape.rotation.z = 0.05; addAccent(cape);

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.3 * bulk, 16, 12), defaultHeadMat);
  // 發光雙眼
  const eyeMat = reg(mat(0xff9ec4, { emissive: 0xff6fa5, ei: 2.6 }));
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 2.2), eyeMat);
    eye.position.set(frontX - 0.4, 1.2, sz * 2.4 * bulk); faceGroup.add(eye);
  }
  // 帽上長羽飾
  const featherMat = reg(mat(shade(base, 0.25), { rough: 0.5, emissive: new THREE.Color(base), ei: 0.6 }));
  const feather = new THREE.Mesh(new THREE.ConeGeometry(1.4, 16 * bulk, 6), featherMat);
  feather.position.set(-2 * bulk, 12 * bulk, 5 * bulk); feather.rotation.set(0.5, 0, -0.5); helmAddons.add(feather);

  const clothArmMat = reg(mat(shade(base, -0.05), { rough: 0.65, metal: 0.1 }));
  const armL = mkLimb(0, -ctx.shoulderX, true, clothArmMat, defaultBootMat, base);
  const armR = mkLimb(0, ctx.shoulderX, true, clothArmMat, defaultBootMat, base);
  const legL = mkLimb(0, -ctx.hipX, false, clothArmMat, defaultBootMat, base);
  const legR = mkLimb(0, ctx.hipX, false, clothArmMat, defaultBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}
