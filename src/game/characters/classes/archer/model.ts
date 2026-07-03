// @ts-nocheck
import * as THREE from 'three';
import { buildArcherWeapon } from './weapon.ts';

export const modelConfig = { bulk: 1.92, weapon: 'bow', skinKind: 'leather', headgear: 'hood' };

export function buildModel(ctx) {
  const {
    base, bulk, reg, mat,
    torsoW, torsoD, torsoH, shoulderY,
    shoulderX, hipX, frontX,
    defaultBodyMat, defaultHeadMat, defaultArmMat, defaultBootMat,
    darkMat, helmMat, accentHelmMat, darkHelmMat,
    faceGroup, helmAddons, mkLimb, addAccent
  } = ctx;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW, torsoH, torsoD), defaultBodyMat);

  const pack = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.6, torsoH * 0.7, 5), darkMat);
  pack.position.set(-torsoD * 0.5 - 2.2, 0, 0); torso.add(pack);

  const wingMat = reg(mat(base, { transparent: true, opacity: 0.85, emissive: base, ei: 2.0 }));
  for (const sz of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 18, 11), wingMat);
    wing.position.set(-torsoD * 0.5 - 4, torsoH * 0.2, sz * (torsoW * 0.55));
    wing.rotation.y = sz * (Math.PI / 4 + 0.2); wing.rotation.x = sz * 0.2; addAccent(wing);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.5 * bulk, 16, 12), defaultHeadMat);

  const scopeJoint = new THREE.Mesh(new THREE.BoxGeometry(3 * bulk, 3 * bulk, 3 * bulk), darkHelmMat);
  scopeJoint.position.set(frontX - 1.5 * bulk, 2.5 * bulk, -2.2 * bulk); faceGroup.add(scopeJoint);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(1.6 * bulk, 1.6 * bulk, 6 * bulk, 8), helmMat);
  scope.rotation.x = Math.PI / 2; scope.position.set(frontX + 0.6 * bulk, 2.5 * bulk, -2.2 * bulk); faceGroup.add(scope);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(1.4 * bulk, 1.4 * bulk, 0.8 * bulk, 8), accentHelmMat);
  lens.rotation.x = Math.PI / 2; lens.position.set(frontX + 2.8 * bulk, 2.5 * bulk, -2.2 * bulk); faceGroup.add(lens);

  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 2.4), reg(mat(0x00ffcc, { emissive: 0x00ffcc, ei: 2.2 })));
  leftEye.position.set(frontX - 0.4, 1.2, 2.4 * bulk); faceGroup.add(leftEye);

  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * bulk, 0.6 * bulk, 16 * bulk, 8), darkHelmMat);
  ant.position.set(-1.5 * bulk, 9.5 * bulk, -3 * bulk); ant.rotation.z = -0.35; helmAddons.add(ant);

  const armL = mkLimb(0, -shoulderX, true, defaultArmMat, defaultBootMat, base);
  const armR = mkLimb(0, shoulderX, true, defaultArmMat, defaultBootMat, base);
  const legL = mkLimb(0, -hipX, false, defaultBodyMat, defaultBootMat, base);
  const legR = mkLimb(0, hipX, false, defaultBodyMat, defaultBootMat, base);

  // 天羽箭暴 — 磅礴發光雙翼：預設收合隱藏，大招連射時展開並隨角色移動（由本角色 customUpdate 依 p.barrage 驅動）。
  // 結構：每側一個 side 群組，內含數片以「根部」為樞紐的羽片(pivot)；展開時各 pivot 繞前後軸外擺成扇形。
  const featherMat = reg(mat(0xffffff, { emissive: base, ei: 3.4, transparent: true, opacity: 0.95 }));
  featherMat.blending = THREE.AdditiveBlending;
  featherMat.side = THREE.DoubleSide;
  featherMat.depthWrite = false;
  const barrageWings = new THREE.Group();
  const NF = 8;
  for (const sz of [-1, 1]) {
    const side = new THREE.Group();
    side.position.set(-torsoD * 0.5 - 2, shoulderY + 5, sz * (torsoW * 0.28));
    side.userData.side = sz;
    side.userData.feathers = [];
    for (let i = 0; i < NF; i++) {
      const len = 56 + i * 20;             // 由內而外漸長 56→196（磅礴）
      const w = 7.5 - i * 0.55;
      const pivot = new THREE.Group();
      const feather = new THREE.Mesh(new THREE.ConeGeometry(w, len, 4), featherMat);
      feather.position.y = len * 0.5;      // 以根部為樞紐往外伸
      feather.rotation.y = Math.PI / 4;    // 菱形朝向
      pivot.add(feather);
      pivot.rotation.z = 0.1;              // 略向後傾
      pivot.userData.fan = 0.16 + i * 0.15; // 展開時的外擺比例（0.16→1.21）
      side.add(pivot);
      side.userData.feathers.push(pivot);
    }
    barrageWings.add(side);
  }
  barrageWings.visible = false;
  barrageWings.userData.mat = featherMat;

  return {
    torso,
    head,
    armL,
    armR,
    legL,
    legR,
    attachments: [barrageWings],
    customUpdate(dt, _group, ud, info) {
      const on = info.p && info.p.barrage;
      ud.archerWingT = on ? Math.min(1, (ud.archerWingT || 0) + dt * 3.0)
                          : Math.max(0, (ud.archerWingT || 0) - dt * 4.5);
      barrageWings.visible = ud.archerWingT > 0.001;
      if (!barrageWings.visible) return;
      const e = ud.archerWingT * ud.archerWingT * (3 - 2 * ud.archerWingT);
      const flap = Math.sin(ud.breathe * 5) * 0.14;
      for (const side of barrageWings.children) {
        const sz = side.userData.side;
        const feathers = side.userData.feathers;
        for (let i = 0; i < feathers.length; i++) {
          const fan = feathers[i].userData.fan;
          feathers[i].rotation.x = sz * (0.05 + fan * 1.05 * e + flap * (0.4 + i * 0.12) * e);
        }
      }
      barrageWings.scale.setScalar(0.7 + 0.6 * e);
      if (barrageWings.userData.mat) barrageWings.userData.mat.opacity = 0.25 + 0.72 * e;
    },
  };
}

export const buildWeapon = buildArcherWeapon;

export { attachSkinGear } from './gear.ts';
