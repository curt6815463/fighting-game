// 槍手：琥珀彈幕、火光、機動。雙槍射擊 / 翻滾閃避 / 燃燒彈 / 彈幕風暴。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, cone, burst, sphereFlash, addShake, addFlash, ultimateBurst } from './lib.js';

const AMBER = '#ffd76a';
const FIRE = '#ff7a18';

// 子彈：拉長的琥珀光彈 + 曳光
registerVfx('gunner_shot', {
  projectile(ctx, pr) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const geo = new TH.CylinderGeometry(pr.radius * 0.55, pr.radius * 0.55, pr.radius * 5, 6);
    const mat = new TH.MeshStandardMaterial({ color: 0xfff2c4, emissive: 0xffd76a, emissiveIntensity: 3.2, roughness: 0.3 });
    const bullet = new TH.Mesh(geo, mat); bullet.rotation.z = Math.PI / 2; g.add(bullet);
    g.userData.geo = geo; g.userData.mat = mat;
    return {
      object3D: g,
      update() {
        ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: 0, vy: 0, vz: 0, life: 0.18, size: pr.radius * 1.6, color: AMBER, drag: 4, fade: true });
      },
    };
  },
  onHit(ctx, f, c) {
    sphereFlash(ctx, c, { color: AMBER, from: 3, to: (f.radius || 9) * 2.4, life: 0.18, alpha: 0.9 });
    burst(ctx, c, { color: [AMBER, '#ffffff'], count: 8, speed: 160, life: 0.3, size: 2.4 });
  },
});

// 翻滾閃避：塵土橫移殘影
registerVfx('gunner_roll', {
  onCast(ctx, f, c) {
    ring(ctx, c, { color: AMBER, from: 6, to: 56, life: 0.34, y: 2, alpha: 0.7 });
    // 反方向塵土
    cone(ctx, c, f.facing + Math.PI, { color: ['#d4b483', '#a8895c'], count: 18, speed: 200, spread: 0.7, up: 30, gravity: 200, life: 0.45, size: 4 });
    for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2; ctx.particles.spawn({ x: c.x, y: 4, z: c.z, vx: Math.cos(a) * 120, vy: 30 + Math.random() * 40, vz: Math.sin(a) * 120, gravity: 220, drag: 2, life: 0.4, size: 3.5, color: '#c8a878', fade: true }); }
  },
});

// 燃燒彈：火焰彈丸 + 落地火池
registerVfx('gunner_incendiary', {
  projectile(ctx, pr) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const geo = new TH.IcosahedronGeometry(pr.radius, 0);
    const mat = new TH.MeshStandardMaterial({ color: 0xffd08a, emissive: 0xff7a18, emissiveIntensity: 3.2, roughness: 0.4 });
    const core = new TH.Mesh(geo, mat); g.add(core);
    g.userData.geo = geo; g.userData.mat = mat;
    return {
      object3D: g,
      update(dt) {
        core.rotation.x += dt * 5; core.rotation.y += dt * 4;
        ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: (Math.random() - 0.5) * 24, vy: 12 + Math.random() * 24, vz: (Math.random() - 0.5) * 24, life: 0.4, size: pr.radius * 1.4, color: Math.random() < 0.5 ? FIRE : '#ffce54', drag: 2, fade: true });
      },
    };
  },
  onHit(ctx, f, c) {
    sphereFlash(ctx, c, { color: FIRE, from: 6, to: 50, life: 0.26, alpha: 0.9 });
    burst(ctx, c, { color: [FIRE, '#ffce54', '#ff3b2f'], count: 20, speed: 220, up: 40, life: 0.5, size: 4 });
    addShake(ctx, 5);
  },
  zone(ctx, z) {
    const TH = ctx.THREE;
    const R = z.radius || 90;
    const geo = new TH.CircleGeometry(R, 24);
    const mat = new TH.MeshBasicMaterial({ color: 0xff7a18, transparent: true, opacity: 0.4, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const disc = new TH.Mesh(geo, mat); disc.rotation.x = -Math.PI / 2; disc.position.y = 1.2;
    const g = new TH.Group(); g.add(disc);
    g.userData.geo = geo; g.userData.mat = mat;
    return {
      object3D: g,
      update() {
        mat.opacity = 0.32 + 0.14 * Math.sin(performance.now() / 70);
        if (Math.random() < 0.7) { const a = Math.random() * Math.PI * 2, rr = Math.random() * R; ctx.particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 2, z: g.position.z + Math.sin(a) * rr, vx: 0, vy: 40 + Math.random() * 50, vz: 0, drag: 1, life: 0.45, size: 3.5, color: Math.random() < 0.5 ? FIRE : '#ffce54', fade: true }); }
      },
    };
  },
});

// 彈幕風暴：扇形傾瀉的彈幕爆發 (子彈沿用 gunner_shot 視覺)
registerVfx('gunner_ultimate', {
  projectile(ctx, pr) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const geo = new TH.CylinderGeometry(pr.radius * 0.5, pr.radius * 0.5, pr.radius * 5, 6);
    const mat = new TH.MeshStandardMaterial({ color: 0xfff2c4, emissive: 0xffd76a, emissiveIntensity: 3.4, roughness: 0.3 });
    const bullet = new TH.Mesh(geo, mat); bullet.rotation.z = Math.PI / 2; g.add(bullet);
    g.userData.geo = geo; g.userData.mat = mat;
    return { object3D: g, update() { ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, life: 0.16, size: pr.radius * 1.5, color: AMBER, drag: 4, fade: true }); } };
  },
  onCast(ctx, f, c) {
    ctx.sceneMgr.addShake(12);
    ctx.sceneMgr.addFlash(0.28, AMBER);
    cone(ctx, c, f.facing, { color: [AMBER, '#ffffff', FIRE], count: 40, speed: 520, spread: (f.arc || 0.7), offset: 20, life: 0.4, size: 4 });
    ring(ctx, c, { color: AMBER, from: 12, to: 120, life: 0.5, y: 3, alpha: 0.8, ease: true });
    sphereFlash(ctx, c, { color: '#fff2c4', from: 8, to: 56, life: 0.3, alpha: 0.85 });
  },
});
