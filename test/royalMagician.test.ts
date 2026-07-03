// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/game/entities.js';
import { getCharacter } from '../src/game/characters.js';
import { executeAction } from '../src/game/actions/executor.ts';
import { tryAction } from '../src/game/actions/casting.ts';
import { updateProjectiles } from '../src/game/systems/projectiles.ts';
import { updateZones } from '../src/game/systems/zones.ts';
import { tickRoyalMagician } from '../src/game/characters/classes/royal-magician/talent.ts';

function buildState() {
  const state = createInitialState([
    { id: 'royal', name: 'Royal', charId: 'royal-magician', team: 1 },
    { id: 'target', name: 'Target', charId: 'mage', team: 2 },
  ], { freeMana: true, noCooldown: true }, { mode: 'team' });
  
  const caster = state.players.royal;
  const target = state.players.target;
  caster.x = 400; caster.y = 400; caster.facing = 0;
  caster.royalCards = []; // Start empty for testing
  target.x = 700; target.y = 400;
  target.maxHp = 500;
  target.hp = 500;
  return state;
}

function royal() {
  return getCharacter('royal-magician') as any;
}

function tickProjectiles(state, steps = 40, dt = 0.02) {
  for (let i = 0; i < steps; i++) updateProjectiles(state, dt);
}

function tickZones(state, steps = 80, dt = 0.05) {
  for (let i = 0; i < steps; i++) {
    state.time += dt;
    updateZones(state, dt);
  }
}

