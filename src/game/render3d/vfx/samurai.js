// 武士：緋紅刀光、居合、櫻花。拔刀斬 / 居合·閃 / 刀背擋 / 一閃·千刀流。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, cone, burst, sphereFlash, slashBlade, addShake, addFlash, ultimateBurst } from './lib.js';

const CRIMSON = '#ff3b2f';
const BLADE = '#ffffff';

function petals(ctx, c, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 120;
    ctx.particles.spawn({ x: c.x, y: 8 + Math.random() * 20, z: c.z, vx: Math.cos(a) * sp, vy: 20 + Math.random() * 60, vz: Math.sin(a) * sp, gravity: 90, drag: 1.6, life: 0.7 + Math.random() * 0.4, size: 3 + Math.random() * 2.5, color: Math.random() < 0.5 ? '#ff8a8a' : CRIMSON, fade: true });
  }
}

// 拔刀斬：銳利的緋白居合刀光
registerVfx('samurai_draw', {
  onCast(ctx, f, c) {
    slashBlade(ctx, c, f.facing, { color: BLADE, len: f.range * 1.18, w: 12, swing: (f.arc || 1.0), life: 0.18 });
    slashBlade(ctx, c, f.facing, { color: CRIMSON, len: f.range, w: 6, swing: (f.arc || 1.0) * 0.9, life: 0.24 });
    cone(ctx, c, f.facing, { color: [CRIMSON, '#ff8a8a', BLADE], count: 12, speed: 300, spread: (f.arc || 1.0) / 2.4, offset: f.range * 0.5, life: 0.3, size: 3.5 });
    petals(ctx, c, 6);
  },
});

// 居合·閃：高速突進的一文字刀光
registerVfx('samurai_iai', {
  onCast(ctx, f, c) {
    const TH = ctx.THREE;
    // 一文字刀光帶
    const len = (f.range || 180) * 1.1;
    const geo = new TH.PlaneGeometry(len, 16);
    const mat = new TH.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const slash = new TH.Mesh(geo, mat);
    slash.position.set(c.x + Math.cos(f.facing) * len * 0.4, 18, c.z + Math.sin(f.facing) * len * 0.4);
    slash.rotation.x = -Math.PI / 2; slash.rotation.z = f.facing;
    ctx.addTransient(slash, 0.26, (m, t) => { m.material.opacity = (1 - t) * 0.95; m.scale.y = 1 - t * 0.7; });
    slash.userData.geo = geo; slash.userData.mat = mat;
    ring(ctx, c, { color: CRIMSON, from: 8, to: 70, life: 0.34, y: 3, alpha: 0.8 });
    cone(ctx, c, f.facing, { color: [BLADE, CRIMSON], count: 18, speed: 420, spread: 0.16, life: 0.3, size: 3.5 });
    petals(ctx, c, 8);
    addShake(ctx, 6);
  },
});

// 刀背擋：緋紅格擋立場
registerVfx('samurai_guard', {
  onCast(ctx, f, c) {
    const TH = ctx.THREE;
    ring(ctx, c, { color: CRIMSON, from: 10, to: 60, life: 0.4, y: 4, alpha: 0.85, ease: true });
    sphereFlash(ctx, c, { color: '#ff8a8a', from: 6, to: 40, life: 0.28, alpha: 0.8 });
    // 前方刀牆
    const geo = new TH.PlaneGeometry(44, 44);
    const mat = new TH.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0.5, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const wall = new TH.Mesh(geo, mat);
    wall.position.set(c.x + Math.cos(f.facing) * 22, 20, c.z + Math.sin(f.facing) * 22); wall.rotation.y = -f.facing + Math.PI / 2;
    ctx.addTransient(wall, 0.5, (m, t) => { m.material.opacity = 0.5 * (1 - t); });
    wall.userData.geo = geo; wall.userData.mat = mat;
  },
});

// 一閃·千刀流：對群敵連續居合斬
registerVfx('samurai_ultimate', {
  onCast(ctx, f, c) {
    if (f.type === 'ultimate') {
      ctx.sceneMgr.addShake(16);
      ctx.sceneMgr.addFlash(0.34, CRIMSON);
      ultimateBurst(ctx, c, { color: CRIMSON, radius: f.radius || 150, pillarH: 150, pillarR: 24, count: 36, shake: 16, flash: 0 });
      petals(ctx, c, 24);
    } else {
      // 每個瞬移斬擊點：交叉緋白刀光
      slashBlade(ctx, c, f.facing, { color: BLADE, len: 90, w: 14, swing: 2.0, life: 0.2 });
      slashBlade(ctx, c, f.facing + Math.PI, { color: CRIMSON, len: 80, w: 8, swing: -2.0, life: 0.2 });
      sphereFlash(ctx, c, { color: BLADE, from: 5, to: 46, life: 0.2, alpha: 0.9 });
      burst(ctx, c, { color: [CRIMSON, '#ff8a8a', BLADE], count: 16, speed: 240, life: 0.4, size: 3.2 });
      petals(ctx, c, 5);
      addShake(ctx, 5);
    }
  },
});
