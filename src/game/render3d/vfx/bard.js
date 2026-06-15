// 吟遊詩人：玫瑰品紅、音符、聲波。音波衝擊 / 激昂戰歌 / 不諧和音 / 英雄頌歌。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, burst, column, sphereFlash, addShake, addFlash, ultimateBurst } from './lib.js';

const PINK = '#ff4081';
const ROSE = '#ff8fb8';

// 音波衝擊：飛行的發光音符
registerVfx('bard_note', {
  projectile(ctx, pr) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const headGeo = new TH.SphereGeometry(pr.radius * 1.1, 10, 8);
    const mat = new TH.MeshStandardMaterial({ color: 0xffe3ef, emissive: 0xff4081, emissiveIntensity: 2.8, roughness: 0.3 });
    const head = new TH.Mesh(headGeo, mat); head.position.set(0, -pr.radius * 0.6, 0); g.add(head);
    const stemGeo = new TH.BoxGeometry(pr.radius * 0.3, pr.radius * 3, pr.radius * 0.3);
    const stem = new TH.Mesh(stemGeo, mat); stem.position.set(pr.radius * 0.8, pr.radius * 0.6, 0); g.add(stem);
    g.userData.geo = { dispose: () => { headGeo.dispose(); stemGeo.dispose(); } };
    g.userData.mat = mat;
    return {
      object3D: g,
      update(dt) {
        g.rotation.z = Math.sin(performance.now() / 120) * 0.3;
        if (Math.random() < 0.5) ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20, vz: (Math.random() - 0.5) * 20, life: 0.3, size: pr.radius, color: ROSE, drag: 3, fade: true });
      },
    };
  },
  onHit(ctx, f, c) {
    ring(ctx, c, { color: ROSE, from: 5, to: (f.radius || 12) * 2.4, life: 0.3, y: 6, alpha: 0.8 });
    burst(ctx, c, { color: [PINK, ROSE, '#ffffff'], count: 12, speed: 150, life: 0.4, size: 3 });
  },
});

// 激昂戰歌：上升的金粉音符與品紅光環 (友方增傷)
registerVfx('bard_anthem', {
  onCast(ctx, f, c) {
    const R = f.radius || 300;
    ring(ctx, c, { color: PINK, from: 12, to: R * 0.6, life: 0.6, y: 4, alpha: 0.8, ease: true });
    ring(ctx, c, { color: '#ffd76a', from: 8, to: R * 0.4, life: 0.5, y: 7, alpha: 0.7 });
    column(ctx, c, { color: [PINK, ROSE, '#ffd76a'], count: 30, radius: 40, speed: 180, life: 0.9, size: 4 });
    sphereFlash(ctx, c, { color: '#ffe3ef', from: 8, to: 60, life: 0.3, alpha: 0.85 });
    addFlash(ctx, 0.16, PINK);
    // 上飄音符粒子
    for (let i = 0; i < 14; i++) { const a = Math.random() * Math.PI * 2, rr = Math.random() * 50; ctx.particles.spawn({ x: c.x + Math.cos(a) * rr, y: 2, z: c.z + Math.sin(a) * rr, vx: 0, vy: 120 + Math.random() * 100, vz: 0, drag: 0.5, life: 1.0, size: 4.5, color: Math.random() < 0.5 ? PINK : '#ffd76a', fade: true }); }
  },
});

// 不諧和音：貫穿的聲波刃
registerVfx('bard_discord', {
  projectile(ctx, pr) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const mat = new TH.MeshBasicMaterial({ color: 0xff4081, transparent: true, opacity: 0.85, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const geos = [];
    for (let i = 0; i < 3; i++) {
      const geo = new TH.TorusGeometry(pr.radius * (1.4 + i * 0.7), pr.radius * 0.18, 6, 18, Math.PI);
      const arc = new TH.Mesh(geo, mat); arc.rotation.y = Math.PI / 2; arc.position.x = -i * pr.radius * 0.8; g.add(arc); geos.push(geo);
    }
    g.userData.geo = { dispose: () => geos.forEach((x) => x.dispose()) };
    g.userData.mat = mat;
    return { object3D: g, update() {} };
  },
  onHit(ctx, f, c) {
    sphereFlash(ctx, c, { color: ROSE, from: 5, to: 40, life: 0.24, alpha: 0.9 });
    burst(ctx, c, { color: [PINK, '#ffffff'], count: 14, speed: 200, life: 0.4, size: 3.2 });
    addShake(ctx, 4);
  },
});

// 英雄頌歌：全隊頌歌爆發 + 旋繞彩光音符
registerVfx('bard_ultimate', {
  onCast(ctx, f, c) {
    const R = f.radius || 180;
    ctx.sceneMgr.addShake(14);
    ctx.sceneMgr.addFlash(0.32, PINK);
    ultimateBurst(ctx, c, { color: PINK, radius: R, pillarH: 180, pillarR: 30, count: 44, shake: 14, flash: 0 });
    // 旋繞的彩光音符環
    const TH = ctx.THREE;
    const cols = [0xff4081, 0xffd76a, 0x4dd0e1, 0x7bed9f];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const geo = new TH.SphereGeometry(4, 8, 6);
      const mat = new TH.MeshStandardMaterial({ color: cols[i % cols.length], emissive: cols[i % cols.length], emissiveIntensity: 2.6, roughness: 0.3 });
      const note = new TH.Mesh(geo, mat);
      ctx.addTransient(note, 0.8, (m, t) => {
        const rr = 20 + t * R * 0.9, ang = a + t * 3;
        m.position.set(c.x + Math.cos(ang) * rr, 10 + t * 70, c.z + Math.sin(ang) * rr);
        m.material.opacity = (1 - t);
      });
      note.userData.geo = geo; note.userData.mat = mat;
    }
  },
});
