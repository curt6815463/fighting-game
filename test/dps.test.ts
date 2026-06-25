// 傷害／DPS 評估測試 —— **預設不執行**。
//
// 這不是行為回歸測試（那是 determinism.test.ts 的職責），而是「評估環境」：
// 量測每個角色的 DPS 與各技能輸出佔比，供 AI / 開發者檢視平衡。因為它會跑數十秒模擬、
// 輸出大量報表，故以環境變數 RUN_DPS 閘控，平時 `yarn test:run` 會整個 skip。
//
// 執行方式：
//   yarn dps                      # = RUN_DPS=1 vitest run test/dps.test.ts
//   RUN_DPS=1 yarn test:run       # 連同其他測試一起
//
// 調整量測參數請改下方 measureAll 的 opts，或在 dpsLab.ts 直接呼叫 measureCharacter。

import { describe, it, expect } from 'vitest';
import { measureCharacter, measureAll, formatReport, formatLeaderboard } from './dpsLab';
import { CHARACTERS } from '../src/game/characters.js';

const RUN = !!process.env.RUN_DPS;

describe.skipIf(!RUN)('DPS 評估環境', () => {
  it('持續輸出（sustained · 中性木人）排行榜 + 各角色技能佔比', () => {
    const rows = measureAll({ seconds: 20, mode: 'sustained', dummy: 'neutral' });

    console.log('\n=== 角色 DPS 排行榜（sustained / 中性木人 / 20s）===\n');
    console.log(formatLeaderboard(rows));
    console.log('\n=== 各角色技能輸出佔比 ===\n');
    for (const r of rows) console.log(formatReport(r) + '\n');

    // 健全性：每個角色都有正傷害輸出，且 perSkill 加總 == 總傷（歸因無遺漏/重複）。
    for (const r of rows) {
      expect(r.total, `${r.name} 應有傷害輸出`).toBeGreaterThan(0);
      const sum = r.perSkill.reduce((acc: number, p: any) => acc + p.dmg, 0);
      expect(Math.abs(sum - r.total), `${r.name} perSkill 加總應等於總傷`).toBeLessThan(1);
      const pctSum = r.perSkill.reduce((acc: number, p: any) => acc + p.pct, 0);
      expect(Math.abs(pctSum - 1), `${r.name} 佔比加總應為 1`).toBeLessThan(0.001);
    }
  });

  it('爆發輸出（burst · freeMana）排行榜', () => {
    const rows = measureAll({ seconds: 12, mode: 'burst', dummy: 'neutral' });
    console.log('\n=== 角色 DPS 排行榜（burst / freeMana / 中性木人 / 12s）===\n');
    console.log(formatLeaderboard(rows));
    for (const r of rows) expect(r.total).toBeGreaterThan(0);
  });

  it('對 Boss 靶輸出（sustained · boss 木人）排行榜', () => {
    const rows = measureAll({ seconds: 20, mode: 'sustained', dummy: 'boss' });
    console.log('\n=== 角色 DPS 排行榜（sustained / Boss 木人 / 20s）===\n');
    console.log(formatLeaderboard(rows));
    for (const r of rows) expect(r.total).toBeGreaterThan(0);
  });

  it('決定性：同 seed 兩次量測結果完全一致', () => {
    const a = measureCharacter(CHARACTERS[0].id, { seconds: 8, seed: 123 });
    const b = measureCharacter(CHARACTERS[0].id, { seconds: 8, seed: 123 });
    expect(a.total).toBe(b.total);
    expect(a.perSkill).toEqual(b.perSkill);
  });
});
