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
    let total = 1

    return [...Array(count)].map((_, i) => {
      let isEven = i % 2 === 0
      if (this.initialTradeDirection === 'sell') isEven = !isEven

      if (i !== 0) {
        price = priceStopLoss
        factor = (this.recoveryGapFactor + total) / (this.recoveryGapFactor - 1)
        total = total + factor
      }

      gapPercent = this.recoveryGapPercentage(i)
      gap = ((gapPercent / 100) * this.price) / this.leverage
      gapProfit = gap * this.recoveryGapFactor * 1.2
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
        total
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

      const options = {
        price: zone.price,
        leverage: this.leverage,
        ratio: this.recoveryGapFactor,
        side: zone.side,
        symbol,
        timestamp,
        amount: 0,
        amountLoss: 0
      }

      if (isLive) {
        const a = new BigNumber(amount).times(zone.factor)
        const b = new BigNumber(amount).times(nextZone.factor)
        options.amount = a.toNumber()
        options.amountLoss = a.plus(b).toNumber()
      } else {
        options.amount = amount * zone.factor
        options.amountLoss = amount + options.amount
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
      total: 1
    }
    return [...Array(index)].reduce((step, _, i) => {
      step.factor = (ratio + lastStep.total) / (ratio - 1)
      step.total = lastStep.total + step.factor
      lastStep = step
      return step
    }, lastStep)
  }
}
