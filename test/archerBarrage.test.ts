import { describe, expect, it } from 'vitest';
import { executeAction } from '../src/game/actions/executor.ts';
import { getCharacter } from '../src/game/characters.js';
import { createInitialState, makePlayer } from '../src/game/entities/factories.ts';
import { EMPTY_INPUT } from '../src/game/input.js';
import { runPlayerPipeline } from '../src/game/systems/pipeline/index.ts';

describe('Archer barrage character hook', () => {
  it('fires from the character combat hook while keeping facing locked', () => {
    const state: any = createInitialState([], {}, { mode: 'ffa' });
    const archer: any = makePlayer('archer', 'Archer', 'archer', 300, 300, 1);
    const enemy: any = makePlayer('enemy', 'Enemy', 'warrior', 620, 300, 2);
    state.players = { [archer.id]: archer, [enemy.id]: enemy };

    archer.facing = Math.PI / 4;
    executeAction(state, archer, getCharacter('archer').ultimate, { source: 'ultimate' });
    expect(archer.actionFacingLock).toBe('archer-barrage');

    runPlayerPipeline(state, { [archer.id]: { ...EMPTY_INPUT, right: true } }, 0.11);

    expect(state.projectiles.length).toBeGreaterThan(0);
    expect(archer.facing).toBeCloseTo(Math.PI / 4, 6);
    expect(archer.barrage.remaining).toBeLessThan(3);
  });
});
