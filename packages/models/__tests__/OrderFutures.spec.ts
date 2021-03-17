import { OrderFutures } from '../src'

describe('Order Futures', () => {
  let options = {
    price: 10000,
    leverage: 50,
    ratio: 2,
    amount: 100
  }
  let order

  beforeAll(() => {
    order = new OrderFutures(options)
  })

  test('Buy', () => {
    order.side = 'buy'
    order.ratio = 2
    order.leverage = 100
    order.amount = 5968.98
    order.price = 55268.29
    order.priceExit = 55284.67
    expect(order.fees.toFixed(3)).toBe('2.388')
    expect(order.profit.toFixed(3)).toBe('1.769')
    // expect(order.priceDeltaProfit).toBe(200)
    // expect(order.stopLossPrice).toBe(9900)
    // expect(order.takeProfitPrice).toBe(10200)
    // order.ratio = 5
    // expect(order.stopLossPrice).toBe(9900)
    // expect(order.takeProfitPrice).toBe(10500)
    // order.leverage = 10
    // expect(order.stopLossPrice).toBe(9500)
    // expect(order.takeProfitPrice).toBe(12500)
  })

  test('Sell', () => {
    order.side = 'sell'
    order.ratio = 2
    order.leverage = 50
    // expect(order.priceDeltaLoss).toBe(100)
    // expect(order.priceDeltaProfit).toBe(200)
    // order.ratio = 5
    // expect(order.stopLossPrice).toBe(10100)
    // expect(order.takeProfitPrice).toBe(9500)
  })

  test('Trailing stop: Buy', () => {
    order.side = 'buy'
    order.ratio = 2
    order.leverage = 50
    order.stopLoss = 9500
    order.callbackRate = 0.05
    order.priceActivation = 10500
    order.updateTrailingStop(10500)
    expect(order.stopLoss).toBe(9975)
    order.updateTrailingStop(10200)
    expect(order.stopLoss).toBe(9975)
  })

  test('Trailing stop: Sell', () => {
    order.side = 'sell'
    order.ratio = 2
    order.leverage = 50
    order.stopLoss = 10500
    order.callbackRate = 0.05
    order.priceActivation = 9500
    order.updateTrailingStop(10500)
    expect(order.stopLoss).toBe(10500)
    order.updateTrailingStop(10200)
    expect(order.stopLoss).toBe(10500)
  })
})
