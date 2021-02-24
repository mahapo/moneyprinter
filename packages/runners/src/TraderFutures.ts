import { OrderFutures } from '@moneyprinter/models'
import { Runner } from './Runner'
import { MoneyPrinter, ZoneRecovery } from '@moneyprinter/strategies'
import { Logger } from '@moneyprinter/utils/src/Logger'

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
    risk: 100,
    limit: 10000,
    maxAmount: 400
  }

  constructor(public account, options) {
    super()

    this.options = {
      ...this.options,
      ...options
    }
    this.strategy = new MoneyPrinter(this.options)
  }

  async start() {
    const lastStep = ZoneRecovery.calcStep(
      this.options.maxSteps,
      this.options.ratio
    )

    this.options.risk = Math.round(lastStep.total) * 8

    this.options.maxAmount = Math.floor(
      this.options.limit / lastStep.factor / this.options.leverage
    )

    const symbol = this.options.symbol.replace('/', '')
    this.account.on(`${symbol}:Tick`, this.onTick.bind(this))
    this.account.on(`${symbol}:Liquidation`, this.onLiquidation.bind(this))
    this.account.on(`${symbol}:StopLoss`, this.onStopLoss.bind(this))
    this.account.on(`${symbol}:TakeProfit`, this.onTakeProfit.bind(this))
    this.account.on(`${symbol}:Finish`, this.onFinish.bind(this))
    this.account.on(`${symbol}:Filled`, this.onFilled.bind(this))

    await this.account.setLeverage(symbol, this.options.leverage)
    await this.reset()
  }

  async reset() {
    try {
      this.strategy.currentOrders = []
      this.account.lastTime = 0
      await this.account.deleteOpenOrders(this.options.symbol)
      await new Promise(resolve => setTimeout(resolve, 1000))
      await this.account.deleteOpenPositions(this.options.symbol)
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.onTick()
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 10000))
      this.reset()
    }
  }

  async onTick(tick = null) {
    tick ||= {
      price: await this.account.getLastPrice(this.options.symbol),
      timestamp: this.account.instance.now()
    }

    try {
      // this.updateOrders(tick)
      if (this.strategy.currentOrders.length === 0) {
        this.onSignal(tick)
        // await this.strategy.onSignal(tick)
      }
    } catch (error) {
      console.log(error)
    }
  }

  async onSignal({ timestamp, price }) {
    try {
      const balance = await this.account.getCurrentBalance('USDT')
      // price = this.account.priceRounder(this.options.symbol, price)

      let amountUsd = balance / this.options.risk
      if (amountUsd >= this.options.maxAmount) {
        amountUsd = this.options.maxAmount / price
      }
      let amount = (amountUsd / price) * this.options.leverage
      amount = this.account.amountRounder(this.options.symbol, amount)
      console.log(
        `${colors.green('onSignal')}`,
        this.options.symbol,
        price,
        balance,
        amount
      )

      this.strategy.onSignal({
        price,
        timestamp,
        amount
      })
      this.strategy.longZoneOrders.map(o => this.account.round(o))
      this.strategy.shortZoneOrders.map(o => this.account.round(o))
      this.strategy.currentOrders.map(o => this.account.round(o))

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
      await this.account.placeTpSLTs([this.strategy.currentOrder])
    } catch (error) {
      Logger.error(error)
      await this.reset()
    }
  }

  async onStopLoss(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      Logger.info(`${colors.red('onStopLoss')}: ${order.toString()}`)

      this.strategy.onStopLoss(this.strategy.currentOrder)

      await this.account.deleteOpenOrders(this.options.symbol)
      if (this.strategy.currentOrder) {
        await this.account.placeTpSLTs([this.strategy.currentOrder])
      } else {
        this.reset()
      }
    } catch (error) {
      Logger.error(error)
      await this.reset()
    }
  }

  async onTakeProfit(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      Logger.info(`${colors.green('onTakeProfit')}: ${order.toString()}`)

      await this.strategy.onTakeProfit(order)
    } catch (error) {
      Logger.error(error)
    } finally {
      await this.reset()
    }
  }

  async onLiquidation(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      console.log(colors.red('onLiquidation'), order?.toString())

      await this.strategy.onTakeProfit(order)
    } catch (error) {
      Logger.error(error)
    } finally {
      await this.reset()
    }
  }

  onFinish() {
    console.info('Finish')
  }

  searchOrder(orderFromExchange) {
    const order = this.strategy.currentOrders.find(
      (order: OrderFutures) =>
        order.id === orderFromExchange.id ||
        order.idStopLoss === orderFromExchange.id ||
        order.idTakeProfit === orderFromExchange.id ||
        order.clientOrderId === orderFromExchange.clientOrderId ||
        order.clientOrderIdTP === orderFromExchange.clientOrderId ||
        order.clientOrderIdSL === orderFromExchange.clientOrderId
    )
    if (order?.id || order?.idStopLoss || order?.idTakeProfit) return order
    else {
      console.table(orderFromExchange)
      console.table(order)

      throw new Error('Order not found:' + orderFromExchange.clientOrderId)
    }
  }
}
