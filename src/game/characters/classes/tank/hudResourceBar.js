import { FURY_MAX } from './constants.ts';
import { pct, setStyle, setText } from '../../../render3d/hud/dom.js';
import { registerHudResourceBar } from '../../../render3d/hud/resourceBars.js';

registerHudResourceBar({
  id: 'fury',
  slotId: 'primary',
  className: 'fury',
  order: 10,
  matches({ character }) {
    return !!(character && character.talent && character.talent.id === 'bulwark');
  },
  update({ player, character }, slot) {
    const fury = player.fury || 0;
    setStyle(slot.fill, 'width', pct(Math.min(1, fury / FURY_MAX)));
    slot.wrap.classList.toggle('boiling', fury >= (character.talent.threshold ?? 55));
    setText(slot.text, `怒氣 ${Math.floor(fury)}`);
  },
});
