const OVERLAYS = [];

export function registerWorldOverlay(def) {
  if (!def || !def.id || typeof def.create !== 'function') return;
  const existing = OVERLAYS.findIndex((overlay) => overlay.id === def.id);
  if (existing >= 0) OVERLAYS[existing] = def;
  else OVERLAYS.push(def);
  OVERLAYS.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function createWorldOverlayManager(scene) {
  const layers = OVERLAYS.map((overlay) => overlay.create(scene)).filter(Boolean);
  return {
    sync(state, dt, getEntityPos) {
      for (const layer of layers) {
        if (layer.sync) layer.sync(state, dt, getEntityPos);
      }
    },
    dispose() {
      for (const layer of layers) {
        if (layer.dispose) layer.dispose();
      }
    },
  };
}
