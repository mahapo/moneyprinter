import { MoneyPrinter } from '../src'

describe('MoneyPrinter', () => {
  it('Max step', () => {
    const strategy = new MoneyPrinter(
      {
        ratio: 2,
        leverage: 100,
        symbol: '',
        maxSteps: 2,
        percentOfMaxRange: 80,
        risk: 100
      },
      false
    )

    expect(strategy.currentOrders.length).toBe(0)

    strategy.onSignal({ price: 1000, timestamp: 0, amount: 100 })
    expect(strategy.currentOrders.length).toBe(2)
    expect(strategy.longZoneOrders.length).toBe(2)
    expect(strategy.shortZoneOrders.length).toBe(2)
    expect(strategy.countFilled).toBe(0)

    strategy.onOrderFilled(strategy.currentOrders[0])
    expect(strategy.currentOrder.slug).toMatch('0-1003')
    expect(strategy.countFilled).toBe(1)

    strategy.onStopLoss(strategy.currentOrder)
    expect(strategy.currentOrder.slug).toMatch('1-1003')
    expect(strategy.countFilled).toBe(2)

    strategy.onStopLoss(strategy.currentOrder)
    expect(strategy.countFilled).toBe(0)
    expect(strategy.currentOrder).toBe(null)
  })

  it('Max step', () => {
    const strategy = new MoneyPrinter(
      {
        ratio: 2,
        leverage: 100,
        symbol: '',
        maxSteps: 2,
        percentOfMaxRange: 80,
        risk: 100
      },
      false
    )

    expect(strategy.currentOrders.length).toBe(0)

    strategy.onSignal({ price: 1000, timestamp: 0, amount: 100 })
    expect(strategy.currentOrders.length).toBe(2)
    expect(strategy.longZoneOrders.length).toBe(2)
    expect(strategy.shortZoneOrders.length).toBe(2)
    expect(strategy.countFilled).toBe(0)

    strategy.onOrderFilled(strategy.currentOrders[1])
    expect(strategy.currentOrder.slug).toMatch('0-997')
    expect(strategy.countFilled).toBe(1)

    strategy.onStopLoss(strategy.currentOrder)
    expect(strategy.currentOrder.slug).toMatch('1-997')
    expect(strategy.countFilled).toBe(2)

    strategy.onTakeProfit(strategy.currentOrder)
    expect(strategy.countFilled).toBe(0)
    expect(strategy.currentOrder).toBe(null)
  })
})
