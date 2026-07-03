// @ts-nocheck
import * as THREE from 'three';
import { buildRoyalMagicianWeapon } from './weapon.ts';

export const modelConfig = { bulk: 1.8, weapon: 'cards', robe: true, skinKind: 'cloth', headgear: 'none' };

export function buildModel(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, frontX,
    defaultHeadMat, defaultBootMat, darkMat, goldMat, faceGroup, mkLimb, addAccent, materialTex,
  } = ctx;

  const clothTex = materialTex ? materialTex('cloth', 'robe') : null;
  const clothMat = reg(mat(0xffffff, { rough: 0.68, metal: 0.08, map: clothTex }));
  const darkClothMat = reg(mat(0x17151c, { rough: 0.72, metal: 0.08 }));
  const redMat = reg(mat(0xc9184a, { rough: 0.58, metal: 0.08, emissive: 0x3b0718, ei: 0.25 }));
  const blueMat = reg(mat(0x4cc9f0, { rough: 0.35, metal: 0.15, emissive: 0x16728d, ei: 0.9 }));
  const paperTex = materialTex ? materialTex('cloth', 'card') : null;
  const cardMat = reg(mat(0xd8d0c2, { rough: 0.74, metal: 0.02, map: paperTex }));
  const hairTex = materialTex ? materialTex('cloth', 'hair') : null;
  const hairMat = reg(mat(0xffffff, { rough: 0.78, metal: 0.05, map: hairTex }));
  hairMat.flatShading = true;

  // 1. Torso Assembly (Diamond Chest, Slender Waist)
  const torso = new THREE.Group();
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.44, torsoW * 0.34, torsoH * 0.5, 4, 1), clothMat);
  chest.position.set(0, torsoH * 0.2, 0);
  chest.rotation.y = Math.PI / 4;
  torso.add(chest);
  const waist = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.27, torsoW * 0.31, torsoH * 0.22, 8), darkClothMat);
  waist.position.set(0, -torsoH * 0.08, 0);
  torso.add(waist);
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.31, torsoW * 0.45, torsoH * 0.3, 4, 1), clothMat);
  pelvis.position.set(0, -torsoH * 0.33, 0);
  pelvis.rotation.y = Math.PI / 4;
  torso.add(pelvis);

  const belt = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.44, 0.75 * bulk, 8, 24), goldMat);
  belt.position.set(0, -torsoH * 0.18, 0);
  belt.rotation.x = Math.PI / 2;
  torso.add(belt);

  // Tuxedo Tails (燕尾服後擺 - 優化精緻度，取代單調披風)
  const tails = new THREE.Group();
  tails.position.set(-torsoD * 0.35, -torsoH * 0.4, 0);
  const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.22 * bulk, torsoH * 1.25, torsoW * 0.35), redMat);
  tailL.position.set(0, -torsoH * 0.5, torsoW * 0.18);
  tailL.rotation.set(0.08, 0.12, -0.15);
  const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.22 * bulk, torsoH * 1.25, torsoW * 0.35), redMat);
  tailR.position.set(0, -torsoH * 0.5, -torsoW * 0.18);
  tailR.rotation.set(-0.08, -0.12, -0.15);
  tails.add(tailL, tailR);
  torso.add(tails);

  // Chest Card Emblem
  const emblem = new THREE.Group();
  emblem.position.set(frontX * 0.54, torsoH * 0.12, 0);
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.8 * bulk, 6.4 * bulk, 4.6 * bulk), cardMat);
  const pip = new THREE.Mesh(new THREE.OctahedronGeometry(1.4 * bulk, 0), redMat);
  pip.position.x = 0.55 * bulk;
  emblem.add(card, pip);
  torso.add(emblem);

  // Pauldrons
  for (const sz of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(torsoW * 0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), redMat);
    pauldron.position.set(0, torsoH * 0.43, sz * (torsoW * 0.48 + 0.8));
    pauldron.rotation.z = -sz * 0.18;
    pauldron.scale.set(1.1, 0.62, 1.0);
    torso.add(pauldron);
    const trim = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.22, 0.32 * bulk, 6, 18), goldMat);
    trim.position.copy(pauldron.position);
    trim.rotation.x = Math.PI / 2;
    torso.add(trim);
  }

  // Capes (微調位置以契合燕尾服)
  const capeL = new THREE.Mesh(new THREE.BoxGeometry(0.8 * bulk, torsoH * 0.9, torsoW * 0.3), redMat);
  capeL.position.set(-torsoD * 0.58, -torsoH * 0.35, torsoW * 0.26);
  capeL.rotation.set(0.15, 0.22, -0.05);
  torso.add(capeL);
  const capeR = new THREE.Mesh(new THREE.BoxGeometry(0.8 * bulk, torsoH * 0.9, torsoW * 0.3), redMat);
  capeR.position.set(-torsoD * 0.58, -torsoH * 0.35, -torsoW * 0.26);
  capeR.rotation.set(-0.15, -0.22, -0.05);
  torso.add(capeR);

  // 2. Head & Hair Design
  const head = new THREE.Mesh(new THREE.SphereGeometry(7.2 * bulk, 16, 12), defaultHeadMat);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(7.24 * bulk, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.64), hairMat);
  hairCap.position.y = 0.2 * bulk;
  head.add(hairCap);
  
  // Curved forehead hair spikes
  for (let i = 0; i < 7; i++) {
    const a = -0.9 + i * 0.3;
    const lock = new THREE.Mesh(new THREE.ConeGeometry(1.8 * bulk, 8.5 * bulk, 5), hairMat);
    lock.position.set(frontX * 0.72, 1.4 * bulk - Math.abs(i - 3) * 0.15 * bulk, Math.sin(a) * 5.2 * bulk);
    lock.rotation.set(Math.PI / 2 + 0.35, 0, -0.25 + a * 0.25);
    lock.scale.set(0.42, 1, 1.1);
    head.add(lock);
  }

  // Magic Top Hat with Cards tucked
  const hat = new THREE.Group();
  head.add(hat);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(9.8 * bulk, 9.8 * bulk, 0.45 * bulk, 18), darkClothMat);
  brim.position.y = 4.6 * bulk;
  brim.scale.set(1.18, 1, 0.9);
  hat.add(brim);
  const brimTrim = new THREE.Mesh(new THREE.TorusGeometry(9.9 * bulk, 0.25 * bulk, 6, 28), goldMat);
  brimTrim.position.y = 4.75 * bulk;
  brimTrim.rotation.x = Math.PI / 2;
  brimTrim.scale.set(1.18, 0.9, 1);
  hat.add(brimTrim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(4.4 * bulk, 5.3 * bulk, 8.4 * bulk, 8), darkClothMat);
  crown.position.y = 8.8 * bulk;
  hat.add(crown);
  const band = new THREE.Mesh(new THREE.TorusGeometry(5.35 * bulk, 0.55 * bulk, 8, 24), redMat);
  band.position.y = 5.35 * bulk;
  band.rotation.x = Math.PI / 2;
  hat.add(band);
  const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(1.6 * bulk, 0), blueMat);
  jewel.position.set(frontX * 0.72, 5.4 * bulk, 0);
  hat.add(jewel);

  // Classic Card Tucked in Ribbon (Ace of Spades touch)
  const hatCard = new THREE.Mesh(new THREE.BoxGeometry(0.1 * bulk, 2.4 * bulk, 1.6 * bulk), cardMat);
  hatCard.position.set(frontX * 0.45, 6.2 * bulk, 4.2 * bulk);
  hatCard.rotation.set(0.18, -0.45, 0.22);
  hat.add(hatCard);

  // Eyes
  const eyeMat = reg(mat(0x4cc9f0, { emissive: 0x4cc9f0, ei: 1.6, rough: 0.35 }));
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.9 * bulk, 1.35 * bulk, 2.0 * bulk), eyeMat);
    eye.position.set(frontX - 0.35 * bulk, 0.85 * bulk, sz * 2.3 * bulk);
    faceGroup.add(eye);
  }

  // 3. Floating Hand Cards ( upgraded back accessories with golden borders )
  const floatingCards = [];
  const cardCanvases: HTMLCanvasElement[] = [];
  const cardContexts: CanvasRenderingContext2D[] = [];
  const cardTextures: THREE.CanvasTexture[] = [];

  const cardH = 15.6 * bulk;
  const cardW = 10.5 * bulk;
  const cardTh = 0.08 * bulk;

  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    
    // Create 2D canvas context for dynamic flat symbol texture
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let texture: THREE.CanvasTexture | null = null;
    let faceMat = cardMat; // fallback
    
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      ctx = canvas.getContext('2d')!;
      texture = new THREE.CanvasTexture(canvas);
      faceMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      cardCanvases.push(canvas);
      cardContexts.push(ctx);
      cardTextures.push(texture);
    }
    
    // 1. White card back (Y shifted up by cardH/2 so Group origin is at bottom pivot)
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.1 * bulk, cardH, cardW), cardMat);
    back.position.set(-0.05 * bulk, cardH / 2, 0);
    
    // 2. Pure white card face with dynamic canvas texture
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.08 * bulk, cardH - 0.2 * bulk, cardW - 0.2 * bulk), faceMat);
    face.position.set(0.04 * bulk, cardH / 2, 0);
    g.add(back, face);
    
    // 3. Gold frame trims
    const goldFrameH = new THREE.Mesh(new THREE.BoxGeometry(0.14 * bulk, 0.5 * bulk, cardW), goldMat);
    const frameTop = goldFrameH.clone();
    frameTop.position.set(0.02 * bulk, cardH, 0);
    const frameBottom = goldFrameH.clone();
    frameBottom.position.set(0.02 * bulk, 0, 0);
    
    const goldFrameV = new THREE.Mesh(new THREE.BoxGeometry(0.14 * bulk, cardH, 0.5 * bulk), goldMat);
    const frameLeft = goldFrameV.clone();
    frameLeft.position.set(0.02 * bulk, cardH / 2, cardW / 2);
    const frameRight = goldFrameV.clone();
    frameRight.position.set(0.02 * bulk, cardH / 2, -cardW / 2);
    g.add(frameTop, frameBottom, frameLeft, frameRight);
    
    // 4. Gold corner protectors
    const cornerGeo = new THREE.OctahedronGeometry(0.7 * bulk, 0);
    const halfH = cardH / 2;
    const halfW = cardW / 2;
    const corners = [
      [cardH - 0.2 * bulk, halfW - 0.2 * bulk], 
      [cardH - 0.2 * bulk, -halfW + 0.2 * bulk], 
      [0.2 * bulk, halfW - 0.2 * bulk], 
      [0.2 * bulk, -halfW + 0.2 * bulk]
    ];
    for (const [cy, cz] of corners) {
      const corner = new THREE.Mesh(cornerGeo, goldMat);
      corner.position.set(0.04 * bulk, cy, cz);
      g.add(corner);
    }
    
    // Spread cards behind the magician like a beautiful handheld fan (angle from -0.42 to 0.42)
    const angle = -0.42 + i * 0.28;
    const cardZ = Math.sin(angle) * torsoW * 1.35; 
    const cardY = torsoH * 0.38 + Math.cos(angle) * 2.2 * bulk;
    const cardX = -torsoD * 1.05 - Math.abs(Math.sin(angle)) * 1.5 * bulk;
    g.position.set(cardX, cardY, cardZ);
    // Correct rotation axes: tilt left/right on X axis (angle), minor wrap around Y axis
    g.rotation.set(angle, -angle * 0.12, 0);
    
    addAccent(g);
    floatingCards.push(g);
  }

  // 4. Custom Detailed Limbs ( Gauntlets & Boots )
  const armMat = reg(mat(shade(base, -0.08), { rough: 0.68, metal: 0.08 }));
  const armL = mkLimb(0, -ctx.shoulderX, true, armMat, defaultBootMat, base);
  const armR = mkLimb(0, ctx.shoulderX, true, armMat, defaultBootMat, base);
  const legL = mkLimb(0, -ctx.hipX, false, darkClothMat, defaultBootMat, base);
  const legR = mkLimb(0, ctx.hipX, false, darkClothMat, defaultBootMat, base);

  // Add detail ornaments to procedural arms & legs
  for (const arm of [armL, armR]) {
    // Add socket joint spheres at pivot origin
    const socket = new THREE.Mesh(new THREE.SphereGeometry(1.5 * bulk, 8, 8), goldMat);
    arm.add(socket);
    // Add cuffs at wrist area (around Y = -11)
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(1.6 * bulk, 0.45 * bulk, 6, 12), goldMat);
    cuff.position.set(0, -11 * bulk, 0);
    cuff.rotation.x = Math.PI / 2;
    arm.add(cuff);
  }

  for (const leg of [legL, legR]) {
    // Knee glowing crystal joints
    const kneeCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.0 * bulk, 0), blueMat);
    kneeCrystal.position.set(0, -7 * bulk, 0.8 * bulk);
    leg.add(kneeCrystal);
    // Boots reflection folds (cuffs around Y = -10)
    const bootCuff = new THREE.Mesh(new THREE.TorusGeometry(2.1 * bulk, 0.5 * bulk, 6, 12), goldMat);
    bootCuff.position.set(0, -10 * bulk, 0);
    bootCuff.rotation.x = Math.PI / 2;
    leg.add(bootCuff);
  }

  // 5. Custom 3D Update Hook
  const parts = { torso, head, armL, armR, legL, legR, floatingCards };
  parts.customUpdate = (dt, group, ud, info) => {
    const p = info.p;
    // p.royalCards is an array of suits, e.g. ['R', 'B', 'R']
    const royalCards = p ? (Array.isArray(p.royalCards) ? p.royalCards : ['R', 'B', 'R', 'B']) : ['R', 'B', 'R', 'B'];
    const cardsCount = royalCards.length;
    
    // Smoothly toggle back cards visibility and wave float
    for (let i = 0; i < floatingCards.length; i++) {
      const card = floatingCards[i];
      card.visible = i < cardsCount;
      if (card.visible) {
        // Draw flat printed symbol on the card's face texture
        const ctx = cardContexts[i];
        const tex = cardTextures[i];
        if (ctx && tex) {
          ctx.clearRect(0, 0, 64, 64);
          const suit = royalCards[i];
          if (suit === 'J') {
            const grad = ctx.createRadialGradient(32, 32, 5, 32, 32, 32);
            grad.addColorStop(0, '#ffd166');
            grad.addColorStop(1, '#7b2ff7');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 40px "Arial Black", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', 32, 32);
          } else {
            const isRed = suit === 'R';
            ctx.fillStyle = isRed ? '#d90429' : '#005f73';
            const char = isRed ? '♦' : '♠';
            ctx.font = 'bold 44px "Arial Black", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char, 32, 32);
          }
          tex.needsUpdate = true;
        }

        const angle = -0.42 + i * 0.28;
        
        // Gentle breathing float animation
        const wave = Math.sin(ud.breathe * 2.2 + i * 0.8) * 0.25 * bulk;
        
        const cardZ = Math.sin(angle) * torsoW * 1.35 + Math.cos(ud.breathe + i * 1.5) * 0.08 * bulk; 
        const cardY = torsoH * 0.38 + Math.cos(angle) * 2.2 * bulk + wave;
        const cardX = -torsoD * 1.05 - Math.abs(Math.sin(angle)) * 1.5 * bulk - Math.abs(wave) * 0.15;
        card.position.set(cardX, cardY, cardZ);
        
        // Left-right tilt on rotation.x (angle), minor forward/back tilt on rotation.y
        card.rotation.set(
          angle + Math.sin(ud.breathe * 1.5 + i) * 0.02, 
          -angle * 0.12 + Math.cos(ud.breathe * 1.1) * 0.02, 
          0
        );
      }
    }

    // Tuxedo Tails sway logic
    if (tails && tailL && tailR) {
      const sway = Math.sin(ud.breathe * 1.2) * 0.08;
      const moveSway = ud.move > 0.02 ? Math.abs(Math.sin(ud.phase)) * 0.24 : 0;
      tailL.rotation.x = 0.08 + sway + moveSway * 0.4;
      tailR.rotation.x = -0.08 - sway - moveSway * 0.4;
      tails.rotation.z = -moveSway * 0.6;
    }
  };

  return parts;
}

export const buildWeapon = buildRoyalMagicianWeapon;
