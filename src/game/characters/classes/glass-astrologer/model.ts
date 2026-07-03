// @ts-nocheck
import * as THREE from 'three';
import { buildGlassAstrologerWeapon } from './weapon.ts';

export const modelConfig = { bulk: 1.72, weapon: 'astrolabe', robe: true, skinKind: 'cloth', headgear: 'circlet' };

export function buildModel(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, shoulderY, frontX, bodyTex, materialTex,
    defaultBodyMat, defaultHeadMat,
    mkLimb, addAccent, faceGroup, face,
  } = ctx;

  const robeTex = materialTex ? materialTex('cloth', 'robe') : bodyTex;
  const robeMat = reg(mat(shade(base, -0.22), { rough: 0.75, metal: 0.08, map: robeTex }));

  const armorTex = materialTex ? materialTex('cloth', 'armor') : bodyTex;
  const armorMat = reg(mat(0xa8a8a8, { rough: 0.55, metal: 0.4, map: armorTex }));

  const goldTex = materialTex ? materialTex('metal', 'gold') : null;
  const goldMat = reg(mat(0xcacaca, { rough: 0.25, metal: 0.8, map: goldTex }));

  const glassTex = materialTex ? materialTex('glass', 'glass') : null;
  const glassMat = reg(mat(0xbfbfbf, { rough: 0.18, metal: 0.15, map: glassTex, emissive: 0x3ac4dd, ei: 0.72 }));

  const prismMat = reg(mat(0xccccd0, { emissive: 0x5bbddb, ei: 0.65, rough: 0.18, metal: 0.15 }));
  const darkGlassMat = reg(mat(0x1a2633, { emissive: 0x113b4c, ei: 0.35, rough: 0.5, metal: 0.2 }));

  const faceMat = reg(mat(0xffebd8, { emissive: 0x221410, ei: 0.1, rough: 0.6, metal: 0.05 }));
  const maskMat = reg(mat(0x18181d, { rough: 0.5, metal: 0.3 }));
  const zipperMat = reg(mat(0xc0c0c0, { rough: 0.2, metal: 0.8 }));
  const patchMat = reg(mat(0xf2f2f5, { rough: 0.7, metal: 0.05 }));
  const strapMat = reg(mat(0x1a1a1c, { rough: 0.8, metal: 0.05 }));

  // Create Torso as a THREE.Group to assemble multiple segmented parts
  const torso = new THREE.Group();

  // --- SEGMENTED BODY CORE ---
  // 1. Upper Torso (Chest Armor Plate) - Tapered square prism rotated to look diamond-like
  const chestPlateGeom = new THREE.CylinderGeometry(torsoW * 0.42, torsoW * 0.32, torsoH * 0.45, 4, 1);
  const chestPlate = new THREE.Mesh(chestPlateGeom, armorMat);
  chestPlate.position.set(0, torsoH * 0.18, 0);
  chestPlate.rotation.y = Math.PI / 4;
  chestPlate.castShadow = true;
  torso.add(chestPlate);

  // 2. Middle Torso (Slender Waist)
  const waistGeom = new THREE.CylinderGeometry(torsoW * 0.26, torsoW * 0.28, torsoH * 0.25, 8);
  const waist = new THREE.Mesh(waistGeom, darkGlassMat);
  waist.position.set(0, -torsoH * 0.1, 0);
  waist.castShadow = true;
  torso.add(waist);

  // 3. Lower Torso (Pelvis/Hip Base) - Tapered square prism rotated
  const pelvisGeom = new THREE.CylinderGeometry(torsoW * 0.28, torsoW * 0.46, torsoH * 0.35, 4, 1);
  const pelvis = new THREE.Mesh(pelvisGeom, armorMat);
  pelvis.position.set(0, -torsoH * 0.35, 0);
  pelvis.rotation.y = Math.PI / 4;
  pelvis.castShadow = true;
  torso.add(pelvis);

  // --- ROBES, CLOTHING & ACCESSORIES LAYER ---
  // 1. Layered Scarf / Astral Collar around the neck area (bulky and cozy)
  const collarWrap1 = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.38, 1.2 * bulk, 8, 24), robeMat);
  collarWrap1.position.set(0, torsoH * 0.45, 0);
  collarWrap1.rotation.x = Math.PI / 2 + 0.1;
  collarWrap1.castShadow = true;
  torso.add(collarWrap1);

  const collarWrap2 = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.44, 1.0 * bulk, 8, 24), robeMat);
  collarWrap2.position.set(0.2 * bulk, torsoH * 0.35, 0);
  collarWrap2.rotation.x = Math.PI / 2 - 0.05;
  collarWrap2.castShadow = true;
  torso.add(collarWrap2);

  // 2. Gold Belt Ring around the slender waist
  const waistRing = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.32, 0.75 * bulk, 6, 28), goldMat);
  waistRing.position.set(0, -torsoH * 0.12, 0);
  waistRing.rotation.x = Math.PI / 2;
  waistRing.castShadow = true;
  torso.add(waistRing);

  // 3. Front Robe Panel overlay (flowing down from the chest)
  const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(1.2, torsoH * 0.8, torsoW * 0.36), robeMat);
  frontPanel.position.set(torsoD * 0.42 + 0.7, -torsoH * 0.15, 0);
  frontPanel.castShadow = true;
  torso.add(frontPanel);

  // Gold trim & glass shards on front panel
  for (const sz of [-1, 1]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.75, torsoH * 0.72, 0.55), goldMat);
    trim.position.set(torsoD * 0.42 + 1.25, -torsoH * 0.15, sz * torsoW * 0.2);
    trim.castShadow = true;
    torso.add(trim);

    const diagonal = new THREE.Mesh(new THREE.BoxGeometry(0.7, torsoH * 0.4, 0.45), glassMat);
    diagonal.position.set(torsoD * 0.42 + 1.35, -torsoH * 0.08, sz * torsoW * 0.12);
    diagonal.rotation.x = sz * 0.55;
    diagonal.castShadow = true;
    torso.add(diagonal);
  }

  // 4. Chest Crystal core (Emissive star gem)
  const chest = new THREE.Mesh(new THREE.OctahedronGeometry(torsoW * 0.18, 0), prismMat);
  chest.position.set(0, torsoH * 0.16, torsoD * 0.5 + 1.1);
  chest.rotation.z = Math.PI / 4;
  chest.castShadow = true;
  torso.add(chest);

  // 5. Symmetrical Breastplates (Armor plates with cyan glow)
  for (const sz of [-1, 1]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.2, torsoH * 0.35, torsoW * 0.2), armorMat);
    plate.position.set(torsoD * 0.42 + 0.6, torsoH * 0.22, sz * torsoW * 0.18);
    plate.rotation.set(0, sz * 0.3, sz * -0.15);
    plate.castShadow = true;
    torso.add(plate);

    const plateTrim = new THREE.Mesh(new THREE.BoxGeometry(0.3, torsoH * 0.38, 0.4), goldMat);
    plateTrim.position.set(torsoD * 0.42 + 1.25, torsoH * 0.22, sz * torsoW * 0.26);
    plateTrim.rotation.copy(plate.rotation);
    plateTrim.castShadow = true;
    torso.add(plateTrim);
  }

  // 6. Hanging Tassets (Skirt Guards extending from the pelvis)
  const tassetPositions = [
    { px: torsoD * 0.45 + 0.5, pz: 0, rx: 0.18, ry: 0, rz: 0.05, w: torsoW * 0.32 },      // Front
    { px: -torsoD * 0.45 - 0.5, pz: 0, rx: -0.18, ry: 0, rz: -0.05, w: torsoW * 0.32 },    // Back
    { px: 0, pz: torsoW * 0.45 + 0.5, rx: 0, ry: Math.PI / 2, rz: 0.18, w: torsoD * 0.35 },  // Left (+Z)
    { px: 0, pz: -torsoW * 0.45 - 0.5, rx: 0, ry: -Math.PI / 2, rz: 0.18, w: torsoD * 0.35 }, // Right (-Z)
  ];
  for (const tp of tassetPositions) {
    const tasset = new THREE.Mesh(new THREE.BoxGeometry(0.8, torsoH * 0.42, tp.w), robeMat);
    tasset.position.set(tp.px, -torsoH * 0.52, tp.pz);
    tasset.rotation.set(tp.rx, tp.ry, tp.rz);
    tasset.castShadow = true;
    torso.add(tasset);

    const tassetTrim = new THREE.Mesh(new THREE.BoxGeometry(0.35, torsoH * 0.42, 0.4), goldMat);
    tassetTrim.position.set(tp.px * 1.08, -torsoH * 0.52, tp.pz);
    tassetTrim.rotation.copy(tasset.rotation);
    tassetTrim.castShadow = true;
    torso.add(tassetTrim);
  }

  // 7. Glass Orbit ring around the waist
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.48, 0.7, 8, 32), glassMat);
  orbit.position.set(0, torsoH * 0.02, 0);
  orbit.rotation.x = Math.PI / 2;
  orbit.castShadow = true;
  torso.add(orbit);

  // 8. Floating Shards
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(1.8, 0), i % 2 ? prismMat : glassMat);
    shard.position.set(Math.cos(a) * torsoW * 0.68, torsoH * 0.08 + Math.sin(i) * 3, Math.sin(a) * torsoW * 0.68);
    shard.rotation.set(a, a * 0.5, Math.PI / 4);
    addAccent(shard);
  }

  // 9. Floating Wings (Back Shards & Energy Rods)
  const wingsGroup = new THREE.Group();
  wingsGroup.position.set(-torsoD * 0.5 - 2.5, torsoH * 0.1, 0);
  torso.add(wingsGroup);
  for (let i = 0; i < 6; i++) {
    const angle = (i - 2.5) * 0.48;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(2.0, 0), glassMat);
    shard.position.set(-Math.cos(angle) * 3.5, Math.sin(angle) * 8.5 + 2.0, Math.sin(angle) * 7.5);
    shard.rotation.set(angle * 0.5, 0, angle + Math.PI / 2);
    shard.scale.set(0.6, 1.8, 0.6);
    shard.castShadow = true;
    wingsGroup.add(shard);

    const rodMat = reg(mat(0x00ffff, { emissive: 0x00f0ff, ei: 0.8 }));
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5.0, 4), rodMat);
    rod.position.copy(shard.position);
    rod.position.x += 1.5;
    rod.rotation.z = angle + Math.PI / 2;
    rod.castShadow = true;
    wingsGroup.add(rod);
  }

  // Layered Shoulder Pauldrons
  for (const sz of [-1, 1]) {
    const shoulderGroup = new THREE.Group();
    shoulderGroup.position.set(0, shoulderY + 1.4, sz * (torsoW * 0.5 + 2.2));
    
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.5, 4.2), armorMat);
    basePlate.rotation.set(0, 0, sz * -0.22);
    basePlate.castShadow = true;
    shoulderGroup.add(basePlate);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 4.5), goldMat);
    trim.position.y = 1.0;
    trim.rotation.copy(basePlate.rotation);
    trim.castShadow = true;
    shoulderGroup.add(trim);

    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(2.4, 0), glassMat);
    gem.position.y = 2.2;
    gem.scale.set(0.8, 1.4, 0.8);
    gem.castShadow = true;
    shoulderGroup.add(gem);

    addAccent(shoulderGroup);
  }

  const hairTex = materialTex ? materialTex('cloth', 'hair') : bodyTex;
  const hairMat = reg(mat(0xffffff, { rough: 0.75, metal: 0.1, map: hairTex }));
  hairMat.flatShading = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.1 * bulk, 16, 12), faceMat);

  // Mask covering the lower front face
  const maskShell = new THREE.Mesh(
    new THREE.SphereGeometry(7.2 * bulk, 16, 8, -Math.PI * 0.35, Math.PI * 0.7, Math.PI * 0.4, Math.PI * 0.45),
    maskMat
  );
  maskShell.position.set(0.15 * bulk, -0.5 * bulk, 0);
  head.add(maskShell);



  // --- Symmetric Purple Eyes & Eyebrows ---
  const scleraMat = reg(mat(0xfcfcfc, { rough: 0.5 }));
  const pupilMat = reg(mat(0xc084fc, { emissive: 0xa855f7, ei: 0.8 }));
  const browMat = reg(mat(0x2d3844, { rough: 0.8 }));

  // Left Eye
  face.eyeL = new THREE.Group();
  const scleraL = new THREE.Mesh(new THREE.BoxGeometry(0.95 * bulk, 1.25 * bulk, 2.0 * bulk), scleraMat);
  scleraL.position.set(0, 0, 0);
  face.eyeL.add(scleraL);
  const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.3 * bulk, 0.6 * bulk, 0.6 * bulk), pupilMat);
  pupilL.position.set(0.15 * bulk, 0, 0);
  face.eyeL.add(pupilL);
  face.eyeL.position.set(frontX - 0.25 * bulk, 0.55 * bulk, 2.05 * bulk);
  faceGroup.add(face.eyeL);

  // Right Eye (replacing Eyepatch with symmetric purple eye)
  face.eyeR = new THREE.Group();
  const scleraR = new THREE.Mesh(new THREE.BoxGeometry(0.95 * bulk, 1.25 * bulk, 2.0 * bulk), scleraMat);
  scleraR.position.set(0, 0, 0);
  face.eyeR.add(scleraR);
  const pupilR = new THREE.Mesh(new THREE.BoxGeometry(0.3 * bulk, 0.6 * bulk, 0.6 * bulk), pupilMat);
  pupilR.position.set(0.15 * bulk, 0, 0);
  face.eyeR.add(pupilR);
  face.eyeR.position.set(frontX - 0.25 * bulk, 0.55 * bulk, -2.05 * bulk);
  faceGroup.add(face.eyeR);

  // Eyebrows
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.2 * bulk, 0.25 * bulk, 1.6 * bulk), browMat);
  browL.position.set(frontX + 0.1 * bulk, 1.45 * bulk, 2.05 * bulk);
  browL.rotation.y = 0.1;
  faceGroup.add(browL);

  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.2 * bulk, 0.25 * bulk, 1.6 * bulk), browMat);
  browR.position.set(frontX + 0.1 * bulk, 1.45 * bulk, -2.05 * bulk);
  browR.rotation.y = -0.1;
  faceGroup.add(browR);

  // Zipper mask details (teeth/mouth grin)
  const mouthBack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 2.2), reg(mat(0x7f0f0f, { emissive: 0x220000 })));
  mouthBack.position.set(frontX - 0.45, -1.3 * bulk, 0);
  faceGroup.add(mouthBack);

  for (let tz = -3; tz <= 3; tz++) {
    if (tz === 0) continue;
    const toothU = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.22), zipperMat);
    toothU.position.set(frontX - 0.35, -1.2 * bulk, tz * 0.22 * bulk);
    faceGroup.add(toothU);

    const toothL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.22), zipperMat);
    toothL.position.set(frontX - 0.35, -1.4 * bulk, tz * 0.22 * bulk);
    faceGroup.add(toothL);
  }

  const circlet = new THREE.Mesh(new THREE.TorusGeometry(5.5 * bulk, 0.45, 6, 28), goldMat);
  circlet.rotation.y = Math.PI / 2;
  circlet.position.set(frontX * 0.15, 2.8 * bulk, 0);
  faceGroup.add(circlet);
  const crownShard = new THREE.Mesh(new THREE.OctahedronGeometry(1.6 * bulk, 0), glassMat);
  crownShard.position.set(frontX * 0.7, 4.2 * bulk, 0);
  faceGroup.add(crownShard);

  // --- SPIKY POLYGONAL HAIR SYSTEM ---
  const hairGroup = new THREE.Group();
  head.add(hairGroup);

  // Skull cover base cap
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(7.35 * bulk, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65),
    hairMat
  );
  hairCap.position.set(-0.35 * bulk, 0.8 * bulk, 0);
  hairGroup.add(hairCap);

  // 32 spiky polygon hair strands (Asymmetric anime design)
  const spikes = [
    // --- BANGS (Front hair, swept from +Z to -Z, wide in Z, thin in X) ---
    // Left bangs (+Z side - shorter, swept to the side to keep left eye clear)
    { r: 1.3, h: 6.8, px: 5.4, py: 2.3, pz: 2.2, rx: -0.2, ry: 0.1, rz: -2.85, sx: 0.35, sy: 1.0, sz: 1.0 },
    { r: 1.1, h: 6.0, px: 5.2, py: 1.6, pz: 3.2, rx: -0.3, ry: 0.2, rz: -2.75, sx: 0.35, sy: 1.0, sz: 0.95 },
    
    // Center bangs (sweeping across the forehead)
    { r: 1.4, h: 8.0, px: 5.8, py: 2.8, pz: 0.8, rx: -0.05, ry: 0.05, rz: -2.95, sx: 0.35, sy: 1.0, sz: 1.1 },
    { r: 1.3, h: 8.2, px: 5.9, py: 2.6, pz: -0.4, rx: 0.1, ry: -0.05, rz: -2.9, sx: 0.35, sy: 1.0, sz: 1.1 },
    
    // Right bangs (-Z side - longer, framing right side of face)
    { r: 1.5, h: 9.0, px: 5.7, py: 2.0, pz: -1.6, rx: 0.25, ry: -0.15, rz: -2.8, sx: 0.35, sy: 1.0, sz: 1.15 },
    { r: 1.4, h: 9.2, px: 5.4, py: 0.8, pz: -2.8, rx: 0.4, ry: -0.2, rz: -2.7, sx: 0.35, sy: 1.0, sz: 1.1 },
    { r: 1.2, h: 8.2, px: 4.8, py: 0.2, pz: -4.0, rx: 0.55, ry: -0.3, rz: -2.6, sx: 0.35, sy: 1.0, sz: 1.0 },

    // --- SIDEBURNS (Side locks, asymmetric: Left side has a long elegant accent strand) ---
    // Left side (+Z - Long front lock)
    { r: 1.4, h: 11.2, px: 1.5, py: 0.0, pz: 5.8, rx: -0.5, ry: 0.2, rz: -2.65, sx: 1.1, sy: 1.0, sz: 0.35 },
    { r: 1.1, h: 8.0, px: -0.8, py: -0.2, pz: 6.2, rx: -0.35, ry: 0.1, rz: -2.6, sx: 1.0, sy: 1.0, sz: 0.35 },
    
    // Right side (-Z - Shorter messy locks)
    { r: 1.5, h: 9.0, px: 1.2, py: 0.8, pz: -5.8, rx: 0.4, ry: -0.15, rz: -2.75, sx: 1.1, sy: 1.0, sz: 0.35 },
    { r: 1.3, h: 8.5, px: -0.8, py: -0.4, pz: -6.2, rx: 0.35, ry: -0.1, rz: -2.6, sx: 1.1, sy: 1.0, sz: 0.35 },
    { r: 1.2, h: 8.0, px: 2.5, py: 1.6, pz: -4.8, rx: 0.3, ry: -0.2, rz: -2.85, sx: 1.0, sy: 1.0, sz: 0.35 },

    // --- TOP CROWN SPIKES (Swept strongly to the right (-Z) for asymmetry) ---
    // Central top (heavy tilt to right)
    { r: 2.2, h: 10.2, px: -0.2, py: 7.4, pz: -0.5, rx: 0.3, ry: -0.1, rz: -0.3, sx: 0.45, sy: 1.0, sz: 1.2 },
    { r: 2.0, h: 9.5, px: -1.8, py: 7.5, pz: 0.2, rx: -0.1, ry: 0.1, rz: -0.6, sx: 0.4, sy: 1.0, sz: 1.05 },
    { r: 1.9, h: 9.2, px: -1.2, py: 7.2, pz: -1.5, rx: 0.45, ry: -0.2, rz: -0.45, sx: 0.4, sy: 1.0, sz: 1.0 },
    { r: 1.7, h: 8.5, px: -2.8, py: 6.8, pz: -0.6, rx: 0.2, ry: -0.1, rz: -0.8, sx: 0.4, sy: 1.0, sz: 1.0 },

    // Front top (pointing forward-up)
    { r: 1.8, h: 8.2, px: 1.8, py: 6.6, pz: -0.2, rx: 0.15, ry: -0.05, rz: 0.25, sx: 0.4, sy: 1.0, sz: 1.0 },
    { r: 1.6, h: 7.5, px: 1.6, py: 6.4, pz: 1.0, rx: -0.2, ry: 0.1, rz: 0.2, sx: 0.4, sy: 1.0, sz: 1.0 },
    { r: 1.5, h: 7.2, px: 1.4, py: 6.3, pz: -1.5, rx: 0.3, ry: -0.2, rz: 0.15, sx: 0.4, sy: 1.0, sz: 1.0 },

    // Left top (+Z)
    { r: 1.7, h: 8.5, px: -0.6, py: 6.6, pz: 2.2, rx: -0.5, ry: 0.25, rz: -0.3, sx: 0.45, sy: 1.0, sz: 1.1 },
    { r: 1.5, h: 7.5, px: -1.9, py: 6.0, pz: 3.0, rx: -0.7, ry: 0.3, rz: -0.45, sx: 0.4, sy: 1.0, sz: 1.0 },

    // Right top (-Z - larger spikes sweeping down the right side)
    { r: 2.1, h: 9.8, px: -0.4, py: 6.6, pz: -2.5, rx: 0.65, ry: -0.3, rz: -0.25, sx: 0.45, sy: 1.0, sz: 1.2 },
    { r: 1.8, h: 8.5, px: -1.7, py: 6.0, pz: -3.4, rx: 0.9, ry: -0.4, rz: -0.4, sx: 0.4, sy: 1.0, sz: 1.1 },

    // --- BACK SPIKES (pointing backwards/downwards, slightly asymmetrical) ---
    // Central back
    { r: 2.1, h: 10.0, px: -4.6, py: 4.4, pz: -0.2, rx: 0.05, ry: -0.02, rz: -1.35, sx: 0.4, sy: 1.0, sz: 1.1 },
    { r: 1.9, h: 9.0, px: -5.1, py: 1.9, pz: 0.1, rx: -0.05, ry: 0.02, rz: -1.8, sx: 0.4, sy: 1.0, sz: 1.0 },

    // Back left (+Z)
    { r: 1.8, h: 8.8, px: -4.3, py: 3.8, pz: 2.3, rx: -0.4, ry: 0.25, rz: -1.25, sx: 0.4, sy: 1.0, sz: 1.0 },
    { r: 1.6, h: 8.0, px: -4.9, py: 1.4, pz: 2.5, rx: -0.5, ry: 0.35, rz: -1.65, sx: 0.4, sy: 1.0, sz: 1.0 },

    // Back right (-Z - swept slightly lower)
    { r: 1.9, h: 9.0, px: -4.3, py: 3.6, pz: -2.4, rx: 0.45, ry: -0.25, rz: -1.2, sx: 0.4, sy: 1.0, sz: 1.05 },
    { r: 1.7, h: 8.2, px: -4.9, py: 1.2, pz: -2.6, rx: 0.55, ry: -0.35, rz: -1.6, sx: 0.4, sy: 1.0, sz: 1.05 },
  ];

  for (const s of spikes) {
    const geom = new THREE.ConeGeometry(s.r * bulk, s.h * bulk, 6);
    const mesh = new THREE.Mesh(geom, hairMat);
    mesh.position.set(s.px * bulk, s.py * bulk, s.pz * bulk);
    mesh.rotation.set(s.rx, s.ry, s.rz);
    mesh.scale.set(s.sx, s.sy, s.sz);
    mesh.castShadow = true;
    hairGroup.add(mesh);
  }

  const armL = mkLimb(0, -ctx.shoulderX, true, robeMat, darkGlassMat, base);
  const armR = mkLimb(0, ctx.shoulderX, true, robeMat, darkGlassMat, base);
  const legL = mkLimb(0, -ctx.hipX, false, robeMat, darkGlassMat, base);
  const legR = mkLimb(0, ctx.hipX, false, robeMat, darkGlassMat, base);

  // Customize limbs with multi-polygonal layered shapes & textures
  const customizeLimb = (pivot, isArm, pz, limbMat, bootMat, ringCol) => {
    // Clear standard meshes generated inside mkLimb
    while (pivot.children.length > 0) {
      pivot.remove(pivot.children[0]);
    }

    const len = 15;
    const w = isArm ? 4.5 * bulk : 5.5 * bulk;

    // 1. Upper limb segment (tapered hex cylinder)
    const upperGeom = new THREE.CylinderGeometry(w * 0.45, w * 0.45, len * 0.55, 6);
    const upperLimb = new THREE.Mesh(upperGeom, limbMat);
    upperLimb.position.y = -len * 0.275;
    upperLimb.castShadow = true;
    pivot.add(upperLimb);

    // Decorative gold ring on the upper limb
    const upperRing = new THREE.Mesh(new THREE.BoxGeometry(w * 1.05, 0.8 * bulk, w * 1.05), goldMat);
    upperRing.position.y = -len * 0.2;
    upperRing.castShadow = true;
    pivot.add(upperRing);

    // 2. Glowing glass joint crystal (elbow/knee)
    const jointMat = reg(mat(0x00f0ff, { emissive: 0x00ffff, ei: 0.8 }));
    const joint = new THREE.Mesh(new THREE.OctahedronGeometry(w * 0.45, 0), jointMat);
    joint.position.y = -len * 0.55;
    joint.castShadow = true;
    pivot.add(joint);

    // 3. Lower limb segment (Gauntlet/Boot)
    const bootW = w * 1.35;
    const bootH = len * 0.4;
    const lowerArmor = new THREE.Mesh(new THREE.BoxGeometry(bootW, bootH, bootW), bootMat);
    lowerArmor.position.y = -len * 0.55 - bootH / 2;
    lowerArmor.castShadow = true;
    pivot.add(lowerArmor);

    // Gold trim around the top of the boot/gauntlet
    const bootTrim = new THREE.Mesh(new THREE.BoxGeometry(bootW + 0.3, 0.6 * bulk, bootW + 0.3), goldMat);
    bootTrim.position.y = -len * 0.55;
    bootTrim.castShadow = true;
    pivot.add(bootTrim);

    // Glass shield plates on the outer side of the arm/leg
    const isLeft = pz < 0;
    const outerSign = isLeft ? -1 : 1;
    const glassPlate = new THREE.Mesh(new THREE.BoxGeometry(bootW * 0.55, bootH * 0.8, 0.35 * bulk), glassMat);
    glassPlate.position.set(0, -len * 0.55 - bootH / 2, outerSign * (bootW * 0.5 + 0.22 * bulk));
    glassPlate.castShadow = true;
    pivot.add(glassPlate);

    // Bottom glowing ring
    const ringMat = reg(mat(ringCol, { emissive: ringCol, ei: 2.2 }));
    const ring = new THREE.Mesh(new THREE.BoxGeometry(bootW + 0.6, 1.0, bootW + 0.6), ringMat);
    ring.position.y = -len * 0.55 - bootH;
    pivot.add(ring);
  };

  customizeLimb(armL, true, -ctx.shoulderX, robeMat, armorMat, base);
  customizeLimb(armR, true, ctx.shoulderX, robeMat, armorMat, base);
  customizeLimb(legL, false, -ctx.hipX, robeMat, armorMat, base);
  customizeLimb(legR, false, ctx.hipX, robeMat, armorMat, base);

  // Cape & Cape Trim (Polygonal celestial cloak on the back with wind-swept folds)
  const cape = new THREE.Group();
  cape.position.set(-torsoD * 0.62, shoulderY - torsoH * 0.65, 0);
  
  // Cape folds
  const foldL = new THREE.Mesh(new THREE.BoxGeometry(0.5 * bulk, torsoH * 1.42, torsoW * 0.38), robeMat);
  foldL.position.set(0, 0, torsoW * 0.2);
  foldL.rotation.set(0.12, 0.28, 0.06);
  foldL.castShadow = true;
  cape.add(foldL);

  const foldC = new THREE.Mesh(new THREE.BoxGeometry(0.6 * bulk, torsoH * 1.5, torsoW * 0.44), robeMat);
  foldC.position.set(-0.25 * bulk, -0.04 * torsoH, 0);
  foldC.rotation.set(0.18, 0, 0);
  foldC.castShadow = true;
  cape.add(foldC);

  const foldR = new THREE.Mesh(new THREE.BoxGeometry(0.5 * bulk, torsoH * 1.42, torsoW * 0.38), robeMat);
  foldR.position.set(0, 0, -torsoW * 0.2);
  foldR.rotation.set(0.12, -0.28, -0.06);
  foldR.castShadow = true;
  cape.add(foldR);

  // Cape Gold Center Accent Trim
  const foldGold = new THREE.Mesh(new THREE.BoxGeometry(0.2 * bulk, torsoH * 1.3, 0.65 * bulk), goldMat);
  foldGold.position.set(0.15 * bulk, 0, 0);
  foldGold.rotation.set(0.18, 0, 0);
  foldGold.castShadow = true;
  cape.add(foldGold);

  // Cape Inner Trim (Transparent glowing cyan)
  const capeTrim = new THREE.Group();
  capeTrim.position.set(-torsoD * 0.52, shoulderY - torsoH * 0.6, 0);

  const capeInnerMat = reg(mat(0x00f0ff, { transparent: true, opacity: 0.35, emissive: 0x00ffff, ei: 0.8, side: THREE.DoubleSide }));
  
  const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.3 * bulk, torsoH * 1.25, torsoW * 0.34), capeInnerMat);
  trimL.position.set(0, 0, torsoW * 0.16);
  trimL.rotation.set(0.08, 0.22, 0.04);
  trimL.castShadow = true;
  capeTrim.add(trimL);

  const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.3 * bulk, torsoH * 1.25, torsoW * 0.34), capeInnerMat);
  trimR.position.set(0, 0, -torsoW * 0.16);
  trimR.rotation.set(0.08, -0.22, -0.04);
  trimR.castShadow = true;
  capeTrim.add(trimR);

  return {
    torso,
    head,
    armL,
    armR,
    legL,
    legR,
    attachments: [cape, capeTrim],
    customUpdate(_dt, _group, ud) {
      cape.rotation.z = Math.sin(ud.breathe * 0.8) * 0.06;
      capeTrim.rotation.z = Math.sin(ud.breathe * 0.8 + 0.3) * 0.08;
    },
  };
}

export const buildWeapon = buildGlassAstrologerWeapon;
