import { StrategyBase } from '../StrategyBase'
import { ZoneRecovery } from './ZoneRecovery'
import { OrderFutures } from '@moneyprinter/models'

/*
  1. Place Buy_0 / Sell_0 

  === ON BUY filled ===

  2. Delete Sell_0
  3. Set StopLoss_0 (S) and TakeProfit_0 (S)

  === on stopLoss ===

  2. Delete TakeProfit_0
  3. Set StopLoss_1 (B) and TakeProfit_1 (B)

*/
export class MoneyPrinter extends StrategyBase {
  percentOfMaxRange: number = 80
  percentSlipperage: number = 0.01

  options = {
    price: 0,
    timestamp: 0,
    amount: 0,
    leverage: 100,
    symbol: '',
    ratio: 2,
    maxSteps: 6
  }

  stats = {
    countMax: 0,
    amountMax: 0,
    amountMin: Infinity
  }

  side: string

  longZone: ZoneRecovery
  shortZone: ZoneRecovery
  longZoneOrders: OrderFutures[]
  shortZoneOrders: OrderFutures[]

  priceRange: number
  priceTop: number
  priceBottom: number

  currentOrders = []
  currentOrder: OrderFutures

  constructor(options, public isLive = true) {
    super()

    this.percentOfMaxRange = 40

    this.options = {
      ...this.options,
      ...options
    }
  }

  onSignal({ price, timestamp, amount }) {
    this.options = {
      ...this.options,
      amount,
      timestamp
    }

    const percent = 20
    this.priceRange = (percent / 100 / this.options.leverage) * price
    this.priceTop = price + this.priceRange / 2
    this.priceBottom = price - this.priceRange / 2

    // Long
    this.longZone = new ZoneRecovery(
      this.priceTop,
      this.options.leverage,
      this.options.ratio,
      'buy'
    )
    this.longZoneOrders = this.longZone.createOrders(
      this.options.maxSteps,
      this.options.symbol,
      amount,
      timestamp,
      this.isLive
    )
    this.currentOrders.push(this.longZoneOrders[0])

    // Short
    this.shortZone = new ZoneRecovery(
      this.priceBottom,
      this.options.leverage,
      this.options.ratio,
      'sell'
    )
    this.shortZoneOrders = this.shortZone.createOrders(
      this.options.maxSteps,
      this.options.symbol,
      amount,
      timestamp,
      this.isLive
    )
    this.currentOrders.push(this.shortZoneOrders[0])
  }

  onOrderFilled(order: OrderFutures) {
    order.filled = order.amount

    this.side = order.side
    this.currentOrder = order
    this.currentOrders = this.currentOrders.filter(
      (order: OrderFutures) => order.side === this.side
    )
    // if (this.countFilled === 1) {
    //   // this.currentOrder.filled = this.currentOrder.amount
    //   // this.currentOrder = this.createHedgOrder()
    //   // if (otherSide) otherSide.status = 'canceled'
    // } else {
    //   this.reset()
    // }

    // if (this.countFilled < this.options.maxSteps) {
    //   // Fix for Backtester
    //   order.status = 'canceled'
    //   this.currentOrder.filled = this.currentOrder.amount
    //   this.currentOrders.push(this.currentOrder)
    // } else {
    //   this.onOrderDone(order, true)
    // }

    // this.stats.amountMax = Math.max(this.stats.amountMax, order.amount)
    // this.stats.amountMin = Math.min(this.stats.amountMin, order.amount)
    // this.stats.countMax = Math.max(this.stats.countMax, this.countFilled)
  }

  onStopLoss(order: OrderFutures) {
    order.status = 'closed'
    order.filled = order.amount
    this.currentOrder = this.createHedgOrder()
    if(this.currentOrder) {
      this.currentOrders.push(this.currentOrder)
      this.currentOrder.filled = this.currentOrder.amount
    } else {
      if (this.isLive)
        console.log('Max steps reached', this.countFilled)
      this.reset()
    }
  }

  // TODO: Refactor this shit
  onTakeProfit(order: OrderFutures, win = false) {
    order.status = 'closed'
    this.currentOrders.forEach((p: OrderFutures) => {
      if (p.status === 'open') p.status = 'canceled'
    })
    this.reset()
  }
  
  reset() {
    this.options.timestamp = Math.random()
    this.orders.push(...this.currentOrders)
    this.currentOrder = null
    this.currentOrders = []
  }

  printActiveOrders() {
    this.currentOrders.forEach(p => {
      p.print()
    })
  }

  createHedgOrder(): OrderFutures {
    return this.side === 'buy'
      ? this.longZoneOrders[this.countFilled]
      : this.shortZoneOrders[this.countFilled]
  }

  get profitTotal() {
    return [...this.currentOrders, ...this.orders].reduce((r, p) => {
      return r + p.closedProfit
    }, 0)
  }

  get countFilled(): number {
    return this.currentOrders.filter((order: OrderFutures) => order.filled > 0)
      .length
  }

  get currentStep() {
    if (this.isLive)
      return ZoneRecovery.calcStep(this.countFilled, this.options.ratio)
    return ZoneRecovery.calcStep(this.countFilled, this.options.ratio)
  }
}
