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

  lastOrder: OrderFutures

  longZone: ZoneRecovery
  shortZone: ZoneRecovery
  longZoneOrders: OrderFutures[]
  shortZoneOrders: OrderFutures[]

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

    this.percentOfMaxRange = 40

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

    const percent = 40
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
      this.maxSteps,
      this.options.symbol,
      amount,
      timestamp
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
      this.maxSteps,
      this.options.symbol,
      amount,
      timestamp
    )
    this.currentOrders.push(this.shortZoneOrders[0])
  }

  onOrderFilled(order: OrderFutures) {
    order.filled = order.amount
    // TODO: Fix
    order.filled = 1

    if (this.countFilled === 1) {
      this.side = order.side
      let otherSide: OrderFutures = this.currentOrders.find(
        (order: OrderFutures) => order.side !== this.side
      )
      if (otherSide) otherSide.status = 'canceled'
    }

    if (this.countFilled < this.maxSteps) {
      this.lastOrder && (this.lastOrder.status = 'canceled')
      this.currentOrders.push(this.createHedgOrder())
    } else {
      this.onOrderDone(order, true)
    }

    this.stats.amountMax = Math.max(this.stats.amountMax, order.amount)
    this.stats.amountMin = Math.min(this.stats.amountMin, order.amount)
    this.lastOrder = order
    this.stats.countMax = Math.max(this.stats.countMax, this.countFilled)
  }

  // TODO: Refactor this shit
  onOrderDone(order: OrderFutures, win = false) {
    order.status = 'closed'
    if (win || this.countFilled === this.maxSteps) {
      this.currentOrders.forEach((p: OrderFutures) => {
        if (p.status === 'open') p.status = 'canceled'
      })
      if (!win && this.isLive)
        console.log('Max steps reached', this.countFilled)
    }
    if (win || this.countFilled >= this.maxSteps) {
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
