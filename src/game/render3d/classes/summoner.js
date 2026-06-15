import * as THREE from 'three';

// 召喚師：青綠法袍 + 胸前召喚陣 + 背後懸浮靈核 (兜帽由 HEADGEAR='hood'；浮游靈球為手持武器 summonorb)。
export function buildSummoner(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, frontX, bodyTex,
    defaultBodyMat, defaultHeadMat, defaultBootMat,
    mkLimb, addAccent, faceGroup,
  } = ctx;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.45, torsoW * 0.65, torsoH + 4, 12), defaultBodyMat);

  // 胸前召喚陣 (雙環發光)
  const glowMat = reg(mat(0x6ffadf, { emissive: 0x16a085, ei: 2.2 }));
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.32, 0.9, 8, 24), glowMat);
  ringA.position.set(0, torsoH * 0.08, torsoD * 0.5 + 0.8); torso.add(ringA);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.2, 0.7, 8, 20), glowMat);
  ringB.position.set(0, torsoH * 0.08, torsoD * 0.5 + 0.9); torso.add(ringB);

  // 背後懸浮靈核 + 兩道靈翼
  const coreCol = new THREE.Color(0x2ee6c0);
  const soulCore = new THREE.Mesh(new THREE.IcosahedronGeometry(3.4, 0), reg(mat(coreCol, { emissive: coreCol, ei: 2.4 })));
  soulCore.position.set(-torsoD * 0.5 - 4, torsoH * 0.2, 0); addAccent(soulCore);
  const wingMat = reg(mat(coreCol, { transparent: true, opacity: 0.8, emissive: coreCol, ei: 1.8 }));
  for (const sz of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 15, 8), wingMat);
    wing.position.set(-torsoD * 0.5 - 4, torsoH * 0.15, sz * (torsoW * 0.4));
    wing.rotation.y = sz * (Math.PI / 4); addAccent(wing);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.2 * bulk, 16, 12), defaultHeadMat);
  const eyeMat = reg(mat(0x7ff6df, { emissive: 0x1abc9c, ei: 2.9 }));
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 2.4), eyeMat);
    eye.position.set(frontX - 0.2, 0.9, sz * 2.3 * bulk); faceGroup.add(eye);
  }

  const robeMat = reg(mat(shade(base, -0.06), { rough: 0.72, metal: 0.1, map: bodyTex }));
  const robeBootMat = reg(mat(shade(base, -0.3), { rough: 0.8, metal: 0.06 }));
  const armL = mkLimb(0, -ctx.shoulderX, true, robeMat, robeBootMat, base);
  const armR = mkLimb(0, ctx.shoulderX, true, robeMat, robeBootMat, base);
  const legL = mkLimb(0, -ctx.hipX, false, robeMat, robeBootMat, base);
  const legR = mkLimb(0, ctx.hipX, false, robeMat, robeBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}
