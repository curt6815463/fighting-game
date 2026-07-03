import { pct, setStyle, setText } from '../../../render3d/hud/dom.js';
import { registerHudResourceBar } from '../../../render3d/hud/resourceBars.js';

registerHudResourceBar({
  id: 'sword-energy',
  slotId: 'secondary',
  className: 'sword-energy',
  order: 20,
  matches({ character }) {
    return !!(character && character.talent && character.talent.id === 'arcane_contract');
  },
  update({ player, character }, slot) {
    const max = character.talent.maxSwordEnergy || 5;
    const count = (player.magicSwordsman && player.magicSwordsman.swordEnergy) || 0;
    setStyle(slot.fill, 'width', pct(count / max));
    setText(slot.text, `劍氣 ${count}/${max}`);
  },
});
