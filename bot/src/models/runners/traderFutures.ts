import { OrderFutures, ZoneRecovery } from '..'
import { Runner } from './runner'
import { MoneyPrinter } from '../strategies'
import { Logger } from '../utils/Logger'

import * as colors from 'colors/safe'

export class TraderFutures extends Runner {
  ticker: any
  currentCandle: any

  options = {
    ratio: 2,
    leverage: 100,
    risk: 100,
    symbol: '',
    maxSteps: 5,
    percentOfMaxRange: 80
  }

  constructor(public account, options) {
    super(options)
    this.options = {
      ...options
    }
    this.strategy = new MoneyPrinter(this, this.options)
  }

  async start() {
    const symbol = this.options.symbol.replace('/', '')
    this.account.on(`${symbol}:Tick`, this.onTick.bind(this))
    this.account.on(`${symbol}:Liquidation`, this.onLiquidation.bind(this))
    this.account.on(`${symbol}:StopLoss`, this.onStopLoss.bind(this))
    this.account.on(`${symbol}:TakeProfit`, this.onTakeProfit.bind(this))
    this.account.on(`${symbol}:Finish`, this.onFinish.bind(this))
    this.account.startTicker(symbol)
  }

  async onTick(tick) {
    try {
      // this.updateOrders(tick)
      this.strategy.run(tick)
    } catch (error) {
      console.log(error)
    }
  }

  async onSignal({ timestamp, price }) {
    console.log('onSignal', price)
    try {
      const balance = await this.account.getCurrentBalance(
        this.options.symbol.replace('/', '')
      )
      console.log(balance)
      const amount = Math.round(
        (balance * price * this.options.leverage) / this.options.risk
      )

      this.strategy.onSignal({
        price,
        timestamp,
        amount
      })
    } catch (error) {}
    console.error(2)
  }

  async onTakeProfit(orderFromExchange) {}

  async onLiquidation(orderFromExchange) {}

  async onStopLoss(orderFromExchange) {}

  async onFilled(orderFromExchange) {}

  onFinish() {
    console.info('Finish')
    // this.strategy.printProfit()
    // process.exit(0)
  }

  async updateOrders() {}

  async reset() {}

  searchOrder(orderFromExchange) {}
}
