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
    order.amount = 1
    order.price = 10000
    order.priceExit = 11000
    // expect(order.pnl).toBe(10)
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
})
