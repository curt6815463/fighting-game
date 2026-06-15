// 咒術師：深紫詛咒、符文、衰弱。詛咒彈 / 噩夢束縛 / 衰弱領域 / 萬咒齊發。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, burst, column, sphereFlash, addShake, addFlash, ultimateBurst } from './lib.js';

const PURPLE = '#9b59b6';
const VIOLET = '#bb6bd9';

// 詛咒彈：旋轉的紫色詛咒符
registerVfx('hexer_bolt', {
  projectile(ctx, pr) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const coreGeo = new TH.OctahedronGeometry(pr.radius, 0);
    const coreMat = new TH.MeshStandardMaterial({ color: 0xe6c2ff, emissive: 0x8e44ad, emissiveIntensity: 3.0, roughness: 0.3 });
    const core = new TH.Mesh(coreGeo, coreMat); g.add(core);
    const ringGeo = new TH.TorusGeometry(pr.radius * 1.8, pr.radius * 0.3, 6, 16);
    const ringMat = new TH.MeshBasicMaterial({ color: 0xbb6bd9, transparent: true, opacity: 0.7, blending: TH.AdditiveBlending, depthWrite: false });
    const r = new TH.Mesh(ringGeo, ringMat); r.rotation.x = Math.PI / 2; g.add(r);
    g.userData.geo = { dispose: () => { coreGeo.dispose(); ringGeo.dispose(); } };
    g.userData.mat = { dispose: () => { coreMat.dispose(); ringMat.dispose(); } };
    return {
      object3D: g,
      update(dt) {
        core.rotation.y += dt * 6; core.rotation.x += dt * 3; r.rotation.z += dt * 4;
        if (Math.random() < 0.6) ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20, vz: (Math.random() - 0.5) * 20, life: 0.35, size: pr.radius * 1.2, color: VIOLET, drag: 3, fade: true });
      },
    };
  },
  onHit(ctx, f, c) {
    ring(ctx, c, { color: VIOLET, from: 6, to: (f.radius || 14) * 2.2, life: 0.3, y: 6, alpha: 0.85 });
    burst(ctx, c, { color: [PURPLE, VIOLET, '#3a1f50'], count: 12, speed: 150, life: 0.4, size: 3 });
  },
});

// 噩夢束縛：暗紫鎖鏈彈
registerVfx('hexer_bind', {
  projectile(ctx, pr) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const geo = new TH.TorusKnotGeometry(pr.radius * 1.2, pr.radius * 0.4, 32, 6, 2, 3);
    const mat = new TH.MeshStandardMaterial({ color: 0x4a235a, emissive: 0x6c3483, emissiveIntensity: 2.6, roughness: 0.4, metalness: 0.4 });
    const m = new TH.Mesh(geo, mat); g.add(m);
    g.userData.geo = geo; g.userData.mat = mat;
    return { object3D: g, update(dt) { m.rotation.x += dt * 5; m.rotation.z += dt * 3; } };
  },
  onHit(ctx, f, c) {
    const TH = ctx.THREE;
    // 命中：腳下鎖鏈束縛環
    const geo = new TH.TorusGeometry(20, 2.4, 6, 18);
    const mat = new TH.MeshBasicMaterial({ color: 0x6c3483, transparent: true, opacity: 0.9, blending: TH.AdditiveBlending, depthWrite: false });
    const m = new TH.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(c.x, 4, c.z);
    ctx.addTransient(m, 0.5, (mesh, t) => { mesh.scale.setScalar(1 + t * 0.4); mesh.material.opacity = (1 - t) * 0.9; mesh.rotation.z = t * 3; });
    m.userData.geo = geo; m.userData.mat = mat;
    burst(ctx, c, { color: [PURPLE, '#2a1438'], count: 14, speed: 120, up: 30, life: 0.45, size: 3.5 });
  },
});

// 衰弱領域：跟隨自身的紫色削弱光環 (亦供詛咒擴散 'buff' fx 觸發)
registerVfx('hexer_field', {
  onCast(ctx, f, c) {
    ring(ctx, c, { color: VIOLET, from: 10, to: (f.radius || 175) * 0.8, life: 0.5, y: 4, alpha: 0.7, ease: true });
    burst(ctx, c, { color: [PURPLE, VIOLET], count: 16, speed: 120, up: 20, life: 0.5, size: 3 });
  },
  zone(ctx, z) {
    const TH = ctx.THREE;
    const R = z.radius || 175;
    const g = new TH.Group();
    const discGeo = new TH.CircleGeometry(R, 32);
    const discMat = new TH.MeshBasicMaterial({ color: 0x6c3483, transparent: true, opacity: 0.26, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const disc = new TH.Mesh(discGeo, discMat); disc.rotation.x = -Math.PI / 2; disc.position.y = 1.1; g.add(disc);
    const rGeo = new TH.RingGeometry(R * 0.9, R, 36);
    const rMat = new TH.MeshBasicMaterial({ color: 0xbb6bd9, transparent: true, opacity: 0.55, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const rmesh = new TH.Mesh(rGeo, rMat); rmesh.rotation.x = -Math.PI / 2; rmesh.position.y = 1.3; g.add(rmesh);
    g.userData.geo = { dispose: () => { discGeo.dispose(); rGeo.dispose(); } };
    g.userData.mat = { dispose: () => { discMat.dispose(); rMat.dispose(); } };
    return {
      object3D: g,
      update(dt) {
        rmesh.rotation.z += dt * 0.8;
        const pulse = 0.22 + 0.1 * Math.sin(performance.now() / 160);
        discMat.opacity = pulse;
        if (Math.random() < 0.3) { const a = Math.random() * Math.PI * 2, rr = Math.random() * R; ctx.particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 2, z: g.position.z + Math.sin(a) * rr, vx: 0, vy: 28 + Math.random() * 24, vz: 0, drag: 1.2, life: 0.6, size: 3, color: VIOLET, fade: true }); }
      },
    };
  },
});

// 萬咒齊發：大範圍紫色詛咒爆 + 鎖鏈牢籠
registerVfx('hexer_ultimate', {
  onCast(ctx, f, c) {
    const R = f.radius || 240;
    ctx.sceneMgr.addShake(18);
    ctx.sceneMgr.addFlash(0.36, PURPLE);
    ultimateBurst(ctx, c, { color: PURPLE, radius: R, pillarH: 160, pillarR: 30, count: 46, shake: 18, flash: 0 });
    ring(ctx, c, { color: VIOLET, from: 30, to: R * 1.3, life: 0.8, y: 3, alpha: 0.6, inner: 0.92, ease: true });
    sphereFlash(ctx, c, { color: '#e6c2ff', from: 10, to: R * 0.5, life: 0.36, alpha: 0.85 });
    // 環繞符文牢籠
    const TH = ctx.THREE;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const geo = new TH.BoxGeometry(2.5, 70, 2.5);
      const mat = new TH.MeshBasicMaterial({ color: 0xbb6bd9, transparent: true, opacity: 0.8, blending: TH.AdditiveBlending, depthWrite: false });
      const bar = new TH.Mesh(geo, mat);
      bar.position.set(c.x + Math.cos(a) * R * 0.7, 35, c.z + Math.sin(a) * R * 0.7);
      ctx.addTransient(bar, 0.7, (m, t) => { m.material.opacity = (1 - t) * 0.8; m.scale.y = 1 - t * 0.5; });
      bar.userData.geo = geo; bar.userData.mat = mat;
    }
  },
});
