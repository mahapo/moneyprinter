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
      ...this.options,
      ...options
    }
    this.strategy = new MoneyPrinter(this, this.options)
  }

  async start() {
    const lastStep = ZoneRecovery.calcStep(
      this.options.maxSteps,
      this.options.ratio
    )

    this.options.risk = Math.round(lastStep.total) * 40

    const symbol = this.options.symbol.replace('/', '')
    this.account.on(`${symbol}:Tick`, this.onTick.bind(this))
    this.account.on(`${symbol}:Liquidation`, this.onLiquidation.bind(this))
    this.account.on(`${symbol}:StopLoss`, this.onStopLoss.bind(this))
    this.account.on(`${symbol}:TakeProfit`, this.onTakeProfit.bind(this))
    this.account.on(`${symbol}:Finish`, this.onFinish.bind(this))
    this.account.on(`${symbol}:Filled`, this.onFilled.bind(this))

    await this.account.setLeverage(symbol, this.options.leverage)
    // await this.reset()
    this.onTick()
    // this.account.startTicker(symbol)
  }

  async reset() {
    this.strategy.currentOrders = []
    this.account.lastTime = 0
    await this.account.resetAll(this.options.symbol)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  async onTick(tick = null) {
    tick ||= {
      price: await this.account.getLastPrice(this.options.symbol),
      timestamp: this.account.instance.now()
    }

    try {
      // this.updateOrders(tick)
      this.strategy.run(tick)
    } catch (error) {
      console.log(error)
    }
  }

  async onSignal({ timestamp, price }) {
    try {
      const balance = await this.account.getCurrentBalance('USDT')
      const amount =
        ((balance / price) * this.options.leverage) / this.options.risk
      console.log('onSignal', price, balance, amount)

      this.strategy.onSignal({
        price,
        timestamp,
        amount
      })
      await this.updateOrders()
    } catch (error) {
      console.error(error)
    }
  }

  async onFilled(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)

      if (order?.id) {
        Logger.info(`${colors.blue('onFilled')}: ${order.toString()}`)
        this.strategy.onOrderFilled(order)
        this.updateOrders()
      } else {
        Logger.warn(colors.red('Filled: Order not found'))
        await this.reset()
      }
    } catch (error) {
      Logger.error(error)
    }
  }

  async onTakeProfit(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      if (order?.id) {
        Logger.info(`${colors.green('onTakeProfit')}: ${order.toString()}`)
        await this.strategy.onOrderDone(order, true)
        this.onTick()
      } else {
        Logger.warn(colors.red('TakeProfit: Order not found'))
      }
    } catch (error) {
      Logger.error(error)
    } finally {
      await this.reset()
    }
  }

  async onStopLoss(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      if (order?.id) {
        Logger.info(`${colors.red('onStopLoss')}: ${order.toString()}`)
        await this.strategy.onOrderDone(order, false)
      } else {
        Logger.warn(colors.red('StopLoss: Order not found'))
        await this.reset()
      }
    } catch (error) {
      Logger.error(error)
    } finally {
      this.onTick()
    }
  }

  async onLiquidation(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      if (order) {
        console.log(colors.red('onLiquidation'), order?.toString())
        await this.strategy.onOrderDone(order, false)
        this.onTick()
      } else {
        Logger.warn(colors.red('Liquidation: Order not found'))
        await this.reset()
      }
    } catch (error) {
      Logger.error(error)
    }
  }

  onFinish() {
    console.info('Finish')
  }

  async updateOrders() {
    try {
      // Close orders
      const closeOrders = this.strategy.currentOrders.filter(
        order => order.status === 'canceled' && order.id
      )
      closeOrders && (await this.account.cancelOrders(closeOrders))

      // Set Stop Losses
      const filledrders = this.strategy.currentOrders.filter(
        order => order.status === 'open' && order.filled !== 0
      )
      filledrders && (await this.account.placeTpSLTs(filledrders))

      // Set new Orders
      const newOrders = this.strategy.currentOrders.filter(
        order => order.status === 'open' && order.filled === 0
      )
      newOrders && (await this.account.placeNewOrders(newOrders))
    } catch (error) {
      console.log(error.message)
    }
  }

  searchOrder(orderFromExchange) {
    return this.strategy.currentOrders.find(
      (order: OrderFutures) =>
        order.id === orderFromExchange.id ||
        order.idStopLoss === orderFromExchange.id ||
        order.idTakeProfit === orderFromExchange.id ||
        order.id === orderFromExchange.orderId ||
        order.clientOrderId === orderFromExchange.clientOrderId ||
        order.clientOrderIdTP === orderFromExchange.clientOrderId ||
        order.clientOrderIdSL === orderFromExchange.clientOrderId
    )
  }
}
