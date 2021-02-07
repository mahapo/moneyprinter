import { MoneyPrinter } from '../src'

describe('MoneyPrinter', () => {
  it('Buy', () => {
    const strategy = new MoneyPrinter(
      {
        ratio: 2,
        leverage: 100,
        symbol: '',
        maxSteps: 6,
        percentOfMaxRange: 80,
        risk: 100
      },
      false
    )

    expect(strategy.currentOrders.length).toBe(0)

    strategy.onSignal({ price: 1000, timestamp: 0, amount: 100 })
    console.log(strategy.longZoneOrders)
  })
})
