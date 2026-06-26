// @ts-nocheck
// R3 風沙法皇 技能特效。主題：黃沙金塵／流沙漩渦／風暴強風。
import * as THREE from 'three';
import { registerVfx } from '../../render3d/vfx/registry.js';
import { slashBlade, cone, burst, ring, column, sphereFlash } from '../../render3d/vfx/lib.js';

const SAND = '#dfc48c', GOLD = '#ffd700', DUST = '#a68d60', PURPLE = '#c050ff';

// 流沙漩渦貼圖：中心暗陷沙坑 → 外圈亮沙 → 邊緣透明，疊三條交錯螺旋臂（旋轉即成漩渦）。快取。
let _qsTex: any = null;
function quicksandTex() {
  if (_qsTex) return _qsTex;
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  const cx = S / 2, cy = S / 2, R = S / 2;
  const rg = x.createRadialGradient(cx, cy, 0, cx, cy, R);
  rg.addColorStop(0.0, 'rgba(64,50,30,0.96)');     // 暗陷沙坑
  rg.addColorStop(0.45, 'rgba(150,124,76,0.9)');
  rg.addColorStop(0.82, 'rgba(205,180,124,0.85)'); // 亮沙
  rg.addColorStop(1.0, 'rgba(205,180,124,0)');     // 邊緣柔化
  x.fillStyle = rg; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
  x.lineCap = 'round';
  for (let arm = 0; arm < 3; arm++) {
    x.strokeStyle = arm % 2 ? 'rgba(236,214,160,0.55)' : 'rgba(86,68,42,0.5)';
    x.lineWidth = 6;
    x.beginPath();
    for (let s = 0; s <= 64; s++) {
      const t = s / 64;
      const ang = arm * (6.283 / 3) + t * 6.283 * 1.5;   // 1.5 圈螺旋
      const rr = R * 0.1 + t * R * 0.84;
      const px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr;
      s === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
    }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  _qsTex = t; return t;
}

export function loadVfx() {
  // 普攻：沙塵彈發射與擊中
  registerVfx('boss_sand_bolt', {
    onCast(ctx, f, c) {
      burst(ctx, c, { color: [SAND, DUST], count: 8, speed: 120, life: 0.35, size: 3 });
    },
    onHit(ctx, f, c) {
      sphereFlash(ctx, c, { color: GOLD, from: 2, to: 28, life: 0.2 });
      burst(ctx, c, { color: [SAND, GOLD], count: 12, speed: 160, life: 0.4, size: 3.5 });
    }
  });

  // 技能一：流沙漩渦 (Quicksand Pool) — 螺旋沙面緩轉 + 內陷深坑反向快轉 + 揚塵亮環 + 向心旋入的沙粒。
  registerVfx('boss_sand_pool', {
    zone(ctx, z) {
      const R = z.radius || 150;
      const g = new THREE.Group();
      const tex = quicksandTex();
      // 漩渦沙面（螺旋貼圖，緩轉）
      const swirl = new THREE.Mesh(
        new THREE.CircleGeometry(R, 40),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide })
      );
      swirl.rotation.x = -Math.PI / 2; swirl.position.y = 0.4; g.add(swirl);
      // 內陷深坑（暗、較小、反向快轉 → 吞噬感）
      const pit = new THREE.Mesh(
        new THREE.CircleGeometry(R * 0.52, 32),
        new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0x6a5836), transparent: true, opacity: 0.78, depthWrite: false })
      );
      pit.rotation.x = -Math.PI / 2; pit.position.y = 0.5; g.add(pit);
      // 揚塵亮環（加法、脈動）
      const rim = new THREE.Mesh(
        new THREE.RingGeometry(R * 0.88, R * 1.02, 40),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(SAND), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
      );
      rim.rotation.x = -Math.PI / 2; rim.position.y = 0.55; g.add(rim);

      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt;
          swirl.rotation.z -= dt * 0.95;
          pit.rotation.z += dt * 1.9;
          rim.material.opacity = 0.42 + 0.22 * Math.sin(t * 3.2);
          em -= dt;
          if (em <= 0) {
            em = 0.035;
            // 表面沙粒：切向旋 + 微向心 + 短命 → 被漩渦捲吸的感覺
            const a = Math.random() * 6.283;
            const rr = R * (0.42 + Math.random() * 0.55);
            const tang = 60, inward = 24;
            ctx.particles.spawn({
              x: g.position.x + Math.cos(a) * rr,
              y: 1.0,
              z: g.position.z + Math.sin(a) * rr,
              vx: -Math.sin(a) * tang - Math.cos(a) * inward,
              vy: 2 + Math.random() * 4,
              vz: Math.cos(a) * tang - Math.sin(a) * inward,
              gravity: 6,
              drag: 1.25,
              life: 0.45 + Math.random() * 0.35,
              size: 1.6 + Math.random() * 2.2,
              color: Math.random() < 0.3 ? GOLD : SAND,
              fade: true
            });
          }
        }
      };
    }
  });

  // 技能二：沙塵瞬移爆炸 (Sand Blink Explosion)
  registerVfx('boss_sand_explode', {
    onCast(ctx, f, c) {
      sphereFlash(ctx, c, { color: GOLD, from: 4, to: 52, life: 0.28, alpha: 0.8 });
      ring(ctx, c, { color: SAND, from: 10, to: 160, life: 0.4, y: 1.2, alpha: 0.85 });
      burst(ctx, c, { color: [SAND, GOLD, DUST], count: 24, speed: 220, life: 0.55, size: 4.5 });
      ctx.sceneMgr.addShake(8);
    }
  });

  // 大招：黃沙送葬沙塵暴區域
  registerVfx('boss_sand_ult', {
    onCast(ctx, f, c) {
      sphereFlash(ctx, c, { color: GOLD, from: 8, to: 82, life: 0.34, alpha: 0.95 });
      burst(ctx, c, { color: [SAND, GOLD], count: 32, speed: 280, up: 50, life: 0.7, size: 5.5 });
      ctx.sceneMgr.addShake(18); ctx.sceneMgr.addFlash(0.24, GOLD);
    },
    zone(ctx, z) {
      const R = z.radius || 280;
      const g = new THREE.Group();

      // 大沙暴擴展外環
      const wave = new THREE.Mesh(
        new THREE.RingGeometry(R * 0.92, R * 1.0, 32),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(GOLD), transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      wave.rotation.x = -Math.PI / 2;
      wave.position.y = 1.0;
      g.add(wave);

      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt;
          wave.scale.setScalar(0.2 + 0.8 * Math.min(1, t / 0.4));
          wave.material.opacity = Math.max(0, 0.75 * (1 - t * 0.6));
          em -= dt;
          if (em <= 0) {
            em = 0.03; // 極密沙塵粒子
            const a = Math.random() * 6.283;
            const rr = Math.random() * R * 0.95;
            ctx.particles.spawn({
              x: g.position.x + Math.cos(a) * rr,
              y: 2,
              z: g.position.z + Math.sin(a) * rr,
              vx: -Math.sin(a) * 90 + (Math.random() - 0.5) * 20, // 狂暴旋轉
              vy: 12 + Math.random() * 26,
              vz: Math.cos(a) * 90 + (Math.random() - 0.5) * 20,
              gravity: -2,
              drag: 1.05,
              life: 0.5 + Math.random() * 0.5,
              size: 3 + Math.random() * 4,
              color: Math.random() < 0.4 ? GOLD : SAND,
              fade: true
            });
          }
        }
      };
    }
  });

  // 死亡演出：法袍沙化崩塌與紫光散逸
  registerVfx('boss_sand_death', {
    onDeath(ctx, f, c) {
      const { THREE: T, addTransient, sceneMgr, particles } = ctx;
      sceneMgr.addShake(28); sceneMgr.addFlash(0.42, GOLD);
      sphereFlash(ctx, c, { color: GOLD, from: 10, to: 100, life: 0.38, alpha: 0.9 });
      sphereFlash(ctx, c, { color: PURPLE, from: 6, to: 70, life: 0.3, alpha: 0.8 });
      ring(ctx, c, { color: GOLD, from: 16, to: 280, life: 0.65, y: 1.5, alpha: 0.85, ease: true });

      // 黃沙崩裂與黑夜升騰粒子
      for (let i = 0; i < 48; i++) {
        const a = Math.random() * 6.283, rr = Math.random() * 80;
        particles.spawn({
          x: c.x + Math.cos(a) * rr,
          y: 10 + Math.random() * 60,
          z: c.z + Math.sin(a) * rr,
          vx: (Math.random() - 0.5) * 80,
          vy: 40 + Math.random() * 80,
          vz: (Math.random() - 0.5) * 80,
          gravity: 40,
          drag: 1.1,
          life: 0.8 + Math.random() * 0.5,
          size: 4 + Math.random() * 5,
          color: Math.random() < 0.7 ? SAND : GOLD,
          fade: true
        });
      }

      // 核心紫光炸裂上升
      for (let i = 0; i < 20; i++) {
        particles.spawn({
          x: c.x + (Math.random() - 0.5) * 20,
          y: 20,
          z: c.z + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 30,
          vy: 90 + Math.random() * 100,
          vz: (Math.random() - 0.5) * 30,
          gravity: -30,
          drag: 1.15,
          life: 1.2,
          size: 3 + Math.random() * 3,
          color: PURPLE,
          fade: true
        });
      }
    }
  });
}
