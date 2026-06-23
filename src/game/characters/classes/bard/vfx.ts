// @ts-nocheck
// 吟遊詩人：玫瑰品紅、音符、聲波。音波衝擊 / 激昂戰歌 / 不諧和音 / 英雄頌歌。
import * as THREE from 'three';
import { registerVfx } from '../../../render3d/vfx/registry.js';
import { ring, burst, column, sphereFlash, addShake, addFlash, ultimateBurst } from '../../../render3d/vfx/lib.js';

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
    const R = f.allyRadius || 300;
    ring(ctx, c, { color: PINK, from: R, to: R, inner: 0.98, life: 0.8, y: 3.5, alpha: 0.85 });
    ring(ctx, c, { color: PINK, from: 12, to: R, life: 0.6, y: 4, alpha: 0.6, ease: true });
    ring(ctx, c, { color: '#ffd76a', from: 8, to: R * 0.4, life: 0.5, y: 7, alpha: 0.7 });
    column(ctx, c, { color: [PINK, ROSE, '#ffd76a'], count: 30, radius: 40, speed: 180, life: 0.9, size: 4 });
    sphereFlash(ctx, c, { color: '#ffe3ef', from: 8, to: 60, life: 0.3, alpha: 0.85 });
    addFlash(ctx, 0.16, PINK);
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
    return {
      object3D: g,
      update(dt) {
        // Sonic vibration: oscillate scale and add a subtle wobble
        const freq = performance.now() * 0.035;
        g.scale.set(1.0, 1.0 + 0.12 * Math.sin(freq), 1.0 + 0.12 * Math.cos(freq));
        
        if (Math.random() < 0.45) {
          ctx.particles.spawn({
            x: g.position.x + (Math.random() - 0.5) * pr.radius * 0.4,
            y: g.position.y + (Math.random() - 0.5) * pr.radius * 0.4,
            z: g.position.z + (Math.random() - 0.5) * pr.radius * 0.4,
            vx: -pr.vx * 0.12 + (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            vz: -pr.vy * 0.12 + (Math.random() - 0.5) * 30,
            life: 0.38,
            size: pr.radius * 0.28,
            color: Math.random() < 0.6 ? '#ff4081' : '#ffd76a',
            drag: 1.6,
            fade: true
          });
        }
      }
    };
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
    const AR = f.allyRadius || R;
    ctx.sceneMgr.addShake(14);
    ctx.sceneMgr.addFlash(0.32, PINK);
    ultimateBurst(ctx, c, { color: PINK, radius: R, pillarH: 180, pillarR: 30, count: 44, shake: 14, flash: 0 });
    ring(ctx, c, { color: PINK, from: AR, to: AR, inner: 0.98, life: 0.9, y: 3.5, alpha: 0.9 });
    ring(ctx, c, { color: '#ffd76a', from: R, to: AR, life: 0.7, y: 4, alpha: 0.7, ease: true });

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
  zone(ctx, z) {
    const THREE = ctx.THREE;
    const g = new THREE.Group();
    const R = z.radius || 250;
    const color = new THREE.Color(z.color || '#ff4081');
    const geos = [];
    const mats = [];

    // 1. 地面雙重聲波波紋
    const ringGeo = new THREE.RingGeometry(R * 0.95, R, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 1.1;
    g.add(ringMesh);
    geos.push(ringGeo);
    mats.push(ringMat);

    const innerRingGeo = new THREE.RingGeometry(R * 0.48, R * 0.5, 32);
    const innerRingMesh = new THREE.Mesh(innerRingGeo, ringMat);
    innerRingMesh.rotation.x = -Math.PI / 2;
    innerRingMesh.position.y = 1.15;
    g.add(innerRingMesh);
    geos.push(innerRingGeo);

    // 2. 旋轉音符球體
    const noteGeo = new THREE.SphereGeometry(4, 8, 6);
    geos.push(noteGeo);
    const noteCols = [0xff4081, 0xffd76a, 0xff8fb8];
    const notes = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const noteMat = new THREE.MeshStandardMaterial({
        color: noteCols[i % noteCols.length],
        emissive: noteCols[i % noteCols.length],
        emissiveIntensity: 2.2,
        roughness: 0.3,
        transparent: true,
        opacity: 0.8
      });
      mats.push(noteMat);
      const nm = new THREE.Mesh(noteGeo, noteMat);
      g.add(nm);
      notes.push({ mesh: nm, angle, radius: R * (0.3 + 0.6 * (i / 6)), height: 6 + Math.random() * 12, speed: 1.8 + Math.random() * 1.2 });
    }

    // 3. 中央旋轉音律光柱 (酷炫炫彩光環/光柱效果)
    const pillarGeo = new THREE.CylinderGeometry(18, 24, 150, 16, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xff4081,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
    pillarMesh.position.y = 75;
    g.add(pillarMesh);
    geos.push(pillarGeo);
    mats.push(pillarMat);

    g.userData.geo = { dispose: () => geos.forEach(geo => geo.dispose()) };
    g.userData.mat = { dispose: () => mats.forEach(mat => mat.dispose()) };

    let age = 0;
    let timeAcc = 0;
    return {
      object3D: g,
      update(dt) {
        age += dt;
        ringMesh.rotation.z = age * 0.45;
        innerRingMesh.rotation.z = -age * 0.6;

        notes.forEach((n) => {
          n.angle += dt * n.speed;
          const curR = n.radius * (0.95 + 0.05 * Math.sin(age * 2.5 + n.angle));
          n.mesh.position.set(Math.cos(n.angle) * curR, n.height + Math.sin(age * 3.5 + n.angle) * 3, Math.sin(n.angle) * curR);
        });

        // 光柱旋轉與微幅呼吸脈動
        pillarMesh.rotation.y += dt * 1.6;
        pillarMesh.scale.x = 1.0 + 0.12 * Math.sin(age * 6.5);
        pillarMesh.scale.z = 1.0 + 0.12 * Math.sin(age * 6.5);

        const remaining = Math.max(0, z.lifetime / (age + z.lifetime));
        ringMat.opacity = 0.5 * remaining * (0.7 + 0.3 * Math.sin(age * 5));
        pillarMat.opacity = 0.35 * remaining * (0.85 + 0.15 * Math.sin(age * 12));
        mats.forEach((mat) => {
          if (mat !== ringMat && mat !== pillarMat) mat.opacity = 0.8 * remaining;
        });

        // 持續產生由內向外擴散的金色/粉色粒子流
        timeAcc += dt;
        const rate = 0.035; // 更密集的粒子
        while (timeAcc >= rate) {
          timeAcc -= rate;
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * R * 0.35; // 從中內部起跑
          ctx.particles.spawn({
            x: g.position.x + Math.cos(angle) * dist,
            y: 3,
            z: g.position.z + Math.sin(angle) * dist,
            vx: Math.cos(angle) * (150 + Math.random() * 150), // 向外推開的粒子速度
            vy: 70 + Math.random() * 100,
            vz: Math.sin(angle) * (150 + Math.random() * 150),
            drag: 0.85,
            life: 0.6 + Math.random() * 0.35,
            size: 3.5 + Math.random() * 3.5,
            color: Math.random() < 0.65 ? '#ff4081' : '#ffd76a',
            fade: true
          });
        }
      }
    };
  }
});

