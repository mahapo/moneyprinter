import { Order, Trade, Fee } from 'ccxt'

export class OrderFutures implements Order {
  // CCXT Types
  id: string
  clientOrderId: string
  datetime: string
  timestamp: number
  lastTradeTimestamp: number
  status: 'open' | 'closed' | 'canceled'
  symbol: string
  type: string
  timeInForce?: string
  side: 'buy' | 'sell'
  price: number
  average?: number
  amount: number
  filled: number
  remaining: number
  cost: number
  trades: Trade[]
  fee: Fee
  info: any

  // Custom Types
  leverage: number
  ratio: number

  maxLossPercent = 50

  constructor(options) {
    this.status = 'open'
    this.filled = 0
    this.price = options.price
    this.timestamp = options.timestamp
    this.amount = options.amount
    this.symbol = options.symbol
    this.side = options.side
    this.type = options.type

    this.leverage = options.leverage
    this.ratio = options.ratio
  }

  checkIfFilled(price: number) {
    return (
      (this.side === 'buy' && this.price <= price) ||
      (this.side === 'sell' && this.price >= price)
    )
  }

  get priceDeltaLoss() {
    return (this.maxLossPercent / 100 / this.leverage) * this.price
  }

  get priceDeltaProfit() {
    return this.priceDeltaLoss * this.ratio
  }

  get stopLossPrice(): number {
    return this.side === 'buy'
      ? this.price - this.priceDeltaLoss
      : this.price + this.priceDeltaLoss
  }

  get takeProfitPrice(): number {
    return this.side === 'buy'
      ? this.price + this.priceDeltaProfit
      : this.price - this.priceDeltaProfit
  }
}
