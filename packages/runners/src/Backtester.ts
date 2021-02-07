// import { performance } from 'perf_hooks'

import * as dayjs from 'dayjs'
import * as duration from 'dayjs/plugin/duration'
import 'dayjs/locale/en'
dayjs.extend(duration)
dayjs.locale('en')

import { Runner } from './Runner'
import { OrderFutures, ZoneRecovery } from '@moneyprinter/models'
import { MoneyPrinter } from '@moneyprinter/strategies'

export class Backtester extends Runner {
  balances = []
  balance: number

  percent: number = 0
  time: number = 0
  ticks: any = []

  currentfile: string = ''

  options = {
    ratio: 2,
    leverage: 100,
    startBalance: 100,
    risk: 10,
    maxSteps: 10,
    file: '',
    update: false,
    matrix: false,
    percentOfMaxRange: 80
  }

  run(options, ticks) {
    this.ticks = ticks
    this.options = {
      ...this.options,
      ...options
    }

    const lastStep = ZoneRecovery.calcStep(
      this.options.maxSteps,
      this.options.ratio
    )

    this.options.risk = Math.round(lastStep.total) * 2

    this.strategy = new MoneyPrinter(this.options, false)
    this.strategy.maxSteps = this.options.maxSteps
    this.strategy.percentOfMaxRange = this.options.percentOfMaxRange

    this.balances = []
    this.balance = this.options.startBalance

    // const t0 = performance.now()
    this.percent = 0
    this.balances.push({
      timestamp: this.ticks[0].timestamp,
      balance: this.balance
    })

    this.ticks.forEach(this.onTick.bind(this))

    // this.time = performance.now() - t0

    return this.onFinish()
  }

  onTick(tick) {
    try {
      if (this.balance > 10) {
        this.updateOrders(tick)
        this.strategy.run(tick)
      }
    } catch (error) {
      console.log(error)
    }
  }

  updateOrders({ price, timestamp }) {
    try {
      this.strategy.currentOrders
        .filter(x => x.status === 'open')
        .forEach((order: OrderFutures) => {
          if (order.filled === 0 && order.checkIfFilled(price)) {
            order.timestampFilled = timestamp

            this.balances.push({
              timestamp,
              balance: this.balance,
              filled: 1
            })
            this.strategy.onOrderFilled(order)
          } else if (order.filled > 0) {
            const isTakeProfit = order.checkIfTriggersTakeProfit(price)
            const isStopLoss = order.checkIfTriggersStopLoss(price)
            if (isTakeProfit || isStopLoss) {
              order.status = 'closed'
              order.priceExit = price
              order.timestampExit = timestamp

              this.balance = this.balance + order.pnl

              this.balances.push({
                timestamp,
                balance: this.balance,
                filled: this.strategy.countFilled,
                type: isTakeProfit ? 'TP' : 'SL',
                pnl: order.pnl
              })
              if (isTakeProfit) {
                this.strategy.onOrderDone(order, true)
              } else if (isStopLoss) {
                this.strategy.onOrderFilled(order)
              }
            }
          }
        })
    } catch (error) {
      console.log(error)
    }
  }

  onSignal({ price, timestamp }) {
    try {
      this.strategy.onSignal({
        price,
        timestamp,
        amount: this.idealSize,
        ...this.options
      })
    } catch (error) {
      console.log(error)
    }
  }

  onFinish() {
    this.strategy.orders.push(...this.strategy.currentOrders)

    // const balances = this.formatedBalances.map(b => b.balance)
    // const drawdowns = this.formatedBalances
    //   .filter(b => !!b.drawdown)
    //   .map(b => b.drawdown)

    const timeStart = dayjs(this.ticks[0].timestamp)
    const timeEnd = dayjs(this.ticks[this.ticks.length - 1].timestamp)
    const days = dayjs.duration(timeEnd.diff(timeStart)).asDays()

    const profitPercent = (this.balance / this.options.startBalance - 1) * 100
    const profitPercentPerDay = profitPercent / days
    const result = {
      // orders: this.strategy.overview,
      // countMax: this.strategy.countMax,
      // profit: this.strategy.profitTotal,
      // drawdownMax: Math.min(...drawdowns).toFixed(2),

      balances: this.balances,
      timeStart: timeStart.unix(),
      timeEnd: timeEnd.unix(),
      days,
      profitPercent,
      profitPercentPerDay,
      options: this.options,
      ...this.strategy.stats,
      ...this.calcOrderStats
    }
    // this.emit('backtestFinish', result)

    console.log('========================')
    // console.log('Backtest took ' + this.time + ' milliseconds.')
    console.log(`Profit: ${profitPercent.toFixed(3)}%`)
    console.log(`Profit per day: ${profitPercentPerDay.toFixed(3)}%`)
    console.log(`Balance: ${this.balance.toFixed(2)}`)
    console.log(`Days: ${days.toFixed(1)}`)
    console.log(`Trades: ${this.strategy.orders.length}`)
    return result
  }

  get calcOrderStats() {
    let lossLast
    let lossSerie = 0
    let winLast
    let winSerie = 0
    return {
      countWin: this.strategy.overview.filter(o => o.profit > 0).length,
      countLoss: this.strategy.overview.filter(o => o.profit < 0).length
      // countWinSerieMax: this.strategy.overview
      //   .filter(o => o.status === 'closed' && o.filled > 0)
      //   .reduce((acc, o) => {
      //     const isWin = o.profit > 0
      //     if (isWin && winLast) acc = Math.max(acc, ++winSerie)
      //     else winSerie = 0
      //     winLast = isWin
      //     return acc
      //   }, 0),
      // countLossSerieMax: this.strategy.overview
      //   .filter(o => o.status === 'closed' && o.filled > 0)
      //   .reduce((acc, o) => {
      //     const isLoss = o.profit < 0
      //     if (isLoss && lossLast) acc = Math.max(acc, ++lossSerie)
      //     else lossSerie = 0
      //     lossLast = isLoss
      //     return acc
      //   }, 0)
    }
  }

  get formatedBalances() {
    let lastBalance = null
    let lastChange = null
    return this.balances
      .filter(balance => !!balance.timestamp)
      .sort(function (a, b) {
        return a.timestamp - b.timestamp
      })
      .map((balance, index) => {
        if (!index) {
          lastBalance = balance.balance
          return balance
        }
        const change = (1 - balance.balance / lastBalance) * 100
        lastBalance = balance.balance
        return { ...balance, change }
      })
      .map((balance, index) => {
        if (index < 2) {
          lastChange = balance.change
          return balance
        }
        const drawdown = balance.change + lastChange
        lastChange = balance.change
        return { ...balance, drawdown }
      })
  }

  get idealSize() {
    const maxSize = 1000
    if (this.balance / this.options.risk > maxSize)
      return (maxSize / this.options.risk) * this.options.leverage

    return (this.balance / this.options.risk) * this.options.leverage
  }
}
