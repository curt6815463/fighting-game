// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildChronohexWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 時厄術士：時咒法杖 — 鐘環(青) 套住 詛咒晶核(紫) + 指針
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 52, 8), dark), 3, -2, 0);                                  // 杖身
        add(new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.95, 8, 24), gold), 3, 26, 0, Math.PI / 2, 0, 0);                  // 鐘環
        add(new THREE.Mesh(new THREE.CircleGeometry(5.6, 20), reg(mat(0xeafdff, { emissive: 0x4dd0e1, ei: 1.3 }))), 3.4, 26, 0, 0, -Math.PI / 2, 0); // 鐘面(青發光)
        const hexGem = add(new THREE.Mesh(new THREE.OctahedronGeometry(3.0, 0), reg(mat(0xc77dff, { emissive: 0x8e44ad, ei: 2.4 }))), 3, 26, 0); // 詛咒晶核(紫)
        add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.6, 0.4), accent), 3.7, 26, 0);                                      // 長指針
        add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.0, 0.4), accent), 3.7, 26, 0, 0, 0, Math.PI / 2);                   // 短指針
        hexGem.userData = { glow: true };
}
