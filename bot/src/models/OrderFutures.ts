import { Order, Trade, Fee } from 'ccxt'
import * as colors from 'colors/safe'

export class OrderFutures implements Order {
  // CCXT Types
  id: string
  idStopLoss: string
  idTakeProfit: string
  // clientOrderId: string
  datetime: string
  timestamp: number
  lastTradeTimestamp: number
  status: 'open' | 'closed' | 'canceled'
  symbol: string
  type: string
  timeInForce?: string
  side: 'buy' | 'sell'
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

  price: number
  stopLoss: number
  takeProfit: number

  maxLossPercent = 50

  constructor(options, public slug = 0) {
    this.status = 'open'
    this.filled = 0
    this.price = options.price
    this.timestamp = options.timestamp
    this.amount = options.amount
    this.symbol = options.symbol
    this.side = options.side

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
      (this.side === 'buy' && this.takeProfit <= price) ||
      (this.side === 'sell' && this.takeProfit >= price)
    )
  }

  checkIfTriggersStopLoss(price: number) {
    return (
      (this.side === 'buy' && this.stopLoss >= price) ||
      (this.side === 'sell' && this.stopLoss <= price)
    )
  }

  print() {}

  clone(slug): OrderFutures {
    const order = new OrderFutures(
      {
        price: this.price,
        amount: this.amount,
        leverage: this.leverage,
        side: this.side,
        symbol: this.symbol,
        timestamp: this.timestamp,
        ratio: this.ratio
      },
      slug
    )
    // order.takeProfit = this.takeProfit
    order.stopLoss = this.stopLoss
    return order
  }

  get clientOrderId(): string {
    return [
      this.timestamp,
      this.leverage,
      this.ratio,
      this.side,
      this.slug
    ].join('-')
  }

  get clientOrderIdTP(): string {
    return this.clientOrderId + '-TP'
  }

  get clientOrderIdSL(): string {
    return this.clientOrderId + '-SL'
  }

  get priceDeltaLoss() {
    return (this.maxLossPercent / 100 / this.leverage) * this.price
  }

  get priceDeltaProfit() {
    return this.priceDeltaLoss * this.ratio
  }

  // set stopLoss(stopLoss) {
  //   this._stopLoss = stopLoss
  // }

  // get stopLoss() {
  //   return this._stopLoss
  // }

  // set takeProfit(takeProfit) {
  //   this._takeProfit = takeProfit
  // }

  // get takeProfit() {
  //   return this._takeProfit
  // }

  // get stopLossPrice(): number {
  //   return this.side === 'buy'
  //     ? this.price - this.priceDeltaLoss
  //     : this.price + this.priceDeltaLoss
  // }

  // get takeProfitPrice(): number {
  //   return this.side === 'buy'
  //     ? this.price + this.priceDeltaProfit
  //     : this.price - this.priceDeltaProfit
  // }

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
