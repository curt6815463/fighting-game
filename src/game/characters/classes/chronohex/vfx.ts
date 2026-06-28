// @ts-nocheck
// 時厄術士：靛紫詛咒 × 青藍時光。時咒彈 / 時間加速 / 時停咒域 / 時空崩咒。
import * as THREE from 'three';
import { registerVfx } from '../../../render3d/vfx/registry.js';
import { ring, burst, column, sphereFlash, addShake, addFlash, ultimateBurst } from '../../../render3d/vfx/lib.js';

const CYAN = '#00bcd4';
const ICE = '#9af2ff';
const PURPLE = '#9b59b6';
const VIOLET = '#bb6bd9';
const INDIGO = '#7c5cff';

// 時咒彈：旋轉的紫晶核 + 青藍時環
registerVfx('chronohex_bolt', {
  projectile(ctx, pr) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const coreGeo = new TH.OctahedronGeometry(pr.radius, 0);
    const coreMat = new TH.MeshStandardMaterial({ color: 0xe6c2ff, emissive: 0x8e44ad, emissiveIntensity: 3.0, roughness: 0.3 });
    const core = new TH.Mesh(coreGeo, coreMat); g.add(core);
    const ringGeo = new TH.TorusGeometry(pr.radius * 1.8, pr.radius * 0.3, 6, 16);
    const ringMat = new TH.MeshBasicMaterial({ color: 0x4dd0e1, transparent: true, opacity: 0.7, blending: TH.AdditiveBlending, depthWrite: false });
    const r = new TH.Mesh(ringGeo, ringMat); r.rotation.x = Math.PI / 2; g.add(r);
    g.userData.geo = { dispose: () => { coreGeo.dispose(); ringGeo.dispose(); } };
    g.userData.mat = { dispose: () => { coreMat.dispose(); ringMat.dispose(); } };
    return {
      object3D: g,
      update(dt) {
        core.rotation.y += dt * 6; core.rotation.x += dt * 3; r.rotation.z += dt * 5;
        if (Math.random() < 0.6) ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18, vz: (Math.random() - 0.5) * 18, life: 0.35, size: pr.radius * 1.1, color: Math.random() < 0.5 ? VIOLET : ICE, drag: 3, fade: true });
      },
    };
  },
  onHit(ctx, f, c) {
    ring(ctx, c, { color: VIOLET, from: 6, to: (f.radius || 12) * 2.3, life: 0.32, y: 6, alpha: 0.85 });
    burst(ctx, c, { color: [PURPLE, ICE, CYAN], count: 12, speed: 150, life: 0.4, size: 3 });
  },
});

// 時間加速：青藍加速光環 + 紫色詛咒催熟脈衝
registerVfx('chronohex_accel', {
  onCast(ctx, f, c) {
    const R = f.radius || 320;
    ring(ctx, c, { color: CYAN, from: 12, to: R * 0.6, life: 0.6, y: 4, alpha: 0.75, ease: true });
    ring(ctx, c, { color: VIOLET, from: 8, to: R * 0.45, life: 0.5, y: 7, alpha: 0.7 });
    column(ctx, c, { color: [CYAN, ICE, VIOLET], count: 26, radius: 36, speed: 200, life: 0.8, size: 4 });
    sphereFlash(ctx, c, { color: ICE, from: 8, to: 56, life: 0.3, alpha: 0.8 });
    addFlash(ctx, 0.14, INDIGO);
  },
});

