import * as THREE from 'three';

// 武士：緋紅大鎧 (do-maru) + 肩甲 + 兜盔月牙前立 + 面頬 (menpo)。
export function buildSamurai(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, shoulderY, frontX,
    defaultBodyMat, defaultHeadMat, defaultArmMat, defaultBootMat,
    darkMat, goldMat, helmMat, faceGroup, helmAddons, mkLimb, addAccent,
  } = ctx;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW, torsoH, torsoD), defaultBodyMat);

  // 層疊草摺 (胴甲下襬) — 三段橫板
  const lamMat = reg(mat(shade(base, -0.12), { rough: 0.55, metal: 0.35 }));
  for (let i = 0; i < 3; i++) {
    const lam = new THREE.Mesh(new THREE.BoxGeometry(torsoW * (1.02 - i * 0.04), 3.2, torsoD * 1.06), lamMat);
    lam.position.set(0, -torsoH * 0.18 - i * 4, 0); torso.add(lam);
  }
  // 胸口家紋 (發光緋紅)
  const crest = new THREE.Mesh(new THREE.CircleGeometry(torsoW * 0.18, 18), reg(mat(0xff5b46, { emissive: 0xff3b2f, ei: 1.8 })));
  crest.position.set(0, torsoH * 0.12, torsoD * 0.5 + 0.6); torso.add(crest);
  // 腰帶
  const obi = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 1.04, 4.5, torsoD * 1.08), darkMat);
  obi.position.set(0, -torsoH * 0.06, 0); torso.add(obi);

  // 頭：兜盔
  const head = new THREE.Mesh(new THREE.BoxGeometry(12.5 * bulk, 13 * bulk, 12 * bulk), defaultHeadMat);
  // 面頬 (menpo) + 發光赤目
  const menpo = new THREE.Mesh(new THREE.BoxGeometry(3.2, 6 * bulk, 10.5 * bulk), reg(mat(0x2b2b2b, { metal: 0.5, rough: 0.5 })));
  menpo.position.set(frontX * 0.78, -3.2, 0); faceGroup.add(menpo);
  const eyeMat = reg(mat(0xff4530, { emissive: 0xff4530, ei: 2.8 }));
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 2.6), eyeMat);
    eye.position.set(frontX * 0.82, 2.0, sz * 3.2 * bulk); faceGroup.add(eye);
  }
  // 鉢 (盔頂) + 月牙前立 (maedate)
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(7.8 * bulk, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), helmMat);
  bowl.position.set(-0.5, 2.5 * bulk, 0); helmAddons.add(bowl);
  const crescent = new THREE.Mesh(new THREE.TorusGeometry(4.5 * bulk, 1.0, 6, 18, Math.PI), goldMat);
  crescent.position.set(2 * bulk, 8.5 * bulk, 0); crescent.rotation.set(0, Math.PI / 2, Math.PI); helmAddons.add(crescent);
  // 吹返 (盔側翼)
  for (const sz of [-1, 1]) {
    const fubi = new THREE.Mesh(new THREE.BoxGeometry(5 * bulk, 5 * bulk, 1.4), reg(mat(shade(base, 0.05), { metal: 0.6 })));
    fubi.position.set(-2 * bulk, 1.5 * bulk, sz * (6.5 * bulk)); fubi.rotation.x = sz * 0.3; helmAddons.add(fubi);
  }

  const armL = mkLimb(0, -ctx.shoulderX, true, defaultArmMat, defaultBootMat, base);
  const armR = mkLimb(0, ctx.shoulderX, true, defaultArmMat, defaultBootMat, base);
  const legL = mkLimb(0, -ctx.hipX, false, defaultBodyMat, defaultBootMat, base);
  const legR = mkLimb(0, ctx.hipX, false, defaultBodyMat, defaultBootMat, base);

  // 大袖 (寬肩甲)
  const sodeMat = reg(mat(shade(base, 0.08), { metal: 0.55, rough: 0.35 }));
  for (const sz of [-1, 1]) {
    const sode = new THREE.Mesh(new THREE.BoxGeometry(2.2, 9 * bulk, 9 * bulk), sodeMat);
    sode.position.set(0, shoulderY - 2, sz * (torsoW * 0.5 + 3)); sode.rotation.x = sz * 0.12; addAccent(sode);
  }

  return { torso, head, armL, armR, legL, legR };
}
