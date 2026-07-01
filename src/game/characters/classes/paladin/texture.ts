// @ts-nocheck
// 聖騎士貼圖：以魔獸「審判之甲 (Judgement / T2)」為藍本 —— 黑袍為底、黃金浮雕重甲、
// 銀鋼十字、緋紅裙襬與刻著紅色符文的羊皮聖帶。

// 2D 小地圖／頭像用的精靈貼圖：金色聖十字與紅寶石。
export function drawPaladinTexture(x, S) {
  x.strokeStyle = 'rgba(255, 226, 150, 0.9)';
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(S / 2, 12); x.lineTo(S / 2, S - 12);
  x.moveTo(18, S * 0.40); x.lineTo(S - 18, S * 0.40);
  x.stroke();
  // 十字中心紅寶石
  x.fillStyle = 'rgba(220, 30, 30, 0.85)';
  x.beginPath(); x.arc(S / 2, S * 0.40, 7, 0, 7); x.fill();
  // 環繞的金色聖光點
  x.fillStyle = 'rgba(255, 215, 0, 0.35)';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    x.beginPath(); x.arc(S / 2 + Math.cos(a) * 52, S / 2 + Math.sin(a) * 52, 3, 0, 7); x.fill();
  }
}

// 立體模型用的程序化材質貼圖：依 variant 產生黃金、黑袍、緋紅、鋼鐵、聖帶等不同布料/金屬紋理。
export function drawPaladinMaterialTexture(x, S, meta = {}) {
  const variant = meta.variant || 'body';
  const cx = S / 2, cy = S / 2;

  // 奢華浮雕黃金：直向漸層 + 迴紋雕花凹槽與高光。
  if (variant === 'gold') {
    const grad = x.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, '#fbe89a');
    grad.addColorStop(0.35, '#e6c556');
    grad.addColorStop(0.70, '#a97e22');
    grad.addColorStop(1, '#5f430e');
    x.fillStyle = grad;
    x.fillRect(0, 0, S, S);
    // 迴紋聖紋 —— 暗色凹槽
    x.strokeStyle = 'rgba(74, 52, 8, 0.75)';
    x.lineWidth = Math.max(3, S / 45);
    for (let i = 0; i < 3; i++) {
      x.beginPath(); x.arc(cx + 1.5, cy + 1.5, S * (0.16 + i * 0.12), 0, Math.PI * 1.55); x.stroke();
    }
    // 高光反光線
    x.strokeStyle = 'rgba(255, 255, 240, 0.85)';
    x.lineWidth = Math.max(1.5, S / 90);
    for (let i = 0; i < 3; i++) {
      x.beginPath(); x.arc(cx - 1.5, cy - 1.5, S * (0.16 + i * 0.12), 0, Math.PI * 1.55); x.stroke();
    }
    // 邊框鑲線
    x.strokeStyle = '#fff2c0';
    x.lineWidth = Math.max(2, S / 70);
    x.strokeRect(4, 4, S - 8, S - 8);
    return;
  }

  // 銀鋼：十字徽記與裙甲鋼片，冷白高光。
  if (variant === 'steel' || variant === 'armor') {
    const grad = x.createLinearGradient(0, 0, S, S);
    grad.addColorStop(0, '#8f96a2');
    grad.addColorStop(0.5, '#d5dae2');
    grad.addColorStop(1, '#6b727e');
    x.fillStyle = grad;
    x.fillRect(0, 0, S, S);
    // 拉絲橫紋
    x.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    x.lineWidth = 1;
    for (let i = 0; i < S; i += 7) { x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke(); }
    // 倒角高光邊
    x.strokeStyle = '#f4f7fb';
    x.lineWidth = Math.max(2, S / 60);
    x.strokeRect(3, 3, S - 6, S - 6);
    return;
  }

  // 緋紅裙襬布料：深紅漸層 + 織紋直條與金色滾邊。
  if (variant === 'red') {
    const grad = x.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, '#8f2320');
    grad.addColorStop(0.55, '#701818');
    grad.addColorStop(1, '#4c0f10');
    x.fillStyle = grad;
    x.fillRect(0, 0, S, S);
    // 直向織紋暗線
    x.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    x.lineWidth = Math.max(1.5, S / 90);
    for (let u = S / 12; u < S; u += S / 6) { x.beginPath(); x.moveTo(u, 0); x.lineTo(u, S); x.stroke(); }
    // 金色滾邊
    x.strokeStyle = '#d8b24d';
    x.lineWidth = Math.max(2, S / 55);
    x.strokeRect(5, 5, S - 10, S - 10);
    return;
  }

  // 羊皮聖帶：米白底刻紅色聖符文（呼應圖中垂帶上的赤色文字）。
  if (variant === 'parch' || variant === 'tabard') {
    const grad = x.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, '#f0e4bb');
    grad.addColorStop(0.5, '#e2d09b');
    grad.addColorStop(1, '#c9b277');
    x.fillStyle = grad;
    x.fillRect(0, 0, S, S);
    // 上下金色橫飾條
    x.fillStyle = '#c9a13d';
    x.fillRect(0, 0, S, S * 0.06);
    x.fillRect(0, S * 0.94, S, S * 0.06);
    // 紅色聖符文筆劃
    x.strokeStyle = 'rgba(150, 25, 20, 0.75)';
    x.lineWidth = Math.max(2, S / 70);
    for (let r = 0; r < 6; r++) {
      const y0 = S * (0.14 + r * 0.13);
      x.beginPath();
      x.moveTo(S * 0.32, y0); x.lineTo(S * 0.68, y0);
      x.moveTo(S * 0.5, y0 - S * 0.045); x.lineTo(S * 0.5, y0 + S * 0.045);
      x.moveTo(S * 0.40, y0 + S * 0.03); x.lineTo(S * 0.44, y0 + S * 0.055);
      x.stroke();
    }
    return;
  }

  // 黑袍布料 (robe / cloth / body)：近黑深灰 + 淡金聖紋暗花。
  const grad = x.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, '#141414');
  grad.addColorStop(0.5, '#20201e');
  grad.addColorStop(1, '#131312');
  x.fillStyle = grad;
  x.fillRect(0, 0, S, S);
  // 淡金菱格暗花
  x.strokeStyle = 'rgba(201, 161, 61, 0.10)';
  x.lineWidth = Math.max(1, S / 120);
  const step = S / 6;
  for (let i = -S; i < S * 2; i += step) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i + S, S); x.stroke();
    x.beginPath(); x.moveTo(i + S, 0); x.lineTo(i, S); x.stroke();
  }
  // 邊緣淡金縫線
  x.strokeStyle = 'rgba(201, 161, 61, 0.35)';
  x.lineWidth = Math.max(1.5, S / 80);
  x.strokeRect(4, 4, S - 8, S - 8);
}
