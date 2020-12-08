import { Order, Trade, Fee } from 'ccxt'
import * as colors from 'colors/safe'

export class OrderFutures implements Order {
  // CCXT Types
  id: string
  // clientOrderId: string
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
  timestampFilled: number
  timestampExit: number
  priceExit: number

  _stopLoss: number
  takeProfit: number

  maxLossPercent = 10

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

  checkIfTriggersTakeProfit(price: number) {
    return (
      (this.side === 'buy' && this.takeProfitPrice <= price) ||
      (this.side === 'sell' && this.takeProfitPrice >= price)
    )
  }

  checkIfTriggersStopLoss(price: number) {
    return (
      (this.side === 'buy' && this.stopLoss >= price) ||
      (this.side === 'sell' && this.stopLoss <= price)
    )
  }

  print() {}

  clone(): OrderFutures {
    const order = new OrderFutures({
      price: this.price,
      amount: this.amount,
      leverage: this.leverage,
      side: this.side,
      symbol: this.symbol,
      timestamp: this.timestamp,
      ratio: this.ratio
    })
    order.takeProfit = this.takeProfit
    order.stopLoss = this.stopLoss
    return order
  }

  get clientOrderId(): string {
    let options = [this.timestamp, this.leverage, this.side, this.ratio]
    // .map((n) => (isInt(n) ? n.toString(32) : n));
    return Object.values(options).join('-')
  }

  get priceDeltaLoss() {
    return (this.maxLossPercent / 100 / this.leverage) * this.price
  }

  get priceDeltaProfit() {
    return this.priceDeltaLoss * this.ratio
  }

  set stopLoss(stopLoss) {
    this._stopLoss = stopLoss
  }

  get stopLoss() {
    return this._stopLoss
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

  get closedProfit() {
    if (this.priceExit && this.winTrade)
      return this.priceDeltaProfit / this.amount
    else if (this.priceExit && !this.winTrade)
      return -this.priceDeltaLoss / this.amount
    return 0
  }

  get winTrade() {
    return this.side === 'buy'
      ? this.priceExit >= this.price
      : this.priceExit <= this.price
  }

  toString(): string {
    const colored = this.side === 'buy' ? colors.green('L') : colors.red('S')
    return `${colored} ${this.symbol} ${this.amount} @ ${this.price} TP:${this.takeProfit} SL:${this.stopLoss} ${this.clientOrderId}`
  }
}
