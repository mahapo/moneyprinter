// import { performance } from 'perf_hooks'

import * as dayjs from 'dayjs'
import * as duration from 'dayjs/plugin/duration'
import 'dayjs/locale/en'
dayjs.extend(duration)
dayjs.locale('en')

import { Runner } from './Runner'
import { OrderFutures } from '@moneyprinter/models'
import { MoneyPrinter, ZoneRecovery } from '@moneyprinter/strategies'
import { IOHLCV, TradeTick, batchTicksToCandle } from 'candlestick-convert'

export class Backtester extends Runner {
  balances = []
  balance: number

  time: number = 0
  ticks: TradeTick[]
  candels: IOHLCV[]

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
    ta: true,
    percentOfMaxRange: 80,
    recoveryGapInitial: 30,
    recoveryGapDynamicAdd: 5,
    recoveryGapDynamicCount: 3
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

    this.options.risk = Math.round(lastStep.total) * 4

    this.strategy = new MoneyPrinter(this.options, false)

    this.balance = this.options.startBalance
    this.balances = [
      {
        time: this.ticks[0].time,
        balance: this.balance
      }
    ]

    if (this.options.ta) {
      this.candels = batchTicksToCandle(ticks, 60)
      this.candels.forEach(this.onCandel.bind(this))
    } else {
      this.ticks.forEach(this.onTick.bind(this))
    }

    return this.onFinish()
  }

  onCandel(candel: IOHLCV) {
    try {
      if (this.strategy.currentOrders.length === 0) {
        this.onSignal({
          time: candel.time,
          price: candel.open
        } as TradeTick)
      }
      if (this.balance > 10) {
        this.updateOrders({
          time: candel.time,
          price: candel.open
        } as TradeTick)
      }
    } catch (error) {
      console.log(error)
    }
  }

  onTick(tick: TradeTick) {
    try {
      if (this.strategy.currentOrders.length === 0) {
        this.onSignal(tick)
      }
      if (this.balance > 10) {
        this.updateOrders(tick)
      }
    } catch (error) {
      console.log(error)
    }
  }

  updateOrders(tick: TradeTick) {
    try {
      this.strategy.currentOrders
        .filter(x => x.status === 'open')
        .forEach((order: OrderFutures) => {
          if (order.filled === 0 && order.checkIfFilled(tick.price)) {
            order.timestampFilled = tick.time

            this.balances.push({
              ...tick,
              balance: this.balance.toFixed(2),
              filled: 1,
              priceTop: Math.max(order.takeProfit, order.stopLoss).toFixed(3),
              priceBottom: Math.min(order.takeProfit, order.stopLoss).toFixed(3)
            })
            this.strategy.onOrderFilled(order)
          } else if (order.filled > 0) {
            // order.updateTrailingStop(price)
            const isTakeProfit = order.checkIfTriggersTakeProfit(tick.price)
            const isStopLoss = order.checkIfTriggersStopLoss(tick.price)
            // const isStopLoss = order.checkIfTriggersActivationPrice(price)

            if (isTakeProfit || isStopLoss) {
              order.status = 'closed'
              order.timestampExit = tick.price

              order.priceExit = isTakeProfit ? order.takeProfit : order.stopLoss
              this.balance = this.balance + order.pnl

              this.balances.push({
                ...tick,
                balance: this.balance.toFixed(2),
                filled: this.strategy.countFilled,
                priceTop: Math.max(order.takeProfit, order.stopLoss).toFixed(3),
                priceBottom: Math.min(order.takeProfit, order.stopLoss).toFixed(
                  3
                ),
                pnl: order.pnl.toFixed(3)
              })
              if (isTakeProfit) {
                this.strategy.onTakeProfit(order)
              } else if (isStopLoss) {
                this.strategy.onStopLoss(order)
              }
            }
          }
        })
    } catch (error) {
      console.log(error)
    }
  }

  onSignal({ price, time }) {
    try {
      this.strategy.onSignal({
        price,
        timestamp: time,
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

    const timeStart = dayjs(this.ticks[0].time)
    const timeEnd = dayjs(this.ticks[this.ticks.length - 1].time)
    const days = dayjs.duration(timeEnd.diff(timeStart)).asDays()

    const maxFilled = Math.max(
      ...this.balances.filter(b => b.filled).map(balance => balance.filled)
    )
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
    console.log(`Max filled: ${maxFilled}`)
    console.log(`TA: ${this.options.ta}`)
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
        return a.time - b.time
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
    if (this.balance > maxSize)
      return (maxSize / this.options.risk) * this.options.leverage

    return (this.balance / this.options.risk) * this.options.leverage
  }
}
