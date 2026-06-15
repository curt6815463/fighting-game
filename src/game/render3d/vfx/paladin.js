// 聖騎士：黃金聖光、十字、神聖審判。錘擊金光斬 / 神聖衝鋒 / 制裁聖域 / 天堂審判光柱。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, cone, column, burst, sphereFlash, pillar, slashBlade, addShake, addFlash, ultimateBurst } from './lib.js';

const GOLD = '#ffd700';
const LIGHT = '#fff7d0';

// 大絕招 — 天堂審判：天降巨型聖光柱 + 旋繞光十字 + 持續灼燒聖域
registerVfx('paladin_ultimate', {
  onCast(ctx, f, c) {
    ctx.sceneMgr.addShake(10);
    ctx.sceneMgr.addFlash(0.3, LIGHT);
    column(ctx, c, { color: [GOLD, LIGHT], count: 30, radius: 30, speed: 200, life: 0.8 });
  },
  zone(ctx, z) {
    const TH = ctx.THREE;
    const R = z.radius || 150;
    const g = new TH.Group();
    const geos = [], mats = [];
    const reg = (geo, mat) => { geos.push(geo); mats.push(mat); };

    // 地面聖光圓盤 + 旋轉雙十字
    const discGeo = new TH.CircleGeometry(R, 36);
    const discMat = new TH.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.22, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const disc = new TH.Mesh(discGeo, discMat); disc.rotation.x = -Math.PI / 2; disc.position.y = 1.1; g.add(disc); reg(discGeo, discMat);
    const rimGeo = new TH.RingGeometry(R * 0.93, R, 40);
    const rimMat = new TH.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.8, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const rim = new TH.Mesh(rimGeo, rimMat); rim.rotation.x = -Math.PI / 2; rim.position.y = 1.3; g.add(rim); reg(rimGeo, rimMat);

    const crossMat = new TH.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.5, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const crossGrp = new TH.Group(); crossGrp.position.y = 1.5;
    const cvGeo = new TH.PlaneGeometry(R * 0.16, R * 1.7), chGeo = new TH.PlaneGeometry(R * 1.7, R * 0.16);
    const cv = new TH.Mesh(cvGeo, crossMat), ch = new TH.Mesh(chGeo, crossMat);
    cv.rotation.x = ch.rotation.x = -Math.PI / 2; crossGrp.add(cv); crossGrp.add(ch); g.add(crossGrp); reg(cvGeo, crossMat); reg(chGeo, crossMat);

    // 巨型聖光柱
    const pillarGeo = new TH.CylinderGeometry(R * 0.42, R * 0.5, 240, 24, 1, true);
    const pillarMat = new TH.MeshBasicMaterial({ color: 0xfff7d0, transparent: true, opacity: 0.0, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const beam = new TH.Mesh(pillarGeo, pillarMat); beam.position.y = 120; g.add(beam); reg(pillarGeo, pillarMat);

    g.userData.geo = { dispose: () => geos.forEach((x) => x.dispose()) };
    g.userData.mat = { dispose: () => mats.forEach((x) => x.dispose()) };
    const totalDelay = Math.max(0.0001, z.delay || 0.4);
    let landed = false;

    return {
      object3D: g,
      update(dt, zz) {
        crossGrp.rotation.y += dt * 0.5;
        rim.rotation.z -= dt * 0.6;
        if (zz.delay > 0) {
          const fill = 1 - zz.delay / totalDelay;
          pillarMat.opacity = 0.15 + 0.2 * fill;
          beam.scale.x = beam.scale.z = 0.3 + fill * 0.7;
        } else {
          if (!landed) {
            landed = true;
            const cc = { x: g.position.x, y: 16, z: g.position.z };
            ultimateBurst(ctx, cc, { color: LIGHT, radius: R, pillarH: 220, pillarR: 36, shake: 16, flash: 0.32 });
            for (let i = 0; i < 30; i++) { const a = Math.random() * Math.PI * 2, sp = 200 + Math.random() * 200; ctx.particles.spawn({ x: cc.x, y: 6, z: cc.z, vx: Math.cos(a) * sp, vy: 120 + Math.random() * 220, vz: Math.sin(a) * sp, gravity: 220, drag: 1.8, life: 0.6, size: 4 + Math.random() * 4, color: Math.random() < 0.5 ? GOLD : LIGHT, fade: true }); }
          }
          const pulse = 0.55 + 0.25 * Math.sin(performance.now() / 90);
          pillarMat.opacity = 0.32 * pulse;
          beam.scale.x = beam.scale.z = 1;
          discMat.opacity = 0.18 + 0.1 * pulse;
          // 持續飄落聖光點
          if (Math.random() < 0.5) ctx.particles.spawn({ x: g.position.x + (Math.random() - 0.5) * R * 1.6, y: 90, z: g.position.z + (Math.random() - 0.5) * R * 1.6, vx: 0, vy: -120, vz: 0, drag: 0.6, life: 0.8, size: 3.5, color: LIGHT, fade: true });
        }
      },
    };
  },
});

registerVfx('paladin_smite', {
  onCast(ctx, f, c) {
    slashBlade(ctx, c, f.facing, { color: LIGHT, len: f.range * 1.1, w: 16, swing: (f.arc || 1.4), life: 0.22 });
    slashBlade(ctx, c, f.facing, { color: GOLD, len: f.range, w: 24, swing: (f.arc || 1.4), life: 0.26 });
    cone(ctx, c, f.facing, { color: [GOLD, LIGHT, '#ffecb3'], count: 14, speed: 240, spread: (f.arc || 1.4) / 2, offset: f.range * 0.4, up: 36, life: 0.32, size: 4 });
    addFlash(ctx, 0.1, GOLD);
  },
});

registerVfx('paladin_charge', {
  onCast(ctx, f, c) {
    const TH = ctx.THREE;
    ring(ctx, c, { color: GOLD, from: 10, to: 96, life: 0.4, y: 2, alpha: 0.85, ease: true });
    sphereFlash(ctx, c, { color: LIGHT, from: 8, to: 46, life: 0.3, alpha: 0.85 });
    cone(ctx, c, f.facing, { color: [GOLD, '#ffecb3'], count: 16, speed: 360, spread: 0.4, offset: 30, life: 0.4, size: 4 });
    // 前衝聖光十字盾
    const shGeo = new TH.PlaneGeometry(40, 52);
    const shMat = new TH.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.75, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const sh = new TH.Mesh(shGeo, shMat);
    sh.position.set(c.x + Math.cos(f.facing) * 24, 20, c.z + Math.sin(f.facing) * 24); sh.rotation.y = -f.facing + Math.PI / 2;
    ctx.addTransient(sh, 0.34, (m, t) => { m.material.opacity = (1 - t) * 0.75; m.scale.setScalar(1 + t * 0.4); });
    sh.userData.geo = shGeo; sh.userData.mat = shMat;
    addShake(ctx, 6);
  },
});

registerVfx('paladin_sanction', {
  zone(ctx, z) {
    const TH = ctx.THREE;
    const R = z.radius || 170;
    const g = new TH.Group();
    const discGeo = new TH.CircleGeometry(R, 32);
    const discMat = new TH.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.4, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const disc = new TH.Mesh(discGeo, discMat); disc.rotation.x = -Math.PI / 2; disc.position.y = 1.2; g.add(disc);
    g.userData.geo = discGeo; g.userData.mat = discMat;
    let first = true;
    return {
      object3D: g,
      update(dt, zz) {
        if (first) {
          first = false;
          const cc = { x: g.position.x, y: 6, z: g.position.z };
          ring(ctx, cc, { color: GOLD, from: 14, to: R * 1.05, life: 0.5, y: 3, alpha: 0.95, ease: true });
          ring(ctx, cc, { color: LIGHT, from: 8, to: R * 0.7, life: 0.4, y: 6, alpha: 0.8 });
          column(ctx, cc, { color: [GOLD, LIGHT], count: 22, radius: R * 0.5, speed: 170, life: 0.6 });
          sphereFlash(ctx, cc, { color: LIGHT, from: 8, to: R * 0.6, life: 0.3, alpha: 0.9 });
          addShake(ctx, 7); addFlash(ctx, 0.14, GOLD);
        }
        const a = zz.lifetime > 0 ? Math.min(1, zz.lifetime / 0.5) : 0;
        discMat.opacity = 0.4 * a;
      },
    };
  },
});
