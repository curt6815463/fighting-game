// @ts-nocheck
export function drawChronohexTexture(x, S) {
  // 時厄術士：青藍時鐘刻度 + 紫色詛咒裂紋
  // 時鐘環(青)
  x.strokeStyle = 'rgba(150, 240, 255, 0.55)';
  x.lineWidth = 2;
  x.beginPath(); x.arc(S / 2, S / 2, 48, 0, 7); x.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; x.beginPath(); x.moveTo(S / 2 + Math.cos(a) * 42, S / 2 + Math.sin(a) * 42); x.lineTo(S / 2 + Math.cos(a) * 48, S / 2 + Math.sin(a) * 48); x.stroke(); }
  x.strokeStyle = 'rgba(200, 250, 255, 0.45)';
  x.beginPath(); x.moveTo(S / 2, S / 2); x.lineTo(S / 2, S / 2 - 34); x.moveTo(S / 2, S / 2); x.lineTo(S / 2 + 24, S / 2); x.stroke();
  // 詛咒裂紋與符點(紫)
  x.strokeStyle = 'rgba(180, 120, 220, 0.5)';
  for (let i = 0; i < 7; i++) { const px = Math.random() * S, py = Math.random() * S; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 44, py + (Math.random() - 0.5) * 44); x.stroke(); }
  x.fillStyle = 'rgba(220, 160, 255, 0.45)';
  for (let i = 0; i < 12; i++) { x.beginPath(); x.arc(Math.random() * S, Math.random() * S, 1.4 + Math.random() * 1.8, 0, 7); x.fill(); }
}
