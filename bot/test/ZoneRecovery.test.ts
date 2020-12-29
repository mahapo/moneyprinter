import { ZoneRecovery } from '../src/models/ZoneRecovery'

describe('ZoneRecovery', () => {
  // Ratio 2
  // ┌─────────┬────────┬────────┬───────┬─────────────┐
  // │ (index) │ factor │ profit │ total │ profitTotal │
  // ├─────────┼────────┼────────┼───────┼─────────────┤
  // │    0    │   1    │   1    │   1   │      1      │
  // │    1    │   2    │   2    │   3   │      1      │
  // │    2    │   4    │   4    │   7   │      1      │
  // │    3    │   8    │   8    │  15   │      1      │
  // │    4    │   16   │   16   │  31   │      1      │
  // │    5    │   32   │   32   │  63   │      1      │
  // │    6    │   64   │   64   │  127  │      1      │
  // │    7    │  128   │  128   │  255  │      1      │
  // │    8    │  256   │  256   │  511  │      1      │
  // │    9    │  512   │  512   │ 1023  │      1      │
  // └─────────┴────────┴────────┴───────┴─────────────┘
  test('Ratio: 2: First Step', () => {
    expect(ZoneRecovery.calcStep(0, 2).total).toBe(1)
    expect(ZoneRecovery.calcStep(0, 2).factor).toBe(1)
    expect(ZoneRecovery.calcStep(0, 2).profit).toBe(1)
    expect(ZoneRecovery.calcStep(0, 2).profitTotal).toBe(1)
    expect(ZoneRecovery.calcStep(5, 2).profitTotal).toBe(1)
    expect(ZoneRecovery.calcStep(5, 2).factor).toBe(32)
  })
  // ┌─────────┬──────────────┬─────────────┬───────────────┬─────────────┐
  // │ (index) │    factor    │   profit    │     total     │ profitTotal │
  // ├─────────┼──────────────┼─────────────┼───────────────┼─────────────┤
  // │    0    │      1       │      2      │       1       │      2      │
  // │    1    │     1.5      │      3      │      2.5      │      2      │
  // │    2    │     2.25     │     4.5     │     4.75      │      2      │
  // │    3    │    3.375     │    6.75     │     8.125     │      2      │
  // │    4    │    5.0625    │   10.125    │    13.1875    │      2      │
  // │    5    │   7.59375    │   15.1875   │   20.78125    │      2      │
  // │    6    │  11.390625   │  22.78125   │   32.171875   │      2      │
  // │    7    │  17.0859375  │  34.171875  │  49.2578125   │      2      │
  // │    8    │ 25.62890625  │ 51.2578125  │  74.88671875  │      2      │
  // │    9    │ 38.443359375 │ 76.88671875 │ 113.330078125 │      2      │
  // └─────────┴──────────────┴─────────────┴───────────────┴─────────────┘
  test('Ratio: 3: First Step', () => {
    expect(ZoneRecovery.calcStep(0, 3).total).toBe(1)
    expect(ZoneRecovery.calcStep(0, 3).factor).toBe(1)
    expect(ZoneRecovery.calcStep(0, 3).profit).toBe(2)
    expect(ZoneRecovery.calcStep(0, 3).profitTotal).toBe(2)
  })

  test('RecoveryZone', () => {
    const zone = new ZoneRecovery(10000, 50, 2, 'sell')
    // console.table(zone.calcZones(10))
  })
})
