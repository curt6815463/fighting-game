import { registerWorldOverlay } from '../../../render3d/worldOverlays.js';
import { createFighterChiLayer } from './chiOverlay.js';

registerWorldOverlay({
  id: 'fighter-chi',
  create(scene) {
    const layer = createFighterChiLayer(scene);
    return {
      sync(state, dt, getEntityPos) {
        layer.sync(state.players, dt, getEntityPos);
      },
      dispose: layer.dispose,
    };
  },
});
