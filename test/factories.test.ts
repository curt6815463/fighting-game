import { describe, expect, it } from 'vitest';
import { makeProjectile } from '../src/game/entities.js';

describe('entity factories', () => {
  it('keeps projectile skill metadata without coupling the factory to specific classes', () => {
    const projectile = makeProjectile('owner', 10, 20, 30, 40, {
      dmg: 12,
      radius: 8,
      lifetime: 1.5,
      color: '#fff',
      royalCardFan: true,
      glassSplitDmgMult: 1.35,
      lastMirrorId: 'mirror-1',
      hit: { target: true },
    });

    expect(projectile.royalCardFan).toBe(true);
    expect(projectile.glassSplitDmgMult).toBe(1.35);
    expect(projectile.lastMirrorId).toBe('mirror-1');
    expect(projectile.hit).toEqual({});
  });
});
