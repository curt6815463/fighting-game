// @ts-nocheck
import * as THREE from 'three';
import { registerVfx } from '../../../render3d/vfx/registry.js';
import { ring, burst, column, sphereFlash, pillar, ultimateBurst, addFlash, addShake } from '../../../render3d/vfx/lib.js';

const RED = '#c9184a';
const GOLD = '#ffd166';
const BLUE = '#4cc9f0';
const VIOLET = '#7b2ff7';

function cardMesh(TH, color = RED, r = 1) {
  const g = new TH.Group();
  const paper = new TH.MeshStandardMaterial({ color: 0xd8d0c2, roughness: 0.68, metalness: 0.02, emissive: new TH.Color(color), emissiveIntensity: 0.35, side: TH.DoubleSide });
  const edge = new TH.MeshBasicMaterial({ color: new TH.Color(color), transparent: true, opacity: 0.8, blending: TH.AdditiveBlending, side: TH.DoubleSide });
  // Thickness along Y, length/width on X/Z (lying flat)
  const body = new TH.Mesh(new TH.BoxGeometry(r * 2.5, r * 0.08, r * 1.55), paper);
  const pip = new TH.Mesh(new TH.OctahedronGeometry(r * 0.28, 0), edge);
  pip.position.y = r * 0.08;
  g.add(body, pip);
  g.userData.geo = { dispose: () => { body.geometry.dispose(); pip.geometry.dispose(); } };
  g.userData.mat = { dispose: () => { paper.dispose(); edge.dispose(); } };
  return g;
}

function projectileCardJoker(color, scale = 1.25) {
  return {
    projectile(ctx, pr) {
      const g = cardMesh(ctx.THREE, color, (pr.radius || 10) * 1.65 * scale);
      return {
        object3D: g,
        update(dt) {
          g.rotation.y += dt * 12.0;
          g.rotation.x = Math.sin(dt * 5) * 0.2;
          g.rotation.z = Math.cos(dt * 5) * 0.2;
          const colors = [VIOLET, GOLD, BLUE, RED, '#ffffff'];
          for (let i = 0; i < 2; i++) {
            ctx.particles.spawn({
              x: g.position.x + (Math.random() - 0.5) * 4,
              y: g.position.y + (Math.random() - 0.5) * 4,
              z: g.position.z + (Math.random() - 0.5) * 4,
              vx: -pr.vx * 0.12 + (Math.random() - 0.5) * 25,
              vy: (Math.random() - 0.5) * 22,
              vz: -pr.vy * 0.12 + (Math.random() - 0.5) * 25,
              life: 0.38,
              size: 3.2,
              color: colors[Math.floor(Math.random() * colors.length)],
              drag: 1.8,
              fade: true,
            });
          }
        },
      };
    },
    onHit(ctx, f, c) {
      ring(ctx, c, { color: VIOLET, from: 8, to: 48 * scale, life: 0.35, y: 6, alpha: 0.95 });
      ring(ctx, c, { color: GOLD, from: 2, to: 32 * scale, life: 0.28, y: 8, alpha: 0.85 });
      burst(ctx, c, { color: [VIOLET, GOLD, BLUE, RED, '#ffffff'], count: 32, speed: 220, life: 0.45, size: 4.0 });
      addShake(ctx, 4);
    },
  };
}

function projectileCard(color, scale = 1) {
  return {
    projectile(ctx, pr) {
      // Scale increased from 0.7 to 1.65 for high visibility
      const g = cardMesh(ctx.THREE, color, (pr.radius || 10) * 1.65 * scale);
      return {
        object3D: g,
        update(dt) {
          // Flat horizontal spin like a frisbee card
          g.rotation.y += dt * 8.2;
          g.rotation.x = 0;
          g.rotation.z = 0;
          if (Math.random() < 0.45) {
            ctx.particles.spawn({
              x: g.position.x, y: g.position.y, z: g.position.z,
              vx: -pr.vx * 0.08 + (Math.random() - 0.5) * 18,
              vy: (Math.random() - 0.5) * 16,
              vz: -pr.vy * 0.08 + (Math.random() - 0.5) * 18,
              life: 0.24,
              size: 2.4,
              color: Math.random() < 0.5 ? color : GOLD,
              drag: 2.2,
              fade: true,
            });
          }
        },
      };
    },
    onHit(ctx, f, c) {
      ring(ctx, c, { color, from: 5, to: 34 * scale, life: 0.26, y: 6, alpha: 0.85 });
      burst(ctx, c, { color: [color, GOLD, '#ffffff'], count: 12, speed: 165, life: 0.34, size: 3 });
    },
  };
}

