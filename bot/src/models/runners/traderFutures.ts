import { OrderFutures, ZoneRecovery } from '..'
import { Runner } from './runner'
import { MoneyPrinter } from '../strategies'
import { Logger } from '../utils/Logger'

import * as colors from 'colors/safe'

export class TraderLeveraged extends Runner {
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
      ratio: parseFloat(options.ratio),
      leverage: parseFloat(options.leverage),
      risk: parseInt(options.risk),
      maxSteps: parseInt(options.maxSteps),
      symbol: options.symbol,
      percentOfMaxRange: parseInt(options.percentOfMaxRange)
    }
  }

  async start() {}

  async onTick() {}

  async onSignal({ timestamp, price }) {}

  async onTakeProfit(orderFromExchange) {}

  async onLiquidation(orderFromExchange) {}

  async onStopLoss(orderFromExchange) {}

  async onFilled(orderFromExchange) {}

  onFinish() {
    this.strategy.printProfit()
    process.exit(0)
  }

  async updateOrders() {}

  async reset() {}

  searchOrder(orderFromExchange) {}
}