// 時停咒域：青藍時停球罩 + 紫色詛咒地盤
registerVfx('chronohex_field', {
  onCast(ctx, f, c) {
    ring(ctx, c, { color: VIOLET, from: 10, to: (f.radius || 180) * 0.8, life: 0.5, y: 4, alpha: 0.7, ease: true });
    burst(ctx, c, { color: [PURPLE, CYAN], count: 16, speed: 120, up: 20, life: 0.5, size: 3 });
  },
  zone(ctx, z) {
    const TH = ctx.THREE;
    const R = z.radius || 160;
    const g = new TH.Group();
    // 半透明時停球罩(青)
    const domeGeo = new TH.SphereGeometry(R, 20, 14);
    const domeMat = new TH.MeshBasicMaterial({ color: 0x00bcd4, transparent: true, opacity: 0.14, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const dome = new TH.Mesh(domeGeo, domeMat); dome.scale.y = 0.7; dome.position.y = R * 0.35; g.add(dome);
    // 詛咒地盤(紫)
    const discGeo = new TH.CircleGeometry(R, 30);
    const discMat = new TH.MeshBasicMaterial({ color: 0x8e44ad, transparent: true, opacity: 0.3, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const disc = new TH.Mesh(discGeo, discMat); disc.rotation.x = -Math.PI / 2; disc.position.y = 1.2; g.add(disc);
    const rGeo = new TH.RingGeometry(R * 0.9, R, 36);
    const rMat = new TH.MeshBasicMaterial({ color: 0x4dd0e1, transparent: true, opacity: 0.5, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const rmesh = new TH.Mesh(rGeo, rMat); rmesh.rotation.x = -Math.PI / 2; rmesh.position.y = 1.4; g.add(rmesh);
    g.userData.geo = { dispose: () => { domeGeo.dispose(); discGeo.dispose(); rGeo.dispose(); } };
    g.userData.mat = { dispose: () => { domeMat.dispose(); discMat.dispose(); rMat.dispose(); } };
    let first = true;
    return {
      object3D: g,
      update(dt) {
        rmesh.rotation.z += dt * 0.8;
        if (first) { first = false; const cc = { x: g.position.x, y: 8, z: g.position.z }; ring(ctx, cc, { color: ICE, from: 14, to: R * 1.1, life: 0.5, y: 4, alpha: 0.9, ease: true }); sphereFlash(ctx, cc, { color: CYAN, from: 10, to: R * 0.7, life: 0.34, alpha: 0.8 }); addShake(ctx, 7); addFlash(ctx, 0.16, INDIGO); }
        const a = z.lifetime > 0 ? 1 : 0;
        const pulse = (0.22 + 0.08 * Math.sin(performance.now() / 160)) * a;
        discMat.opacity = pulse; domeMat.opacity = 0.14 * a;
        if (Math.random() < 0.3) { const ang = Math.random() * Math.PI * 2, rr = Math.random() * R; ctx.particles.spawn({ x: g.position.x + Math.cos(ang) * rr, y: 2, z: g.position.z + Math.sin(ang) * rr, vx: 0, vy: 26 + Math.random() * 22, vz: 0, drag: 1.2, life: 0.6, size: 3, color: Math.random() < 0.5 ? VIOLET : ICE, fade: true }); }
      },
    };
  },
});

// 時空崩咒：大範圍紫青爆 + 符文牢籠 + 回溯殘影
registerVfx('chronohex_ultimate', {
  onCast(ctx, f, c) {
    if (f.type === 'ultimate') {
      const R = f.radius || 260;
      ctx.sceneMgr.addShake(18);
      ctx.sceneMgr.addFlash(0.36, INDIGO);
      ultimateBurst(ctx, c, { color: PURPLE, radius: R, pillarH: 175, pillarR: 30, count: 46, shake: 18, flash: 0 });
      ring(ctx, c, { color: CYAN, from: 30, to: R * 1.3, life: 0.8, y: 3, alpha: 0.6, inner: 0.92, ease: true });
      sphereFlash(ctx, c, { color: '#e6c2ff', from: 10, to: R * 0.5, life: 0.36, alpha: 0.85 });
      // 環繞符文牢籠(紫) + 旋繞時鐘殘影(青)
      const TH = ctx.THREE;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const geo = new TH.BoxGeometry(2.4, 70, 2.4);
        const mat = new TH.MeshBasicMaterial({ color: 0xbb6bd9, transparent: true, opacity: 0.8, blending: TH.AdditiveBlending, depthWrite: false });
        const bar = new TH.Mesh(geo, mat);
        bar.position.set(c.x + Math.cos(a) * R * 0.7, 35, c.z + Math.sin(a) * R * 0.7);
        ctx.addTransient(bar, 0.7, (m, t) => { m.material.opacity = (1 - t) * 0.8; m.scale.y = 1 - t * 0.5; });
        bar.userData.geo = geo; bar.userData.mat = mat;
      }
      for (let i = 0; i < 3; i++) {
        const geo = new TH.RingGeometry(40 + i * 30, 44 + i * 30, 36);
        const mat = new TH.MeshBasicMaterial({ color: 0x9af2ff, transparent: true, opacity: 0.65, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
        const r = new TH.Mesh(geo, mat); r.rotation.x = -Math.PI / 2; r.position.set(c.x, 4 + i * 2, c.z);
        ctx.addTransient(r, 0.7, (m, t) => { m.rotation.z = (i % 2 ? 1 : -1) * t * 4; m.material.opacity = (1 - t) * 0.65; });
        r.userData.geo = geo; r.userData.mat = mat;
      }
    } else {
      // 回溯殘影 (rewindSelf → type 'blink')
      sphereFlash(ctx, c, { color: ICE, from: 6, to: 56, life: 0.4, alpha: 0.9 });
      ring(ctx, c, { color: CYAN, from: 8, to: 90, life: 0.5, y: 5, alpha: 0.85, ease: true });
      column(ctx, c, { color: [CYAN, ICE, VIOLET], count: 22, radius: 26, speed: 220, life: 0.7, size: 4 });
    }
  },
});
