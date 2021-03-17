import { ZoneRecovery } from '../src/MoneyPrinter/ZoneRecovery'

describe('ZoneRecovery', () => {
  // Ratio 2
  // ┌─────────┬────────┬───────┐
  // │ (index) │ factor │ total │
  // ├─────────┼────────┼───────┤
  // │    0    │   1    │   1   │
  // │    1    │   3    │   4   │
  // │    2    │   6    │  10   │
  // │    3    │   12   │  22   │
  // │    4    │   24   │  46   │
  // │    5    │   48   │  94   │
  // │    6    │   96   │  190  │
  // │    7    │  192   │  382  │
  // │    8    │  384   │  766  │
  // │    9    │  768   │ 1534  │
  //    └─────────┴────────┴───────┘
  test('Ratio: 2: First Step', () => {
    expect(ZoneRecovery.calcStep(0, 2).total).toBe(1)
    expect(ZoneRecovery.calcStep(0, 2).factor).toBe(1)
    expect(ZoneRecovery.calcStep(5, 2).factor).toBe(48)
  })
  // ┌─────────┬────────────┬─────────────┐
  // │ (index) │   factor   │    total    │
  // ├─────────┼────────────┼─────────────┤
  // │    0    │     1      │      1      │
  // │    1    │     2      │      3      │
  // │    2    │     3      │      6      │
  // │    3    │    4.5     │    10.5     │
  // │    4    │    6.75    │    17.25    │
  // │    5    │   10.125   │   27.375    │
  // │    6    │  15.1875   │   42.5625   │
  // │    7    │  22.78125  │  65.34375   │
  // │    8    │ 34.171875  │  99.515625  │
  // │    9    │ 51.2578125 │ 150.7734375 │
  // └─────────┴────────────┴─────────────┘
  test('Ratio: 3: First Step', () => {
    expect(ZoneRecovery.calcStep(0, 3).total).toBe(1)
    expect(ZoneRecovery.calcStep(0, 3).factor).toBe(1)
  })

  test('RecoveryZone', () => {
    const zone = new ZoneRecovery(10000, 75, 5.5, 'buy')
    zone.recoveryGapInitial = 30
    const orders1 = zone.createOrders(7, 'BTC/USDT', 1000, 2)
    const stats = {
      win: 0,
      loss: 0,
      fator: 0,
      winRound: 0,
      lossTotal: 0
    }
    for (const order of orders1) {
      order.priceExit = order.takeProfit
      stats.winRound = order.pnl
      stats.win = stats.winRound - stats.lossTotal

      order.priceExit = order.stopLoss
      stats.loss = order.pnl
      stats.lossTotal += stats.loss
      stats.fator = stats.win / stats.loss
      console.table(stats)
    }
  })
})
