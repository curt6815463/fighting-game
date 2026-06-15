// 時空術士：青藍時光、齒輪、停滯。時空裂隙 / 時間加速 / 時間停滯 / 時空逆轉。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, burst, column, sphereFlash, addShake, addFlash, ultimateBurst } from './lib.js';

const CYAN = '#00bcd4';
const ICE = '#9af2ff';

// 時空裂隙：旋轉的青藍時鐘彈
registerVfx('chrono_rift', {
  projectile(ctx, pr) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const geo = new TH.TorusGeometry(pr.radius, pr.radius * 0.32, 6, 16);
    const mat = new TH.MeshStandardMaterial({ color: 0xd6fbff, emissive: 0x00bcd4, emissiveIntensity: 3.0, roughness: 0.3, metalness: 0.4 });
    const r = new TH.Mesh(geo, mat); g.add(r);
    const coreGeo = new TH.SphereGeometry(pr.radius * 0.5, 8, 6);
    const core = new TH.Mesh(coreGeo, mat); g.add(core);
    g.userData.geo = { dispose: () => { geo.dispose(); coreGeo.dispose(); } };
    g.userData.mat = mat;
    return {
      object3D: g,
      update(dt) {
        r.rotation.y += dt * 8; r.rotation.x += dt * 3;
        if (Math.random() < 0.5) ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 16, vz: (Math.random() - 0.5) * 16, life: 0.35, size: pr.radius, color: ICE, drag: 3, fade: true });
      },
    };
  },
  onHit(ctx, f, c) {
    ring(ctx, c, { color: ICE, from: 5, to: (f.radius || 12) * 2.4, life: 0.34, y: 6, alpha: 0.85 });
    burst(ctx, c, { color: [CYAN, ICE], count: 12, speed: 140, life: 0.4, size: 3 });
  },
});

// 時間加速：友方青藍加速光環
registerVfx('chrono_haste', {
  onCast(ctx, f, c) {
    const R = f.radius || 300;
    ring(ctx, c, { color: CYAN, from: 12, to: R * 0.6, life: 0.6, y: 4, alpha: 0.75, ease: true });
    ring(ctx, c, { color: ICE, from: 8, to: R * 0.4, life: 0.5, y: 7, alpha: 0.7 });
    column(ctx, c, { color: [CYAN, ICE, '#ffffff'], count: 26, radius: 36, speed: 200, life: 0.8, size: 4 });
    sphereFlash(ctx, c, { color: ICE, from: 8, to: 56, life: 0.3, alpha: 0.8 });
    addFlash(ctx, 0.14, CYAN);
  },
});

// 時間停滯：青藍時停泡 + 凍結齒輪
registerVfx('chrono_stasis', {
  zone(ctx, z) {
    const TH = ctx.THREE;
    const R = z.radius || 140;
    const g = new TH.Group();
    // 半透明時停球罩
    const domeGeo = new TH.SphereGeometry(R, 20, 14);
    const domeMat = new TH.MeshBasicMaterial({ color: 0x00bcd4, transparent: true, opacity: 0.16, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const dome = new TH.Mesh(domeGeo, domeMat); dome.scale.y = 0.7; dome.position.y = R * 0.35; g.add(dome);
    const discGeo = new TH.CircleGeometry(R, 28);
    const discMat = new TH.MeshBasicMaterial({ color: 0x9af2ff, transparent: true, opacity: 0.35, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const disc = new TH.Mesh(discGeo, discMat); disc.rotation.x = -Math.PI / 2; disc.position.y = 1.2; g.add(disc);
    g.userData.geo = { dispose: () => { domeGeo.dispose(); discGeo.dispose(); } };
    g.userData.mat = { dispose: () => { domeMat.dispose(); discMat.dispose(); } };
    let first = true;
    return {
      object3D: g,
      update() {
        if (first) { first = false; const cc = { x: g.position.x, y: 8, z: g.position.z }; ring(ctx, cc, { color: ICE, from: 14, to: R * 1.1, life: 0.5, y: 4, alpha: 0.9, ease: true }); sphereFlash(ctx, cc, { color: CYAN, from: 10, to: R * 0.7, life: 0.34, alpha: 0.8 }); addShake(ctx, 8); addFlash(ctx, 0.18, CYAN); }
        const a = z.lifetime > 0 ? 1 : 0;
        domeMat.opacity = 0.16 * a; discMat.opacity = 0.3 * a;
      },
    };
  },
});

// 時空逆轉：在原地引爆 + 自身殘影回溯
registerVfx('chrono_ultimate', {
  onCast(ctx, f, c) {
    if (f.type === 'ultimate') {
      ctx.sceneMgr.addShake(18);
      ctx.sceneMgr.addFlash(0.36, CYAN);
      ultimateBurst(ctx, c, { color: CYAN, radius: f.radius || 170, pillarH: 180, pillarR: 30, count: 44, shake: 18, flash: 0 });
      // 旋繞時鐘殘影
      const TH = ctx.THREE;
      for (let i = 0; i < 3; i++) {
        const geo = new TH.RingGeometry(40 + i * 30, 44 + i * 30, 36);
        const mat = new TH.MeshBasicMaterial({ color: 0x9af2ff, transparent: true, opacity: 0.7, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
        const r = new TH.Mesh(geo, mat); r.rotation.x = -Math.PI / 2; r.position.set(c.x, 4 + i * 2, c.z);
        ctx.addTransient(r, 0.7, (m, t) => { m.rotation.z = (i % 2 ? 1 : -1) * t * 4; m.material.opacity = (1 - t) * 0.7; });
        r.userData.geo = geo; r.userData.mat = mat;
      }
    } else {
      // 回溯殘影 (type 'blink')
      sphereFlash(ctx, c, { color: ICE, from: 6, to: 56, life: 0.4, alpha: 0.9 });
      ring(ctx, c, { color: CYAN, from: 8, to: 90, life: 0.5, y: 5, alpha: 0.85, ease: true });
      column(ctx, c, { color: [CYAN, ICE, '#ffffff'], count: 22, radius: 26, speed: 220, life: 0.7, size: 4 });
    }
  },
});
