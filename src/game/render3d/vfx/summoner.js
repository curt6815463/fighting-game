// 召喚師：青綠靈魂、召喚陣、靈球。靈魂碎片 / 召喚戰靈 / 靈魂爆破 / 大召喚術。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, burst, column, sphereFlash, addShake, addFlash, ultimateBurst } from './lib.js';

const TEAL = '#1abc9c';
const MINT = '#6ffadf';

function summonCircle(ctx, c, R, color) {
  const TH = ctx.THREE;
  const geo = new TH.RingGeometry(R * 0.7, R, 6); // 六角召喚陣
  const mat = new TH.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
  const m = new TH.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(c.x, 3, c.z);
  ctx.addTransient(m, 0.6, (mesh, t) => { mesh.rotation.z = t * 2; mesh.scale.setScalar(0.4 + t * 0.8); mesh.material.opacity = (1 - t) * 0.9; });
  m.userData.geo = geo; m.userData.mat = mat;
}

// 靈魂碎片：追蹤的青綠靈魂彈
registerVfx('summoner_shard', {
  projectile(ctx, pr) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const geo = new TH.TetrahedronGeometry(pr.radius * 1.3);
    const mat = new TH.MeshStandardMaterial({ color: 0xd6fff5, emissive: 0x16a085, emissiveIntensity: 3.0, roughness: 0.3 });
    const core = new TH.Mesh(geo, mat); g.add(core);
    g.userData.geo = geo; g.userData.mat = mat;
    return {
      object3D: g,
      update(dt) {
        core.rotation.y += dt * 6; core.rotation.x += dt * 4;
        if (Math.random() < 0.6) ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18 + 10, vz: (Math.random() - 0.5) * 18, life: 0.4, size: pr.radius, color: MINT, drag: 2.4, fade: true });
      },
    };
  },
  onHit(ctx, f, c) {
    ring(ctx, c, { color: MINT, from: 5, to: (f.radius || 11) * 2.2, life: 0.3, y: 6, alpha: 0.8 });
    burst(ctx, c, { color: [TEAL, MINT], count: 10, speed: 140, life: 0.4, size: 3 });
  },
});

// 召喚戰靈：青綠召喚陣升起
registerVfx('summoner_summon', {
  onCast(ctx, f, c) {
    summonCircle(ctx, c, 40, 0x2ee6c0);
    column(ctx, c, { color: [TEAL, MINT], count: 18, radius: 22, speed: 160, life: 0.6, size: 4 });
    sphereFlash(ctx, c, { color: MINT, from: 6, to: 42, life: 0.3, alpha: 0.85 });
    addFlash(ctx, 0.12, TEAL);
  },
});

// 靈魂爆破：召喚物原地爆裂
registerVfx('summoner_burst', {
  onHit(ctx, f, c) {
    const R = f.radius || 130;
    sphereFlash(ctx, c, { color: MINT, from: 8, to: R * 0.7, life: 0.3, alpha: 0.95 });
    ring(ctx, c, { color: TEAL, from: 10, to: R, life: 0.45, y: 5, alpha: 0.85, ease: true });
    burst(ctx, c, { color: [TEAL, MINT, '#ffffff'], count: 30, speed: 280, up: 50, life: 0.55, size: 4 });
    addShake(ctx, 8); addFlash(ctx, 0.2, TEAL);
  },
});

// 大召喚術：巨型召喚陣 + 多重戰靈降臨
registerVfx('summoner_ultimate', {
  onCast(ctx, f, c) {
    if (f.type === 'ultimate') {
      ctx.sceneMgr.addShake(16);
      ctx.sceneMgr.addFlash(0.32, TEAL);
      ultimateBurst(ctx, c, { color: TEAL, radius: f.radius || 160, pillarH: 170, pillarR: 30, count: 42, shake: 16, flash: 0 });
      summonCircle(ctx, c, 130, 0x2ee6c0);
    } else {
      // 每隻戰靈的小召喚陣
      summonCircle(ctx, c, 44, 0x2ee6c0);
      column(ctx, c, { color: [TEAL, MINT], count: 14, radius: 20, speed: 180, life: 0.6, size: 4 });
      sphereFlash(ctx, c, { color: MINT, from: 6, to: 46, life: 0.3, alpha: 0.85 });
    }
  },
});
