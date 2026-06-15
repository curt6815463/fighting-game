import * as THREE from 'three';

// 死靈法師：暗黑破爛法袍 + 發光幽綠胸腔肋骨 + 骷髏肩飾 (兜帽由 HEADGEAR='hood'；鐮刀為手持武器)。
export function buildNecromancer(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, shoulderY, frontX, bodyTex,
    defaultBodyMat, defaultHeadMat, defaultBootMat,
    mkLimb, addAccent, faceGroup,
  } = ctx;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.45, torsoW * 0.68, torsoH + 4, 12), defaultBodyMat);

  // 胸前發光幽綠肋骨 (死氣核心)
  const boneMat = reg(mat(0xbfe6b0, { emissive: 0x27ae60, ei: 1.6, rough: 0.5 }));
  const spine = new THREE.Mesh(new THREE.BoxGeometry(1.4, torsoH * 0.6, 1.2), boneMat);
  spine.position.set(0, 0, torsoD * 0.5 + 0.8); torso.add(spine);
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(2.6 + i * 1.4, 0.5, 6, 14, Math.PI), boneMat);
    rib.position.set(0, torsoH * 0.16 - i * 4, torsoD * 0.5 + 0.7); rib.rotation.set(Math.PI / 2, 0, 0); torso.add(rib);
  }
  const deathCore = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), reg(mat(0x2ecc71, { emissive: 0x2ecc71, ei: 2.6 })));
  deathCore.position.set(0, torsoH * 0.18, torsoD * 0.5 + 1.2); torso.add(deathCore);

  // 骷髏肩飾
  const skullMat = reg(mat(0xe8e2d0, { rough: 0.6, metal: 0.05 }));
  for (const sz of [-1, 1]) {
    const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 0), skullMat);
    skull.position.set(0, shoulderY + 1, sz * (torsoW * 0.5 + 2)); skull.scale.set(1, 1.1, 0.9); addAccent(skull);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(3, 1.4, 3), skullMat);
    jaw.position.set(0, shoulderY - 2, sz * (torsoW * 0.5 + 2)); addAccent(jaw);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.2 * bulk, 16, 12), reg(mat(shade(base, 0.1), { rough: 0.55, metal: 0.2 })));
  // 兜帽下發光幽綠眼
  const eyeMat = reg(mat(0x6dffa0, { emissive: 0x2ecc71, ei: 3.0 }));
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 2.2), eyeMat);
    eye.position.set(frontX - 0.1, 0.8, sz * 2.2 * bulk); faceGroup.add(eye);
  }

  const robeMat = reg(mat(shade(base, 0.04), { rough: 0.8, metal: 0.06, map: bodyTex }));
  const robeBootMat = reg(mat(0x14181a, { rough: 0.85, metal: 0.05 }));
  const armL = mkLimb(0, -ctx.shoulderX, true, robeMat, robeBootMat, base);
  const armR = mkLimb(0, ctx.shoulderX, true, robeMat, robeBootMat, base);
  const legL = mkLimb(0, -ctx.hipX, false, robeMat, robeBootMat, base);
  const legR = mkLimb(0, ctx.hipX, false, robeMat, robeBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}
