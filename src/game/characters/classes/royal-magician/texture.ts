// @ts-nocheck
const RED = '#c9184a';
const GOLD = '#ffd166';
const BLUE = '#4cc9f0';
const INK = '#17151c';

function fillBg(x, S, top, bot) {
  const g = x.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
}

export function drawRoyalMagicianTexture(x, S) {
  fillBg(x, S, '#230914', RED);
  x.strokeStyle = 'rgba(255, 209, 102, 0.72)';
  x.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const y = 14 + i * 22;
    x.beginPath();
    x.moveTo(0, y);
    x.bezierCurveTo(S * 0.35, y + 18, S * 0.65, y - 18, S, y + 4);
    x.stroke();
  }
  x.fillStyle = 'rgba(255, 255, 255, 0.82)';
  for (let i = 0; i < 4; i++) {
    const cx = 18 + i * 28;
    const cy = 24 + (i % 2) * 48;
    x.save();
    x.translate(cx, cy);
    x.rotate((i - 1.5) * 0.24);
    x.fillRect(-7, -10, 14, 20);
    x.strokeStyle = i % 2 ? BLUE : GOLD;
    x.lineWidth = 2;
    x.strokeRect(-7, -10, 14, 20);
    x.restore();
  }
}

export function drawRoyalMagicianMaterialTexture(x, S, kind, part) {
  if (part === 'hair') {
    fillBg(x, S, '#211827', '#09070c');
    x.strokeStyle = 'rgba(76, 201, 240, 0.2)';
    x.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      x.beginPath();
      x.moveTo(i * S / 14, 0);
      x.lineTo(i * S / 14 + 12, S);
      x.stroke();
    }
    return;
  }
  if (part === 'card') {
    fillBg(x, S, '#e8e0d2', '#bcb2a4');
    x.strokeStyle = 'rgba(23, 21, 28, 0.45)';
    x.lineWidth = 4;
    x.strokeRect(8, 8, S - 16, S - 16);
    x.fillStyle = RED;
    x.beginPath();
    x.moveTo(S / 2, 22);
    x.lineTo(S - 24, S / 2);
    x.lineTo(S / 2, S - 22);
    x.lineTo(24, S / 2);
    x.closePath();
    x.fill();
    return;
  }
  if (kind === 'metal' || part === 'gold') {
    fillBg(x, S, '#8c6722', GOLD);
    x.strokeStyle = 'rgba(255, 255, 255, 0.34)';
    x.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      x.beginPath();
      x.arc(S / 2, S / 2, 8 + i * 8, 0, Math.PI * 1.5);
      x.stroke();
    }
    return;
  }
  fillBg(x, S, INK, RED);
  x.fillStyle = 'rgba(255, 209, 102, 0.35)';
  for (let i = 0; i < 7; i++) x.fillRect(i * 18, 0, 4, S);
  x.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  x.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    x.beginPath();
    x.moveTo(0, i * 28);
    x.lineTo(S, i * 28 + 38);
    x.stroke();
  }
}
