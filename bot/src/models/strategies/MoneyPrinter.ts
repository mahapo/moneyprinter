import { StrategyBase } from './StrategyBase'
import { OrderFutures, ZoneRecovery } from '..'

export class MoneyPrinter extends StrategyBase {
  static idKeys = [
    'id',
    'time',
    'price',
    'priceTop',
    'priceBottom',
    'amount',
    'leverage',
    'count',
    'ratio'
  ]

  percentOfMaxRange: number = 80
  percentSlipperage: number = 0.01

  options = {
    price: 0,
    timestamp: 0,
    amount: 0,
    leverage: 100,
    symbol: '',
    ratio: 2
  }

  stats = {
    countMax: 0,
    amountMax: 0,
    amountMin: Infinity
  }

  side: string

  long: OrderFutures
  short: OrderFutures
  lastOrder: OrderFutures

  priceRange: number
  priceTop: number
  priceBottom: number

  currentOrders = []
  currentOrder: OrderFutures

  maxSteps: number = 20

  isLive: boolean

  constructor(private runner, options) {
    super()
    this.isLive = !!this.runner?.account

    this.percentOfMaxRange = 20

    this.options = {
      ...this.options,
      ...options
    }
  }

  async run(tick) {
    if (!this.currentOrders.length) {
      this.runner.onSignal(tick)
    }
  }

  onSignal({ price, timestamp, amount }) {
    this.options = {
      ...this.options,
      amount,
      timestamp
    }

    this.long = new OrderFutures({
      ...this.options,
      side: 'buy',
      price,
      timestamp,
      amount
    })
    this.short = new OrderFutures({
      ...this.options,
      side: 'sell',
      price,
      timestamp,
      amount
    })

    // this.priceRange = this.short.priceDeltaLoss * (this.percentOfMaxRange / 100)
    this.priceRange = this.long.priceDeltaLoss

    this.priceTop = price + this.priceRange / 2
    this.priceBottom = price - this.priceRange / 2

    this.long.price = this.short.stopLoss = this.priceTop
    this.short.price = this.long.stopLoss = this.priceBottom

    this.currentOrders.push(this.long)
    this.currentOrders.push(this.short)

    return this.currentOrders
  }

  onOrderFilled(order: OrderFutures) {
    order.filled = order.amount

    if (this.countFilled === 1) {
      this.side = order.side
      let otherSide: OrderFutures = this.currentOrders.find(
        (order: OrderFutures) => order.side !== this.side
      )
      if (otherSide) otherSide.status = 'canceled'
    }

    if (this.countFilled < this.maxSteps) {
      let newOrder = this.createHedgOrder()

      if (this.isLive) {
        // newOrder.stopLossSet = true
        newOrder.amount = Math.round(
          this.options.amount * this.currentStep.factor + order.amount
        )
      } else {
        newOrder.amount = this.options.amount * this.currentStep.factor
      }
      this.currentOrders.push(newOrder)
    } else if (this.countFilled === this.maxSteps) {
      // order.stopLossSet = false
    } else {
      // order.stopLossSet = false
      console.log('onOrderDone')
      this.onOrderDone(order, true)
    }

    this.stats.amountMax = Math.max(this.stats.amountMax, order.amount)
    this.stats.amountMin = Math.min(this.stats.amountMin, order.amount)
    this.lastOrder = order
    this.stats.countMax = Math.max(this.stats.countMax, this.countFilled)
  }

  onOrderDone(order: OrderFutures, win = false) {
    order.status = 'closed'
    if (win || this.countFilled === this.maxSteps) {
      this.currentOrders.forEach((p: OrderFutures) => {
        if (p.status === 'open') p.status = 'canceled'
      })

      this.options.timestamp = Math.random()
      this.orders.push(...this.currentOrders)
      this.currentOrders = []
      if (!win && this.isLive)
        console.log('Max steps reached', this.countFilled)
    }
    if (this.countFilled > this.maxSteps) {
      console.log('sdsd')
      this.options.timestamp = Math.random()
      this.orders.push(...this.currentOrders)
      this.currentOrders = []
    }
  }

  printActiveOrders() {
    this.currentOrders.forEach(p => {
      p.print()
    })
  }

  createHedgOrder(): OrderFutures {
    return this.nextSide !== 'buy' ? this.long.clone() : this.short.clone()
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

  get nextSide() {
    return this.countFilled % 2 !== 0
      ? this.side
      : this.side === 'buy'
      ? 'sell'
      : 'buy'
  }

  get currentStep() {
    if (this.isLive)
      return ZoneRecovery.calcStep(this.countFilled, this.options.ratio)
    return ZoneRecovery.calcStep(this.countFilled, this.options.ratio)
  }
}
