import { OrderFutures } from '@moneyprinter/models'
import { BigNumber } from 'bignumber.js'

export class ZoneRecovery {
  public initialTradeDirection: 'buy' | 'sell'
  public hedgeGapType: 'fix' | 'dynamic'
  public countTrades: number

  public recoveryGapInitial: number = 30 // In Percent
  public recoveryGapFactor: number
  public recoveryGapDynamicAdd: number = 5 // In Percent
  public recoveryGapDynamicCount: number = 3

  public leverage: number
  public price: number

  constructor(price, leverage, ratio, side) {
    this.price = price
    this.leverage = leverage
    this.recoveryGapFactor = ratio
    this.initialTradeDirection = side
    this.countTrades = 0
  }

  recoveryGapPercentage(countTrades): number {
    return (
      this.recoveryGapInitial +
      Math.floor(countTrades / this.recoveryGapDynamicCount) *
        this.recoveryGapDynamicAdd
    )
  }

  recoveryGap(countTrades): number {
    return Math.round(
      (this.recoveryGapPercentage(countTrades) / 100 / this.leverage) *
        this.price
    )
  }

  calcZones(count: number) {
    let side: string
    let price = this.price
    let priceStopLoss: number
    let priceTakeProfit: number
    let gap: number
    let gapProfit: number
    let gapPercent: number

    let factor = 1
    let profit = this.recoveryGapFactor - 1
    let total = 1
    let profitTotal = this.recoveryGapFactor - 1

    return [...Array(count)].map((_, i) => {
      let isEven = i % 2 === 0
      if (this.initialTradeDirection === 'sell') isEven = !isEven

      if (i !== 0) {
        price = priceStopLoss
        factor = ((profitTotal + total) / profitTotal) * 1.1
        total = total + factor
        profit = factor * profitTotal
      }

      gapPercent = this.recoveryGapPercentage(i)
      gap = ((gapPercent / 100) * this.price) / this.leverage
      gapProfit = gap * this.recoveryGapFactor * 1.1
      side = isEven ? 'buy' : 'sell'
      priceStopLoss = isEven ? price - gap : price + gap
      priceTakeProfit = isEven ? price + gapProfit : price - gapProfit

      return {
        side,

        price,
        priceStopLoss,
        priceTakeProfit,

        gapPercent,
        gap,
        gapProfit,

        factor,
        profit,
        total,
        profitTotal
      }
    })
  }

  createOrders(
    count,
    symbol,
    amount,
    timestamp,
    isLive = false
  ): OrderFutures[] {
    // const key = isLive ? 'total' : 'factor'
    const zones = this.calcZones(count + 1)
    return zones.slice(0, count).map((zone, i) => {
      const nextZone = zones[i + 1]

      const a = new BigNumber(amount).times(zone.factor)
      const b = new BigNumber(amount).times(nextZone.factor)
      const options = {
        price: zone.price,
        leverage: this.leverage,
        ratio: this.recoveryGapFactor,
        side: zone.side,
        symbol,
        amount: a.toNumber(),
        amountLoss: a.plus(b).toNumber(),
        timestamp
      }

      const order = new OrderFutures(
        options,
        // @ts-ignore
        [
          i,
          String(this.price).replace('.', '_'),
          this.leverage,
          this.recoveryGapFactor,
          this.initialTradeDirection
        ].join('-')
      )
      order.takeProfit = zone.priceTakeProfit
      // order.priceActivation = zone.priceTakeProfit
      order.stopLoss = zone.priceStopLoss
      return order
    })
  }

  static calcSteps(count: number, ratio: number) {
    return [...Array(count)].map((_, i) => ZoneRecovery.calcStep(i, ratio))
  }

  static calcStep(index: number, ratio: number, breakevent: boolean = false) {
    // @ts-ignore
    let lastStep = {
      factor: 1,
      profit: ratio - 1,
      total: 1,
      profitTotal: ratio - 1
    }
    return [...Array(index)].reduce((step, _, i) => {
      step.factor =
        ((step.profitTotal + lastStep.total) / step.profitTotal) * 1.1
      step.total = lastStep.total + step.factor
      step.profit = step.factor * step.profitTotal
      lastStep = step
      return step
    }, lastStep)
  }
}