describe('royal magician', () => {
  it('registers with the planned skill actions', () => {
    const c = royal();
    expect(c.name).toBe('皇家魔術師');
    expect(c.basic.type).toBe('projectile');
    expect(c.skill1.type).toBe('royal_card_fan');
    expect(c.skill2.type).toBe('royal_hat_trick');
    expect(c.ultimate.type).toBe('royal_theater');
  });

  it('basic flying card applies encore and draws card', () => {
    const state = buildState();
    const caster = state.players.royal;
    const target = state.players.target;

    expect(caster.royalCards.length).toBe(0);

    executeAction(state, caster, royal().basic, { source: 'basic' });
    tickProjectiles(state, 22);

    expect(target.maxHp - target.hp).toBeCloseTo(royal().basic.dmg, 5);
    expect(target.effects.encore?.remaining).toBeGreaterThan(0);
    expect(caster.royalCards.length).toBe(1); // Drew 1 card
    expect(['R', 'B', 'J']).toContain(caster.royalCards[0]);
  });

  it('magic card fan calculates Poker Combos (Flush)', () => {
    const state = buildState();
    const caster = state.players.royal;
    const target = state.players.target;
    
    // Set up Flush hand combo
    caster.royalCards = ['R', 'R', 'R', 'R'];
    target.effects.encore = { remaining: 2, srcId: caster.id };

    executeAction(state, caster, { ...royal().skill1, count: 1, spread: 0 }, { source: 'skill1' });
    // Flush should clear hand cards
    expect(caster.royalCards.length).toBe(0);
    expect(state.projectiles.length).toBe(9); // 1 base card + 8 extra tracking cards
    
    tickProjectiles(state, 35);

    // Total Dmg = 1 base Flush card (26) + 8 homing Flush cards (13 * 8 = 104) + encoreDmg (12) = 142
    const expectedDmg = 142;
    expect(target.maxHp - target.hp).toBeCloseTo(expectedDmg, 5);
    expect(target.effects.encore).toBeUndefined();
    expect(target.effects.root?.remaining).toBeGreaterThan(0); // Rooted by Flush
  });

  it('magic hat trick deploys magic hat and teleports on second cast', () => {
    const state = buildState();
    const caster = state.players.royal;

    // 1st cast: Deploy Hat
    executeAction(state, caster, royal().skill2, { source: 'skill2' });

    const hat = state.zones.find((z) => z.royalHat);
    expect(hat).toBeTruthy();
    expect(hat.x).toBeCloseTo(580, 5); // 400 + 180
    expect(hat.y).toBeCloseTo(400, 5);
    expect(hat.lifetime).toBeGreaterThan(0);

    // 2nd cast: Teleport swap
    executeAction(state, caster, royal().skill2, { source: 'skill2' });
    
    expect(caster.x).toBeCloseTo(580, 5); // Caster moved to hat
    expect(hat.lifetime).toBe(0); // Hat consumed
  });

  it('card fan passing through active magic hat redirects and empowers', () => {
    const state = buildState();
    const caster = state.players.royal;
    const target = state.players.target;

    // Deploy hat at 580, 400
    executeAction(state, caster, royal().skill2, { source: 'skill2' });
    
    target.x = 760;
    target.y = 400;
    caster.royalCards = []; // No hand combo (High card 1.0x)

    executeAction(state, caster, { ...royal().skill1, count: 1, spread: 0 }, { source: 'skill1' });
    expect(state.projectiles.length).toBe(1);
    
    tickProjectiles(state, 35);

    // Card fan passes through hat and gets magic-shuffled to Flush (2.2x dmg)
    const expectedDmg = Math.round(royal().skill1.empoweredDmg * 2.2);
    expect(target.maxHp - target.hp).toBeCloseTo(expectedDmg, 5);
    expect(state.fx.some((fx) => fx.vfx === 'royal_card_empower')).toBe(true);
    expect(target.effects.root?.remaining).toBeGreaterThan(0); // Also gets rooted
  });

  it('royal theater deploys remotely on magic hat and pulls Encore targets', () => {
    const state = buildState();
    const caster = state.players.royal;
    const target = state.players.target;

    // 1. Deploy hat at 580, 400
    executeAction(state, caster, royal().skill2, { source: 'skill2' });
    
    // 2. Mark target with Encore, place target at 700, 400
    target.x = 700;
    target.y = 400;
    target.effects.encore = { remaining: 2, srcId: caster.id };

    // 3. Deploy ultimate
    executeAction(state, caster, royal().ultimate, { source: 'ultimate' });

    // The theater zone should be centered on the Hat (580, 400) instead of Caster (400, 400)
    const theater = state.zones.find((z) => z.vfx === 'royal_theater');
    expect(theater).toBeTruthy();
    expect(theater.x).toBeCloseTo(580, 5);
    expect(theater.y).toBeCloseTo(400, 5);

    // Target should have been pulled to the center (from 700 towards 580)
    expect(target.x).toBeLessThan(700);
    expect(target.x).toBeCloseTo(580 + (700 - 580) * 0.35, 5); // Pulled by 65%, so distance remains 35%
  });

  it('delay-triggers cooldown for Skill 2 (Hat Trick) in tryAction lifecycle', () => {
    const state = buildState();
    const caster = state.players.royal;
    
    // 1. First Cast (Throws Hat)
    tryAction(state, caster, 'skill2');
    
    const hat = state.zones.find((z) => z.royalHat);
    expect(hat).toBeTruthy();
    // Cooldown is set to 0.8s (GCD override to prevent instant double-cast)
    expect(caster.cd.skill2).toBeCloseTo(0.8, 5);
    expect(caster.royalHatActive).toBe(true);

    // 2. Second Cast (Teleports and Swap)
    caster.cd.skill2 = 0; // Clear GCD cooldown in tests since time doesn't tick automatically
    tryAction(state, caster, 'skill2');
    expect(hat.lifetime).toBe(0); // Hat consumed

    // Tick the character talent state update
    tickRoyalMagician(state, caster, 0.02);

    // Cooldown triggers actual 6.0 seconds CD
    expect(caster.cd.skill2).toBeCloseTo(6.0, 5);
    expect(caster.royalHatActive).toBe(false);
  });

  it('Joker cards (Chaos Trump) triggers Flush combo and scramble effects', () => {
    const state = buildState();
    const caster = state.players.royal;
    const target = state.players.target;

    // Set up Joker hand combo
    caster.royalCards = ['J'];
    target.effects.encore = { remaining: 2, srcId: caster.id };

    executeAction(state, caster, { ...royal().skill1, count: 1, spread: 0 }, { source: 'skill1' });
    // Hand should be cleared
    expect(caster.royalCards.length).toBe(0);
    // Should trigger Flush count (1 base card + 12 extra tracking cards)
    expect(state.projectiles.length).toBe(13);

    // Homing projectiles should have royalJokerHoming = true
    const homingProj = state.projectiles.find((p) => p.homing);
    expect(homingProj).toBeTruthy();
    expect(homingProj.royalJokerHoming).toBe(true);

    // Tick projectiles so they hit
    tickProjectiles(state, 35);

    // Target should have scramble (錯亂) effect from the Joker homing projectile hit
    expect(target.effects.scramble?.remaining).toBeGreaterThan(0);
  });

  it('5th card penalty (Overdraw Shield) triggers on drawing 5th card', () => {
    const state = buildState();
    const caster = state.players.royal;
    const target = state.players.target;

    // Magician starts with 4 cards
    caster.royalCards = ['R', 'B', 'R', 'B'];

    // Caster hits target with basic card to draw 5th card
    executeAction(state, caster, royal().basic, { source: 'basic' });
    tickProjectiles(state, 22);

    // Caster should trigger Overdraw Backlash:
    // 50 shield, 3.0 duration, 0.70 slow factor, 0.90 dmg_reduce factor
    expect(caster.shield).toBe(50);
    expect(caster.effects.slow?.remaining).toBeGreaterThan(0);
    expect(caster.effects.slow?.factor).toBeCloseTo(0.70, 5);
    expect(caster.effects.dmg_reduce?.remaining).toBeGreaterThan(0);
    expect(caster.effects.dmg_reduce?.factor).toBeCloseTo(0.90, 5);

    // Hand should be discarded (empty)
    expect(caster.royalCards.length).toBe(0);
  });
});
