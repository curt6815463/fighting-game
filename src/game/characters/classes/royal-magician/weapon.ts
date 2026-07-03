// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildRoyalMagicianWeapon(hand, ctx) {
  const { THREE, reg, mat, gold, accent, add } = createWeaponKit(hand, ctx);
  const paper = reg(mat(0xd8d0c2, { rough: 0.72, metal: 0.02, emissive: 0x241016, ei: 0.15 }));
  const red = reg(mat(0xc9184a, { rough: 0.55, metal: 0.05, emissive: 0x5a071f, ei: 0.35 }));

  // Create 5 cards forming a premium fan wand, each with a golden border and heart pip
  for (let i = 0; i < 5; i++) {
    const rotZ = (i - 2) * 0.24;
    const posY = 6 + Math.abs(i - 2) * 1.0;
    const posZ = (i - 2) * 2.3;
    
    // Golden border backing
    const border = new THREE.Mesh(new THREE.BoxGeometry(0.12, 10.4, 6.6), gold);
    add(border, 3.35, posY, posZ, 0, 0.12, rotZ);

    // Card face
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.1, 10, 6.2), paper);
    add(card, 3.4, posY, posZ, 0, 0.12, rotZ);

    // Dynamic color suite pip
    const pip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 1.8), i % 2 ? red : accent);
    add(pip, 3.5, posY, posZ, 0, 0.12, rotZ);
  }

  // Wand handle staff
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 18, 8), gold), 2.2, 2, -6.2, 0.12, 0, 0.08);
  // Bottom staff grip pommel
  add(new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), accent), 2.2, -7.5, -6.2);
  // Top staff glowing octahedron jewel
  add(new THREE.Mesh(new THREE.OctahedronGeometry(1.8, 0), accent), 2.2, 13, -6.2);
}
