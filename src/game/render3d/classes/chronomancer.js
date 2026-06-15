import * as THREE from 'three';

// 時空術士：青藍法袍 + 胸前時鐘核心 + 環繞齒輪/時針 (兜帽由 HEADGEAR='hood'；時鐘法杖為手持武器)。
export function buildChronomancer(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, frontX, bodyTex,
    defaultBodyMat, defaultHeadMat, defaultBootMat, goldMat,
    mkLimb, addAccent, faceGroup,
  } = ctx;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.45, torsoW * 0.64, torsoH + 4, 12), defaultBodyMat);

  // 胸前時鐘核心 (發光鐘面 + 金環 + 指針)
  const faceMat = reg(mat(0xeafdff, { emissive: 0x4dd0e1, ei: 1.8 }));
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(torsoW * 0.24, 20), faceMat);
  clockFace.position.set(0, torsoH * 0.06, torsoD * 0.5 + 0.9); torso.add(clockFace);
  const clockRim = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.24, 0.9, 8, 24), goldMat);
  clockRim.position.set(0, torsoH * 0.06, torsoD * 0.5 + 1.0); torso.add(clockRim);
  const handLong = new THREE.Mesh(new THREE.BoxGeometry(0.7, torsoW * 0.2, 0.4), goldMat);
  handLong.position.set(0, torsoH * 0.1, torsoD * 0.5 + 1.2); torso.add(handLong);
  const handShort = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.14, 0.7, 0.4), goldMat);
  handShort.position.set(torsoW * 0.05, torsoH * 0.06, torsoD * 0.5 + 1.2); torso.add(handShort);

  // 背後懸浮齒輪
  const gearMat = reg(mat(0x4dd0e1, { emissive: 0x00bcd4, ei: 1.6, metal: 0.4 }));
  const gear = new THREE.Mesh(new THREE.TorusGeometry(4.5, 1.4, 6, 8), gearMat);
  gear.position.set(-torsoD * 0.5 - 4, torsoH * 0.2, 0); gear.rotation.x = Math.PI / 2; addAccent(gear);

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.2 * bulk, 16, 12), defaultHeadMat);
  const eyeMat = reg(mat(0x9af2ff, { emissive: 0x00bcd4, ei: 2.9 }));
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 2.4), eyeMat);
    eye.position.set(frontX - 0.2, 0.9, sz * 2.3 * bulk); faceGroup.add(eye);
  }

  const robeMat = reg(mat(shade(base, -0.05), { rough: 0.7, metal: 0.12, map: bodyTex }));
  const robeBootMat = reg(mat(shade(base, -0.3), { rough: 0.78, metal: 0.08 }));
  const armL = mkLimb(0, -ctx.shoulderX, true, robeMat, robeBootMat, base);
  const armR = mkLimb(0, ctx.shoulderX, true, robeMat, robeBootMat, base);
  const legL = mkLimb(0, -ctx.hipX, false, robeMat, robeBootMat, base);
  const legR = mkLimb(0, ctx.hipX, false, robeMat, robeBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}