registerVfx('bard_anthem_ally', {
  onCast(ctx, f, c) {
    pillar(ctx, c, { color: PINK, h: 90, r: 18, life: 0.5, alpha: 0.65 });
    ring(ctx, c, { color: '#ffd76a', from: 8, to: 45, life: 0.45, y: 3, ease: true });
    column(ctx, c, { color: [PINK, '#ffd76a'], count: 12, radius: 16, speed: 110, life: 0.6, size: 3.5 });
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * 12;
      ctx.particles.spawn({
        x: c.x + Math.cos(a) * rr, y: 4, z: c.z + Math.sin(a) * rr,
        vx: (Math.random() - 0.5) * 15, vy: 80 + Math.random() * 60, vz: (Math.random() - 0.5) * 15,
        drag: 0.6, life: 0.7 + Math.random() * 0.3, size: 4.0,
        color: Math.random() < 0.5 ? PINK : '#ffd76a', fade: true
      });
    }
  }
});

registerVfx('bard_ultimate_ally', {
  onCast(ctx, f, c) {
    const cols = [PINK, '#ffd76a', '#4dd0e1', '#7bed9f'];
    pillar(ctx, c, { color: PINK, h: 120, r: 24, life: 0.65, alpha: 0.7 });
    ring(ctx, c, { color: '#4dd0e1', from: 10, to: 60, life: 0.5, y: 3, ease: true });
    column(ctx, c, { color: cols, count: 18, radius: 20, speed: 130, life: 0.75, size: 3.8 });
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * 15;
      ctx.particles.spawn({
        x: c.x + Math.cos(a) * rr, y: 4, z: c.z + Math.sin(a) * rr,
        vx: (Math.random() - 0.5) * 20, vy: 100 + Math.random() * 80, vz: (Math.random() - 0.5) * 20,
        drag: 0.5, life: 0.8 + Math.random() * 0.4, size: 4.2,
        color: cols[i % cols.length], fade: true
      });
    }
  }
});

registerVfx('bard_heal_hit', {
  onHit(ctx, f, c) {
    sphereFlash(ctx, c, { color: '#5cffa6', from: 4, to: 28, life: 0.25, alpha: 0.85 });
    ring(ctx, c, { color: '#ff8fb8', from: 4, to: 35, life: 0.3, y: 6 });
    burst(ctx, c, { color: ['#5cffa6', '#ff8fb8', '#ffffff'], count: 8, speed: 120, life: 0.35, size: 2.8 });
  }
});

