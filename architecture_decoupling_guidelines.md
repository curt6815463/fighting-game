# Character and Boss Decoupling Guidelines

This guide captures the cleanup rules learned from decoupling character/Boss-specific behavior out of shared fighting-game systems.

## Core Rule

Shared systems should know generic concepts, not specific classes, bosses, resources, VFX keys, or minion ids.

Good shared concepts:
- `character.combatTick(state, player, dt)`
- `snapshotFields`
- `playerSnapshotFields`
- `attachments`
- `customUpdate`
- `registerMinion(template)`
- `effect.freezeVfx`
- `zone.allyHealVfx`
- `projectile.healVfx`
- `actionFacingLock`

Suspicious shared concepts:
- `if (p.barrage)`
- `if (zone.vfx === 'healer_aura')`
- `vfx: 'mage_iceshard'` inside shared effect code
- `NET_PLAYER_FIELDS` containing `fury`, `chi`, or a boss marker
- shared render code animating `starOrbitShards`, `swordEnergyOrbs`, `falcon`, or `barrageWings`
- shared minion registry importing `src/game/bosses/<slug>/...`

## Where Class/Boss Logic Should Live

- Character action handlers:
  `src/game/characters/classes/<slug>/actions/<action>/index.ts`
- Character persistent combat state:
  character `combatTick`, loaded through `BaseCharacter`
- Character lifecycle/resource timers:
  character `tick` or colocated talent hooks
- Character HUD resources:
  `src/game/characters/classes/<slug>/hudResourceBar.js`
- Character model attachments and animation:
  `src/game/characters/classes/<slug>/model.ts` via `attachments` and `customUpdate`
- Character VFX choices:
  class action/effect data, projectile data, zone data, or class VFX modules
- Boss-specific actions:
  `src/game/bosses/<slug>/action.ts`
- Boss-specific minions:
  `src/game/bosses/<slug>/<minion>.ts` registering through `registerMinion`
- Boss/player network markers:
  boss `snapshotFields` and `playerSnapshotFields`

## Shared Systems Should Expose Hooks

When a shared system needs to support a special case, add a generic data hook instead of naming the class.

Examples:
- `movement.ts` should check `p.actionFacingLock`, not `p.barrage`.
- `network/snapshot.ts` should merge fields declared by `getCharacter(p.charId)`, not list every class resource.
- `render3d/models.js` should attach `parts.attachments` and call `parts.customUpdate`, not animate each class attachment.
- `systems/zones.ts` should use `zone.allyHealVfx`, not infer behavior from a healer VFX key.
- `systems/projectiles.ts` should use projectile `healVfx` or `detonate.effectKind`, not hardcode a class projectile.

## Audit Checklist

Run searches from the repo root and inspect matches outside the owning class/Boss folder.

```bash
rg -n "barrage|fury|chi|magicSwordsman|starOrbit|royalCards|_falcon|magneticPolarity|magnetOverload" src/game --glob '!src/game/characters/classes/**' --glob '!src/game/bosses/**'
rg -n "(mage_iceshard|bard_heal_hit|healer_aura_heal_tick|archer_parasite|elem_frost)" src/game --glob '!src/game/characters/classes/**' --glob '!src/game/bosses/**'
rg -n "src/game/bosses|../../bosses|bosses/" src/game/characters src/game/actions src/game/systems src/game/entities src/game/render3d
rg -n "charId === -|makeBoss\\([^\\n]*-\\d|MINION_ID" src/game test
```

Also inspect:
- `src/game/actions/runtime.ts`
- `src/game/systems/pipeline/player.ts`
- `src/game/systems/movement.ts`
- `src/game/network/snapshot.ts`
- `src/game/entities/factories.ts`
- `src/game/render3d/models.js`
- `src/game/render3d/hud.js`
- `src/game/characters/minions/index.ts`
- `src/game/types/actions.ts`
- `src/game/types/entities.ts`

## Refactor Pattern

1. Identify the owning class or Boss.
2. Move behavior/data to the owner folder.
3. Replace the shared branch with a generic hook or data field.
4. Keep synchronized entity state as plain JSON data.
5. Add or update tests that lock the new generic boundary.
6. Search again for the old coupling string.

## Testing Expectations

At minimum, run focused tests for touched boundaries:
- Registry/action handler tests
- Network snapshot tests
- HUD/resource-bar tests
- Boss tests for moved minions or boss markers
- A regression test for any moved per-tick class behavior

Before finishing:

```bash
npm run test:run
npm run build
git diff --check
```