registerVfx('royal_card', projectileCard(RED, 1));
registerVfx('royal_card_fan', projectileCard(GOLD, 0.95));
registerVfx('royal_card_empowered', projectileCard(BLUE, 1.18));
registerVfx('royal_card_joker', projectileCardJoker(VIOLET, 1.25));


registerVfx('royal_encore', {
  onHit(ctx, f, c) {
    sphereFlash(ctx, c, { color: GOLD, from: 5, to: 48, life: 0.24, alpha: 0.92 });
    ring(ctx, c, { color: RED, from: 12, to: 62, life: 0.32, y: 7, alpha: 0.72 });
    burst(ctx, c, { color: [RED, GOLD, '#ffffff'], count: 24, speed: 220, up: 30, life: 0.45, size: 3.4 });
  },
});

registerVfx('royal_card_empower', {
  onHit(ctx, f, c) {
    ring(ctx, c, { color: BLUE, from: 18, to: f.radius || 120, life: 0.35, y: 5, alpha: 0.5 });
    column(ctx, c, { color: [BLUE, GOLD], count: 12, radius: Math.min(60, (f.radius || 120) * 0.5), speed: 120, life: 0.48, size: 3 });
  },
});

registerVfx('royal_smoke_blink', {
  onCast(ctx, f, c) {
    ring(ctx, c, { color: BLUE, from: 10, to: f.radius || 120, life: 0.45, y: 3, alpha: 0.68 });
    column(ctx, c, { color: [BLUE, VIOLET, GOLD], count: 34, radius: 52, speed: 95, gravity: -8, life: 0.78, size: 4 });
    burst(ctx, c, { color: [BLUE, VIOLET], count: 18, speed: 105, flat: true, life: 0.55, size: 4 });
  },
});

registerVfx('royal_blink_arrive', {
  onCast(ctx, f, c) {
    sphereFlash(ctx, c, { color: BLUE, from: 5, to: 36, life: 0.22, alpha: 0.82 });
    burst(ctx, c, { color: [BLUE, GOLD, '#ffffff'], count: 16, speed: 180, up: 24, life: 0.36, size: 3 });
  },
});

registerVfx('royal_smoke_prime', {
  onHit(ctx, f, c) {
    ring(ctx, c, { color: GOLD, from: 20, to: f.radius || 120, life: 0.52, y: 8, alpha: 0.78 });
    addFlash(ctx, 0.08, GOLD);
  },
});

