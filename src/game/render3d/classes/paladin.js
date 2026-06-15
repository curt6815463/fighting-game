import * as THREE from 'three';

// 聖騎士：黃金聖光重甲，胸前十字反應爐 + 背後戰袍 + 十字盔。
export function buildPaladin(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, frontX,
    defaultBodyMat, defaultHeadMat, defaultArmMat, defaultBootMat,
    goldMat, faceGroup, helmAddons, mkLimb, addAccent,
  } = ctx;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 1.12, torsoH, torsoD * 1.05), defaultBodyMat);

  // 胸前聖光核心 + 金色十字
  const coreCol = new THREE.Color(0xfff2b0);
  const core = new THREE.Mesh(new THREE.SphereGeometry(torsoW * 0.16, 12, 10), reg(mat(coreCol, { metal: 0.6, emissive: coreCol, ei: 2.4 })));
  core.position.set(0, torsoH * 0.08, torsoD * 0.52 + 1.0); torso.add(core);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(2.2, torsoH * 0.66, 1.4), goldMat); crossV.position.set(0, 0, torsoD * 0.52 + 0.6); torso.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.5, 2.2, 1.4), goldMat); crossH.position.set(0, torsoH * 0.12, torsoD * 0.52 + 0.6); torso.add(crossH);

  // 背後飄逸戰袍 (扁平垂布，避免罩住全身)
  const tabardMat = reg(mat(shade(base, -0.18), { rough: 0.7, metal: 0.1 }));
  const cape = new THREE.Mesh(new THREE.BoxGeometry(1.6, torsoH + 16, torsoW * 0.72), tabardMat);
  cape.position.set(-torsoD * 0.58, -7, 0); cape.rotation.z = 0.06; addAccent(cape);
  const capeTrim = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3, torsoW * 0.72), goldMat);
  capeTrim.position.set(-torsoD * 0.58, -7 - (torsoH + 16) / 2 + 1.5, 0); addAccent(capeTrim);

  // 頭：十字盔
  const head = new THREE.Mesh(new THREE.BoxGeometry(13 * bulk, 13.5 * bulk, 12 * bulk), defaultHeadMat);
  const helmFront = new THREE.Mesh(new THREE.BoxGeometry(2.6, 11 * bulk, 11 * bulk), reg(mat(shade(base, 0.1), { metal: 0.85, rough: 0.18 })));
  helmFront.position.set(frontX * 0.7, -0.5, 0); faceGroup.add(helmFront);
  // T 形面甲狹縫 (發光)
  const eyeMat = reg(mat(0xffe9a8, { emissive: 0xffe9a8, ei: 2.8 }));
  const slitH = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 8 * bulk), eyeMat); slitH.position.set(frontX * 0.86, 2.4, 0); faceGroup.add(slitH);
  const slitV = new THREE.Mesh(new THREE.BoxGeometry(1.4, 7 * bulk, 1.7), eyeMat); slitV.position.set(frontX * 0.86, -1.6, 0); faceGroup.add(slitV);

  // 頭頂十字冠飾
  const crownV = new THREE.Mesh(new THREE.BoxGeometry(1.8, 8.5 * bulk, 1.8), goldMat); crownV.position.set(0, 8.5 * bulk, 0); helmAddons.add(crownV);
  const crownH = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 6.5 * bulk), goldMat); crownH.position.set(0, 10.5 * bulk, 0); helmAddons.add(crownH);
  const crownGem = new THREE.Mesh(new THREE.OctahedronGeometry(2.0, 0), eyeMat); crownGem.position.set(0, 13.4 * bulk, 0); helmAddons.add(crownGem);

  const thickW = 5.6 * bulk;
  const armL = mkLimb(0, -ctx.shoulderX * 1.1, true, defaultArmMat, defaultBootMat, base, thickW);
  const armR = mkLimb(0, ctx.shoulderX * 1.1, true, defaultArmMat, defaultBootMat, base, thickW);
  const legL = mkLimb(0, -ctx.hipX * 1.1, false, defaultBodyMat, defaultBootMat, base, thickW + 0.8);
  const legR = mkLimb(0, ctx.hipX * 1.1, false, defaultBodyMat, defaultBootMat, base, thickW + 0.8);

  return { torso, head, armL, armR, legL, legR };
}
