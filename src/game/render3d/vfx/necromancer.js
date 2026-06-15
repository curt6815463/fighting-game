// 死靈法師：幽綠死氣、DoT、汲取。死亡射線 / 生命汲取 / 腐蝕爆發 / 亡靈大軍。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, burst, column, sphereFlash, addShake, addFlash, ultimateBurst } from './lib.js';

const GREEN = '#2ecc71';
const SICK = '#1e8449';

// 死亡射線：幽綠骷髏彈 + 流血拖尾
registerVfx('necro_ray', {
  projectile(ctx, pr) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const geo = new TH.IcosahedronGeometry(pr.radius, 0);
    const mat = new TH.MeshStandardMaterial({ color: 0xbfe6b0, emissive: 0x27ae60, emissiveIntensity: 3.0, roughness: 0.4 });
    const core = new TH.Mesh(geo, mat); g.add(core);
    g.userData.geo = geo; g.userData.mat = mat;
    return {
      object3D: g,
      update(dt) {
        core.rotation.x += dt * 4;
        if (Math.random() < 0.7) ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: (Math.random() - 0.5) * 16, vy: -8 - Math.random() * 12, vz: (Math.random() - 0.5) * 16, life: 0.5, size: pr.radius * 1.2, color: SICK, drag: 1.6, fade: true });
      },
    };
  },
  onHit(ctx, f, c) {
    ring(ctx, c, { color: GREEN, from: 5, to: (f.radius || 12) * 2.2, life: 0.3, y: 6, alpha: 0.8 });
    burst(ctx, c, { color: [GREEN, SICK, '#0e3d24'], count: 12, speed: 130, life: 0.45, size: 3 });
  },
});

// 生命汲取：施法起手 + 每跳汲取鏈
registerVfx('necro_drain', {
  onCast(ctx, f, c) {
    ring(ctx, c, { color: GREEN, from: 8, to: 60, life: 0.4, y: 4, alpha: 0.7 });
    column(ctx, c, { color: [GREEN, SICK], count: 16, radius: 18, speed: 130, life: 0.6, size: 3.5 });
  },
  onHit(ctx, f, c) {
    // 汲取每跳：目標被抽出幽綠靈氣
    sphereFlash(ctx, c, { color: GREEN, from: 4, to: 24, life: 0.22, alpha: 0.85 });
    for (let i = 0; i < 6; i++) ctx.particles.spawn({ x: c.x + (Math.random() - 0.5) * 14, y: 6 + Math.random() * 14, z: c.z + (Math.random() - 0.5) * 14, vx: (Math.random() - 0.5) * 30, vy: 60 + Math.random() * 40, vz: (Math.random() - 0.5) * 30, drag: 1.4, life: 0.45, size: 3, color: GREEN, fade: true });
  },
});

// 腐蝕爆發：幽綠毒霧地帶
registerVfx('necro_corrupt', {
  zone(ctx, z) {
    const TH = ctx.THREE;
    const R = z.radius || 130;
    const geo = new TH.CircleGeometry(R, 28);
    const mat = new TH.MeshBasicMaterial({ color: 0x27ae60, transparent: true, opacity: 0.3, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const disc = new TH.Mesh(geo, mat); disc.rotation.x = -Math.PI / 2; disc.position.y = 1.2;
    const g = new TH.Group(); g.add(disc);
    g.userData.geo = geo; g.userData.mat = mat;
    let first = true;
    return {
      object3D: g,
      update() {
        if (first) { first = false; const cc = { x: g.position.x, y: 6, z: g.position.z }; ring(ctx, cc, { color: GREEN, from: 10, to: R, life: 0.5, y: 3, alpha: 0.7, ease: true }); addShake(ctx, 4); }
        mat.opacity = 0.24 + 0.1 * Math.sin(performance.now() / 130);
        if (Math.random() < 0.6) { const a = Math.random() * Math.PI * 2, rr = Math.random() * R; ctx.particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 2, z: g.position.z + Math.sin(a) * rr, vx: (Math.random() - 0.5) * 14, vy: 18 + Math.random() * 26, vz: (Math.random() - 0.5) * 14, drag: 1.4, life: 0.8, size: 4, color: Math.random() < 0.5 ? GREEN : SICK, fade: true }); }
      },
    };
  },
});

// 亡靈大軍：召喚亡兵 + 大範圍腐蝕 (ultimate fx + 各召喚 blink fx + a.zone 毒霧)
registerVfx('necro_ultimate', {
  onCast(ctx, f, c) {
    if (f.type === 'ultimate') {
      ctx.sceneMgr.addShake(16);
      ctx.sceneMgr.addFlash(0.3, GREEN);
      ultimateBurst(ctx, c, { color: GREEN, radius: f.radius || 220, pillarH: 150, pillarR: 28, count: 40, shake: 16, flash: 0 });
    } else {
      // 每隻亡兵自地面裂出
      const TH = ctx.THREE;
      const geo = new TH.RingGeometry(14, 22, 6);
      const mat = new TH.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.85, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
      const m = new TH.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(c.x, 3, c.z);
      ctx.addTransient(m, 0.5, (mesh, t) => { mesh.scale.setScalar(0.4 + t * 0.9); mesh.material.opacity = (1 - t) * 0.85; });
      m.userData.geo = geo; m.userData.mat = mat;
      column(ctx, c, { color: [GREEN, SICK], count: 12, radius: 16, speed: 140, life: 0.5, size: 3.5 });
    }
  },
  zone(ctx, z) {
    const TH = ctx.THREE;
    const R = z.radius || 220;
    const geo = new TH.CircleGeometry(R, 32);
    const mat = new TH.MeshBasicMaterial({ color: 0x1e8449, transparent: true, opacity: 0.28, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const disc = new TH.Mesh(geo, mat); disc.rotation.x = -Math.PI / 2; disc.position.y = 1.1;
    const rGeo = new TH.RingGeometry(R * 0.9, R, 36);
    const rMat = new TH.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.5, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const rmesh = new TH.Mesh(rGeo, rMat); rmesh.rotation.x = -Math.PI / 2; rmesh.position.y = 1.3;
    const g = new TH.Group(); g.add(disc); g.add(rmesh);
    g.userData.geo = { dispose: () => { geo.dispose(); rGeo.dispose(); } };
    g.userData.mat = { dispose: () => { mat.dispose(); rMat.dispose(); } };
    return {
      object3D: g,
      update(dt) {
        rmesh.rotation.z -= dt * 0.6;
        mat.opacity = 0.22 + 0.1 * Math.sin(performance.now() / 140);
        if (Math.random() < 0.5) { const a = Math.random() * Math.PI * 2, rr = Math.random() * R; ctx.particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 2, z: g.position.z + Math.sin(a) * rr, vx: 0, vy: 22 + Math.random() * 30, vz: 0, drag: 1.3, life: 0.8, size: 4, color: SICK, fade: true }); }
      },
    };
  },
});
