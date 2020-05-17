import { ZoneRecovery } from "../src/models/ZoneRecovery";

describe("ZoneRecovery", () => {
  //    Ratio 2
  //   ┌─────────┬────────┬───────┬────────┬─────────────┐
  //   │ (index) │ factor │ total │ profit │ profitTotal │
  //   ├─────────┼────────┼───────┼────────┼─────────────┤
  //   │    0    │   1    │   1   │   1    │      1      │
  //   │    1    │   2    │   3   │   2    │      1      │
  //   │    2    │   4    │   7   │   4    │      1      │
  //   │    3    │   8    │  15   │   8    │      1      │
  //   │    4    │   16   │  31   │   16   │      1      │
  //   │    5    │   32   │  63   │   32   │      1      │
  //   │    6    │   64   │  127  │   64   │      1      │
  //   │    7    │  128   │  255  │  128   │      1      │
  //   │    8    │  256   │  511  │  256   │      1      │
  //   │    9    │  512   │ 1023  │  512   │      1      │
  //   └─────────┴────────┴───────┴────────┴─────────────┘
  test("Ratio: 2: First Step", () => {
    expect(ZoneRecovery.calcStep(0, 2).total).toBe(1);
    expect(ZoneRecovery.calcStep(0, 2).factor).toBe(1);
    expect(ZoneRecovery.calcStep(0, 2).profit).toBe(1);
    expect(ZoneRecovery.calcStep(0, 2).profitTotal).toBe(1);
  });
  test("Ratio: 3: First Step", () => {
    expect(ZoneRecovery.calcStep(0, 3).total).toBe(1);
    expect(ZoneRecovery.calcStep(0, 3).factor).toBe(1);
    expect(ZoneRecovery.calcStep(0, 3).profit).toBe(2);
    expect(ZoneRecovery.calcStep(0, 3).profitTotal).toBe(2);
  });
});
