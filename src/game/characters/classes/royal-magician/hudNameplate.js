import { registerNameplateDecorator } from '../../../render3d/hud/nameplates.js';

function cardHtml(suit) {
  let color = '#005f73';
  let char = '♠';
  let background = '#ffffff';
  let border = '1.5px solid #d4af37';
  let textShadow = 'none';

  if (suit === 'R') {
    color = '#d90429';
    char = '♦';
  } else if (suit === 'J') {
    color = '#ffffff';
    char = '🃏';
    background = 'linear-gradient(135deg, #7b2ff7, #ffd166)';
    border = '2px solid #ffffff';
    textShadow = '0 0 4px #7b2ff7';
  }

  return `<span style="
    display: inline-block;
    width: 16px;
    height: 24px;
    line-height: 24px;
    background: ${background};
    border: ${border};
    border-radius: 3.5px;
    color: ${color};
    font-weight: 900;
    font-size: 16px;
    text-align: center;
    margin: 0 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.6);
    font-family: 'Arial Black', Impact, sans-serif;
    text-shadow: ${textShadow};
  ">${char}</span>`;
}

registerNameplateDecorator({
  id: 'royal-magician-cards',
  adjustHeadY({ player, headY }) {
    return player.charId === 'royal-magician' ? headY + 24 : headY;
  },
  update({ player, plate, setHtml, setStyle }) {
    if (player.charId !== 'royal-magician' || !Array.isArray(player.royalCards) || player.royalCards.length === 0) {
      setStyle(plate.ncards, 'display', 'none');
      return;
    }
    setHtml(plate.ncards, player.royalCards.map(cardHtml).join(''));
    setStyle(plate.ncards, 'display', 'block');
    setStyle(plate.ncards, 'margin-bottom', '6px');
    setStyle(plate.ncards, 'text-align', 'center');
  },
});