registerVfx('royal_smoke', {
  zone(ctx, z) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const R = z.radius || 120;
    const ringGeo = new TH.RingGeometry(R * 0.72, R, 48);
    const ringMat = new TH.MeshBasicMaterial({ color: new TH.Color(BLUE), transparent: true, opacity: 0.42, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const rg = new TH.Mesh(ringGeo, ringMat);
    rg.rotation.x = -Math.PI / 2;
    rg.position.y = 2;
    g.add(rg);
    const coreGeo = new TH.CircleGeometry(R * 0.72, 36);
    const coreMat = new TH.MeshBasicMaterial({ color: new TH.Color(VIOLET), transparent: true, opacity: 0.16, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const core = new TH.Mesh(coreGeo, coreMat);
    core.rotation.x = -Math.PI / 2;
    core.position.y = 1.5;
    g.add(core);
    g.userData.geo = { dispose: () => { ringGeo.dispose(); coreGeo.dispose(); } };
    g.userData.mat = { dispose: () => { ringMat.dispose(); coreMat.dispose(); } };
    let age = 0;
    let emit = 0;
    return {
      object3D: g,
      update(dt) {
        age += dt;
        emit -= dt;
        rg.rotation.z += dt * 0.5;
        ringMat.opacity = 0.34 + 0.12 * Math.sin(age * 7);
        coreMat.opacity = 0.12 + 0.06 * Math.sin(age * 5);
        if (emit <= 0) {
          emit = 0.035;
          const a = Math.random() * Math.PI * 2;
          const rr = Math.random() * R * 0.8;
          ctx.particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 3, z: g.position.z + Math.sin(a) * rr, vx: 0, vy: 35 + Math.random() * 45, vz: 0, gravity: -12, drag: 0.7, life: 0.75, size: 4, color: Math.random() < 0.5 ? BLUE : VIOLET, fade: true });
        }
      },
    };
  },
});

registerVfx('royal_theater', {
  onCast(ctx, f, c) {
    ultimateBurst(ctx, c, { color: RED, radius: f.radius || 285, pillarH: 210, pillarR: 32, count: 52, shake: 16, flash: 0.24 });
  },
  zone(ctx, z) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const R = z.radius || 285;
    const floorGeo = new TH.RingGeometry(R * 0.55, R, 64);
    const floorMat = new TH.MeshBasicMaterial({ color: new TH.Color(RED), transparent: true, opacity: 0.34, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const floor = new TH.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 2;
    g.add(floor);
    const cards = [];
    for (let i = 0; i < 8; i++) {
      const m = cardMesh(TH, i % 2 ? GOLD : RED, 13);
      g.add(m);
      cards.push({
        m,
        sx: 1.2 + Math.random() * 1.4,
        sy: 1.0 + Math.random() * 1.6,
        sz: 1.1 + Math.random() * 1.5,
        sh: 1.5 + Math.random() * 1.2,
        ox: Math.random() * Math.PI * 2,
        oy: Math.random() * Math.PI * 2,
        oz: Math.random() * Math.PI * 2,
        oh: Math.random() * Math.PI * 2,
        rx: 1.2 + Math.random() * 2.0,
        ry: 1.2 + Math.random() * 2.0,
        rz: 1.2 + Math.random() * 2.0,
      });
    }
    g.userData.geo = floorGeo;
    g.userData.mat = floorMat;
    let age = 0;
    return {
      object3D: g,
      update(dt) {
        age += dt;
        floor.rotation.z += dt * 0.35;
        floorMat.opacity = 0.28 + 0.12 * Math.sin(age * 5);
        for (const card of cards) {
          const px = Math.sin(age * card.sx + card.ox) * Math.cos(age * card.sy + card.oy) * R * 0.72;
          const pz = Math.cos(age * card.sz + card.oz) * Math.sin(age * card.sy) * R * 0.72;
          const py = 12 + Math.sin(age * card.sh + card.oh) * 16;
          card.m.position.set(px, py, pz);
          card.m.rotation.set(age * card.rx, age * card.ry, age * card.rz);
        }
      },
    };
  },
});

registerVfx('royal_theater_finale', {
  onHit(ctx, f, c) {
    ultimateBurst(ctx, c, { color: GOLD, radius: f.radius || 150, pillarH: 175, pillarR: 26, count: 44, shake: 14, flash: 0.28 });
    burst(ctx, c, { color: [RED, GOLD, BLUE, '#ffffff'], count: 36, speed: 310, up: 80, life: 0.7, size: 4.2 });
    addShake(ctx, 10);
  },
  zone(ctx, z) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const R = z.radius || 150;
    const geo = new TH.RingGeometry(R * 0.2, R, 52);
    const mat = new TH.MeshBasicMaterial({ color: new TH.Color(GOLD), transparent: true, opacity: 0.72, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const ringMesh = new TH.Mesh(geo, mat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 6;
    g.add(ringMesh);
    g.userData.geo = geo;
    return { object3D: g, update(dt) { ringMesh.rotation.z += dt * 2.2; mat.opacity = Math.max(0.18, mat.opacity * 0.98); } };
  },
});

registerVfx('royal_hat_zone', {
  zone(ctx, z) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const R = z.radius || 70;
    
    // Magic summoning floor ring
    const floorGeo = new TH.RingGeometry(R * 0.8, R, 24);
    const floorMat = new TH.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.5, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const floor = new TH.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 1.5;
    g.add(floor);

    // Floating magic top hat model
    const hatGroup = new TH.Group();
    hatGroup.position.y = 15;
    
    const darkMat = new TH.MeshStandardMaterial({ color: 0x17151c, roughness: 0.72, metalness: 0.08 });
    const ribbonMat = new TH.MeshStandardMaterial({ color: 0xc9184a, roughness: 0.55, metalness: 0.05, emissive: 0xc9184a, emissiveIntensity: 0.4 });
    
    // Hat brim
    const brim = new TH.Mesh(new TH.CylinderGeometry(R * 0.35, R * 0.35, 1.2, 16), darkMat);
    brim.scale.set(1.15, 1, 0.95);
    hatGroup.add(brim);
    
    // Hat crown
    const crown = new TH.Mesh(new TH.CylinderGeometry(R * 0.18, R * 0.22, 14, 12), darkMat);
    crown.position.y = 7.0;
    hatGroup.add(crown);
    
    // Red ribbon band
    const band = new TH.Mesh(new TH.TorusGeometry(R * 0.22, 0.8, 8, 18), ribbonMat);
    band.position.y = 1.6;
    band.rotation.x = Math.PI / 2;
    band.scale.set(1.15, 0.95, 1);
    hatGroup.add(band);
    
    g.add(hatGroup);
    
    g.userData.geo = { dispose: () => { floorGeo.dispose(); brim.geometry.dispose(); crown.geometry.dispose(); band.geometry.dispose(); } };
    g.userData.mat = { dispose: () => { floorMat.dispose(); darkMat.dispose(); ribbonMat.dispose(); } };
    
    let age = 0;
    let particleTimer = 0;
    return {
      object3D: g,
      update(dt) {
        age += dt;
        floor.rotation.z += dt * 0.6;
        floorMat.opacity = 0.35 + 0.15 * Math.sin(age * 5);
        
        // Hover float and spin
        hatGroup.position.y = 12 + Math.sin(age * 3.5) * 3;
        hatGroup.rotation.y += dt * 1.5;
        hatGroup.rotation.z = Math.sin(age * 2.0) * 0.08;
        
        particleTimer -= dt;
        if (particleTimer <= 0) {
          particleTimer = 0.08;
          ctx.particles.spawn({
            x: g.position.x + (Math.random() - 0.5) * R * 0.6,
            y: g.position.y + 4 + Math.random() * 20,
            z: g.position.z + (Math.random() - 0.5) * R * 0.6,
            vx: (Math.random() - 0.5) * 8,
            vy: 20 + Math.random() * 20,
            vz: (Math.random() - 0.5) * 8,
            life: 0.65,
            size: 2.2,
            color: Math.random() < 0.6 ? '#4cc9f0' : '#c9184a',
            fade: true,
          });
        }
      }
    };
  }
});

registerVfx('royal_hat_blink', {
  onCast(ctx, f, c) {
    sphereFlash(ctx, c, { color: BLUE, from: 5, to: 42, life: 0.28, alpha: 0.85 });
    burst(ctx, c, { color: [BLUE, RED, GOLD], count: 24, speed: 210, up: 35, life: 0.45, size: 3.5 });
  }
});

registerVfx('royal_theater_joker', {
  onCast(ctx, f, c) {
    ultimateBurst(ctx, c, { color: VIOLET, radius: f.radius || 285, pillarH: 280, pillarR: 40, count: 108, shake: 25, flash: 0.45 });
    addFlash(ctx, 0.25, VIOLET);
  },
  zone(ctx, z) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const R = z.radius || 285;
    const floorGeo = new TH.RingGeometry(R * 0.55, R, 64);
    const floorMat = new TH.MeshBasicMaterial({ color: new TH.Color(VIOLET), transparent: true, opacity: 0.45, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const floor = new TH.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 2;
    g.add(floor);
    
    const cards = [];
    const colors = [VIOLET, GOLD, BLUE, RED];
    for (let i = 0; i < 16; i++) {
      const m = cardMesh(TH, colors[i % colors.length], 14);
      g.add(m);
      cards.push({
        m,
        sx: 1.6 + Math.random() * 1.8,
        sy: 1.4 + Math.random() * 2.0,
        sz: 1.5 + Math.random() * 1.9,
        sh: 2.0 + Math.random() * 1.6,
        ox: Math.random() * Math.PI * 2,
        oy: Math.random() * Math.PI * 2,
        oz: Math.random() * Math.PI * 2,
        oh: Math.random() * Math.PI * 2,
        rx: 1.8 + Math.random() * 3.0,
        ry: 1.8 + Math.random() * 3.0,
        rz: 1.8 + Math.random() * 3.0,
      });
    }
    g.userData.geo = floorGeo;
    g.userData.mat = floorMat;
    let age = 0;
    let emit = 0;
    return {
      object3D: g,
      update(dt) {
        age += dt;
        emit -= dt;
        floor.rotation.z += dt * 0.65;
        floorMat.opacity = 0.38 + 0.16 * Math.sin(age * 8);
        for (const card of cards) {
          const px = Math.sin(age * card.sx + card.ox) * Math.cos(age * card.sy + card.oy) * R * 0.78;
          const pz = Math.cos(age * card.sz + card.oz) * Math.sin(age * card.sy) * R * 0.78;
          const py = 15 + Math.sin(age * card.sh + card.oh) * 20;
          card.m.position.set(px, py, pz);
          card.m.rotation.set(age * card.rx, age * card.ry, age * card.rz);
        }
        
        if (emit <= 0) {
          emit = 0.02;
          const a = Math.random() * Math.PI * 2;
          const rr = Math.random() * R * 0.85;
          ctx.particles.spawn({ 
            x: g.position.x + Math.cos(a) * rr, 
            y: 3, 
            z: g.position.z + Math.sin(a) * rr, 
            vx: (Math.random() - 0.5) * 10, 
            vy: 45 + Math.random() * 55, 
            vz: (Math.random() - 0.5) * 10, 
            gravity: -15, 
            drag: 0.6, 
            life: 0.85, 
            size: 4.8, 
            color: colors[Math.floor(Math.random() * colors.length)], 
            fade: true 
          });
        }
      },
    };
  },
});

registerVfx('royal_theater_joker_finale', {
  onHit(ctx, f, c) {
    ultimateBurst(ctx, c, { color: VIOLET, radius: f.radius || 150, pillarH: 260, pillarR: 48, count: 88, shake: 30, flash: 0.45 });
    burst(ctx, c, { color: [VIOLET, GOLD, BLUE, RED, '#ffffff'], count: 80, speed: 380, up: 110, life: 0.85, size: 5.0 });
    addShake(ctx, 22);
  },
  zone(ctx, z) {
    const TH = ctx.THREE;
    const g = new TH.Group();
    const R = z.radius || 150;
    const geo = new TH.RingGeometry(R * 0.2, R, 52);
    const mat = new TH.MeshBasicMaterial({ color: new TH.Color(VIOLET), transparent: true, opacity: 0.85, blending: TH.AdditiveBlending, depthWrite: false, side: TH.DoubleSide });
    const ringMesh = new TH.Mesh(geo, mat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 6;
    g.add(ringMesh);
    g.userData.geo = geo;
    return { object3D: g, update(dt) { ringMesh.rotation.z += dt * 3.5; mat.opacity = Math.max(0.1, mat.opacity * 0.95); } };
  },
});
