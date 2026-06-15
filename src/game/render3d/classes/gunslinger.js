import * as THREE from 'three';

// 槍手：琥珀皮革風衣 + 子彈帶 + 牛仔帽 (帽飾由 HEADGEAR='hat' 提供，這裡加領巾與槍套)。
export function buildGunslinger(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, hipY, frontX,
    defaultBodyMat, defaultHeadMat, defaultArmMat, defaultBootMat,
    darkMat, goldMat, faceGroup, mkLimb, addAccent,
  } = ctx;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW, torsoH, torsoD), defaultBodyMat);

  // 斜背子彈帶 (bandolier) + 金色彈頭
  const beltMat = reg(mat(0x5a3a1e, { rough: 0.7, metal: 0.1 }));
  const band = new THREE.Mesh(new THREE.BoxGeometry(2.4, torsoH * 1.3, 4.5), beltMat);
  band.position.set(torsoD * 0.5 + 0.4, 0, 0); band.rotation.x = 0.7; torso.add(band);
  for (let i = -2; i <= 2; i++) {
    const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.4, 6), goldMat);
    bullet.position.set(torsoD * 0.5 + 1.4, i * 4.5, i * 2.2); bullet.rotation.z = Math.PI / 2; torso.add(bullet);
  }
  // 風衣下襬 (背後垂布)
  const coatMat = reg(mat(shade(base, -0.25), { rough: 0.65, metal: 0.1 }));
  const coat = new THREE.Mesh(new THREE.BoxGeometry(1.8, torsoH + 12, torsoW * 0.92), coatMat);
  coat.position.set(-torsoD * 0.55, -8, 0); addAccent(coat);

  // 頭：露臉 + 領巾 + 發光琥珀眼
  const head = new THREE.Mesh(new THREE.SphereGeometry(7.2 * bulk, 16, 12), reg(mat(0xe9b98a, { rough: 0.6, metal: 0.05 })));
  const kerchief = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 12 * bulk), reg(mat(shade(base, 0.1), { rough: 0.6 })));
  kerchief.position.set(frontX * 0.7, -4.2, 0); faceGroup.add(kerchief);
  const eyeMat = reg(mat(0xffd76a, { emissive: 0xffd76a, ei: 2.6 }));
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 2.2), eyeMat);
    eye.position.set(frontX - 0.4, 1.4, sz * 2.4 * bulk); faceGroup.add(eye);
  }

  // 腰側槍套
  for (const sz of [-1, 1]) {
    const holster = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 3), darkMat);
    holster.position.set(0, hipY - 2, sz * (torsoW * 0.5 + 2)); addAccent(holster);
  }

  const armL = mkLimb(0, -ctx.shoulderX, true, defaultArmMat, defaultBootMat, base);
  const armR = mkLimb(0, ctx.shoulderX, true, defaultArmMat, defaultBootMat, base);
  const legL = mkLimb(0, -ctx.hipX, false, defaultBodyMat, defaultBootMat, base);
  const legR = mkLimb(0, ctx.hipX, false, defaultBodyMat, defaultBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}
