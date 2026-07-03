import { describe, expect, it } from 'vitest';
import '../src/game/render3d/hud/resourceBars/default.js';
import { getHudResourceBars, updateHudResourceBars } from '../src/game/render3d/hud/resourceBars.js';

function classList() {
  const classes = new Set<string>();
  return {
    toggle(name: string, value?: boolean) {
      if (value) classes.add(name);
      else classes.delete(name);
    },
    contains(name: string) {
      return classes.has(name);
    },
  };
}

function slot() {
  return {
    wrap: { style: {} as Record<string, string>, classList: classList() },
    fill: { style: {} as Record<string, string> },
    text: { textContent: '' },
  } as any;
}

describe('HUD resource bar registry', () => {
  it('registers default resource bars in render order', () => {
    expect(getHudResourceBars().map((bar: any) => bar.id)).toEqual(['fury', 'sword-energy', 'glass-mirrors']);
  });

  it('updates only matching character resource bars', () => {
    const primary = slot();
    const secondary = slot();

    updateHudResourceBars(
      {
        player: { fury: 60 },
        character: { talent: { id: 'bulwark', threshold: 55 } },
      },
      { primary, secondary },
    );

    expect(primary.wrap.style.display).toBe('');
    expect(primary.fill.style.width).toBe('60%');
    expect(primary.wrap.classList.contains('boiling')).toBe(true);
    expect(primary.text.textContent).toBe('怒氣 60');
    expect(secondary.wrap.style.display).toBe('none');
  });

  it('updates sword energy bars', () => {
    const primary = slot();
    const secondary = slot();

    updateHudResourceBars(
      {
        player: { magicSwordsman: { swordEnergy: 3 } },
        character: { talent: { id: 'arcane_contract', maxSwordEnergy: 6 } },
      },
      { primary, secondary },
    );

    expect(primary.wrap.style.display).toBe('none');
    expect(secondary.wrap.style.display).toBe('');
    expect(secondary.fill.style.width).toBe('50%');
    expect(secondary.text.textContent).toBe('劍氣 3/6');
  });

  it('updates glass mirror bars in the primary slot', () => {
    const primary = slot();
    const secondary = slot();

    updateHudResourceBars(
      {
        state: { zones: [
          { kind: 'glass_mirror', owner: 'p1', lifetime: 3 },
          { kind: 'glass_mirror', owner: 'p1', lifetime: 2 },
          { kind: 'glass_mirror', owner: 'p2', lifetime: 3 },
        ] },
        player: { id: 'p1' },
        character: { id: 'glass-astrologer', talent: { maxMirrors: 3 } },
      },
      { primary, secondary },
    );

    expect(primary.wrap.style.display).toBe('');
    expect(primary.fill.style.width).toBe('66.66666666666666%');
    expect(primary.wrap.classList.contains('boiling')).toBe(false);
    expect(primary.text.textContent).toBe('星鏡 2/3');
    expect(secondary.wrap.style.display).toBe('none');
  });
});
