import { OrderFutures } from '@moneyprinter/models'
import { Runner } from './Runner'
import { MoneyPrinter, ZoneRecovery } from '@moneyprinter/strategies'
import { Logger } from '@moneyprinter/utils/src/Logger'

import * as tulind from 'tulind'
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
    this.strategy.priceRounder = (price: number) =>
      account.priceRounder(this.options.symbol, price)
    this.strategy.amountRounder = (amount: number) =>
      account.amountRounder(this.options.symbol, amount)
  }

  async start() {
    const lastStep = ZoneRecovery.calcStep(
      this.options.maxSteps,
      this.options.ratio
    )

    this.options.risk = Math.round(lastStep.total) * 4

    this.options.maxAmount =
      Math.floor(this.options.limit / lastStep.factor / this.options.leverage) -
      2

    this.options.maxAmount = 10

    const symbol = this.options.symbol.replace('/', '')
    this.account.on(`${symbol}:Tick`, this.onTick.bind(this))
    this.account.on(`${symbol}:Liquidation`, this.onLiquidation.bind(this))
    this.account.on(`${symbol}:StopLoss`, this.onStopLoss.bind(this))
    this.account.on(`${symbol}:TakeProfit`, this.onTakeProfit.bind(this))
    this.account.on(`${symbol}:Finish`, this.onFinish.bind(this))
    this.account.on(`${symbol}:Filled`, this.onFilled.bind(this))
    this.reset()
  }

  async reset() {
    try {
      this.strategy.currentOrders = []
      this.account.lastTime = 0
      await this.account.setupSymbol(this.options.symbol, this.options.leverage)
      await new Promise(resolve => setTimeout(resolve, 500))
      await this.account.deleteOpenOrders(this.options.symbol)
      this.onTick()
    } catch (error) {
      console.error(colors.red('reset'), error)
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
      if (this.strategy.currentOrders.length === 0) {
        const candels = await this.account.fetchOHLCV(this.options.symbol)

        const high = candels.map(c => c[2])
        const low = candels.map(c => c[3])
        const close = candels.map(c => c[4])

        const rsi = await new Promise((resolve, reject) =>
          tulind.indicators.rsi.indicator([close], [14], (err, results) => {
            if (err) reject(err)
            resolve(results[0])
          })
        )

        const adx = await new Promise((resolve, reject) =>
          tulind.indicators.adx.indicator(
            [high, low, close],
            [5],
            (err, results) => {
              if (err) reject(err)
              resolve(results[0][results.length - 1])
            }
          )
        )

        const rsiRange =
          (rsi[0] > 80 && rsi[0] > rsi[1]) || (rsi[0] < 20 && rsi[0] < rsi[1])

        if (rsiRange && adx > 30) {
          console.log(
            `${colors.green('RSI/ADX')} ${
              this.options.symbol
            }: Signal found (${rsi}/${adx})`
          )
          this.onSignal(tick)
        } else {
          // console.log(
          //   `${colors.red('RSI')} ${this.options.symbol}: out of Range (${rsi})`
          // )
          await new Promise(resolve => setTimeout(resolve, 60000))
          this.onTick()
        }

        // await this.strategy.onSignal(tick)
      }
    } catch (error) {
      console.error(colors.red('onTick'), error)
    }
  }

  async onSignal({ timestamp, price }) {
    try {
      const balance = await this.account.getCurrentBalance('USDT')
      price = this.account.priceRounder(this.options.symbol, price)

      let amountUsd = Math.floor(balance / this.options.risk)

      if (amountUsd >= this.options.maxAmount) {
        amountUsd = this.options.maxAmount
      }
      let amount = (amountUsd / price) * this.options.leverage
      amount = this.account.amountRounder(this.options.symbol, amount)

      console.log(
        `${colors.green('onSignal')}`,
        this.options.symbol,
        price,
        amount,
        balance
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
      if (error.message?.msg?.includes('immediately trigger')) {
        this.strategy.percent = this.strategy.percent + 5
        Logger.info(
          colors.red('onSignal'),
          'Order would immediately trigger - increce gap:',
          this.strategy.percent
        )
      } else {
        Logger.error(colors.red('onSignal'), this.options.symbol, error)
      }
      this.reset()
    }
  }

  async onFilled(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      Logger.info(`${colors.blue('onFilled')}: ${order.toString()}`)

      this.strategy.onOrderFilled(order)

      await this.account.deleteOpenOrders(this.options.symbol)
      await this.account.placeTpSLTs([this.strategy.currentOrder], false)
    } catch (error) {
      Logger.error(error)
      this.reset()
    }
  }

  async onStopLoss(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange)
      Logger.info(`${colors.red('onStopLoss')}: ${order.toString()}`)

      this.strategy.onStopLoss(this.strategy.currentOrder)

      await this.account.deleteOpenOrders(this.options.symbol)
      if (this.strategy.currentOrder) {
        await this.account.placeTpSLTs([this.strategy.currentOrder], false)
      } else {
        this.reset()
      }
    } catch (error) {
      Logger.error(error)
      this.reset()
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
      this.reset()
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
      this.reset()
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
      console.table(this.strategy.currentOrders)
      throw `${colors.red('searchOrder')}: ${
        this.options.symbol
      }: Order not found, ${orderFromExchange.clientOrderId}`
    }
  }
}
