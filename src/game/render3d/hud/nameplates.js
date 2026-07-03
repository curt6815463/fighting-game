const DECORATORS = [];

export function registerNameplateDecorator(def) {
  if (!def || !def.id) return;
  const existing = DECORATORS.findIndex((decorator) => decorator.id === def.id);
  if (existing >= 0) DECORATORS[existing] = def;
  else DECORATORS.push(def);
  DECORATORS.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getNameplateDecorators() {
  return DECORATORS;
}
