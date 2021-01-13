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
    symbol: '',
    maxSteps: 6,
    percentOfMaxRange: 80,
    risk: 100
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

    this.options.risk = Math.round(lastStep.total) * 2

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
    // await this.account.cancelAllPositions(this.options.symbol)
    await this.account.deleteOpenOrders(this.options.symbol)
    await new Promise(resolve => setTimeout(resolve, 20000))
    this.onTick()
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
      const newOrders = this.strategy.currentOrders.filter(
        order => order.status === 'open' && order.filled === 0
      )
      newOrders && (await this.account.placeNewOrders(newOrders))
    } catch (error) {
      console.error(error)
      await this.reset()
    }
  }

  async onFilled(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      Logger.info(`${colors.blue('onFilled')}: ${order.toString()}`)

      this.strategy.onOrderFilled(order)

      await this.account.deleteOpenOrders(this.options.symbol)
      await this.account.placeTpSLTs([order])
    } catch (error) {
      Logger.error(error)
      await this.reset()
    }
  }

  async onTakeProfit(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      Logger.info(`${colors.green('onTakeProfit')}: ${order.toString()}`)

      await this.strategy.onOrderDone(order, true)

      this.onTick()
    } catch (error) {
      Logger.error(error)
    } finally {
      await this.reset()
    }
  }

  async onStopLoss(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      Logger.info(`${colors.red('onStopLoss')}: ${order.toString()}`)

      await this.account.deleteOpenOrders(this.options.symbol)
      await this.account.placeTpSLTs([this.strategy.currentOrder])
      await this.strategy.onOrderFilled(this.strategy.currentOrder)
      // this.strategy.currentOrders.filled = this.strategy.currentOrders.amount
    } catch (error) {
      Logger.error(error)
      await this.reset()
    }
  }

  async onLiquidation(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      console.log(colors.red('onLiquidation'), order?.toString())

      await this.strategy.onOrderDone(order, false)
    } catch (error) {
      Logger.error(error)
    } finally {
      await this.reset()
    }
  }

  onFinish() {
    console.info('Finish')
  }

  // async updateOrders3() {
  //   try {
  //     // Close orders
  //     const closeOrders = this.strategy.currentOrders.filter(
  //       order => order.status === 'canceled' && order.id
  //     )
  //     closeOrders && (await this.account.cancelOrders(closeOrders))

  //     // Set Stop Losses
  //     const filledrders = this.strategy.currentOrders.filter(
  //       order => order.status === 'open' && order.filled !== 0
  //     )
  //     filledrders && (await this.account.placeTpSLTs(filledrders))

  //     if (this.strategy.countFilled === 0) {
  //       // Set new Orders
  //       const newOrders = this.strategy.currentOrders.filter(
  //         order => order.status === 'open' && order.filled === 0
  //       )
  //       newOrders && (await this.account.placeNewOrders(newOrders))
  //     }
  //   } catch (error) {
  //     console.log(error)

  //     await this.reset()
  //   }
  // }

  searchOrder(orderFromExchange) {
    const order = this.strategy.currentOrders.find(
      (order: OrderFutures) =>
        order.id === orderFromExchange.id ||
        order.idStopLoss === orderFromExchange.id ||
        order.idTakeProfit === orderFromExchange.id ||
        order.id === orderFromExchange.orderId ||
        order.clientOrderId === orderFromExchange.clientOrderId ||
        order.clientOrderIdTP === orderFromExchange.clientOrderId ||
        order.clientOrderIdSL === orderFromExchange.clientOrderId
    )
    if (order?.id) return order
    else throw new Error('Order not found' + order.clientOrderId)
  }
}
