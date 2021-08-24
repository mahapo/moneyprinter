import {
  binance as BinanceCCXT
} from 'ccxt'

export class Binance extends BinanceCCXT {
  constructor(options = {}, private demo = false) {
    super(options)
    this.leverage = 20
    this.risk = 6
  }

  calcTpSL(symbol, price, isBuy) {
    const factor = 100 / 100 / this.leverage / 2.1
    const r = 3
    let SL, TP
    if (isBuy) {
      SL = price * (1 - factor)
      TP = price * (1 + factor * r)
    } else {
      SL = price * (1 + factor)
      TP = price * (1 - factor * r)
    }
    SL = this.priceToPrecision(symbol, SL)
    TP = this.priceToPrecision(symbol, TP)

    return [TP, SL]
  }

  async calcAmount(symbol, balance, price) {
    let amount = (balance / this.risk / price) * this.leverage

    return this.amountToPrecision(symbol, amount)
  }

  async getCurrentBalance(coin) {
    const {
      free,
      total
    } = await this.fetchBalance({
      recvWindow: 10000000
    })
    return total[coin]
  }

  async getLastPrice(symbol) {
    let {
      info
    } = await this.fetchTicker(symbol.replace('/', ''), {})
    return parseFloat(info.lastPrice)
  }

  async placeOrder(symbol, isBuy, close = false) {
    const {
      info
    } = await this.fetchBalance(symbol)
    const position = info.positions.find(
      pos => pos.symbol === symbol.replace('/', '')
    )
    if (parseFloat(position.leverage) !== this.leverage) {
      try {
        await this.fapiPrivatePostLeverage({
          symbol: symbol.replace('/', ''),
          leverage: this.leverage
        })
      } catch (error) {}
    }
    if (!position.isolated) {
      console.log(symbol, ': Change mode to ISOLATED')

      await this.fapiPrivatePostMarginType({
        symbol: symbol.replace('/', ''),
        marginType: 'ISOLATED'
      })
    }

    if (position) {
      if (isBuy && parseFloat(position.positionAmt) > 0) {
        return
      }
      if (!isBuy && parseFloat(position.positionAmt) < 0) {
        return
      }
    }

    await this.fapiPrivateDeleteAllOpenOrders({
      symbol: symbol.replace('/', '')
    })

    let options = {
      symbol: symbol.replace('/', ''),
      side: isBuy ? 'BUY' : 'SELL',
      type: 'MARKET',
      positionSide: 'BOTH',
      reduceOnly: false,
      workingType: 'MARK_PRICE',
      quantity: 0
    }

    try {
      if (close) {
        options.quantity =
          parseFloat(position.positionAmt) >= 0 ?
          position.positionAmt :
          parseFloat(position.positionAmt) * -1
        options.reduceOnly = true

        const t = await this.fapiPrivatePostOrder(options)
      } else {
        const balance = await this.getCurrentBalance('USDT')
        const price = await this.getLastPrice(symbol)
        const amount = await this.calcAmount(symbol, balance, price)
        const [TP, SL] = this.calcTpSL(symbol, price, isBuy)

        // @ts-ignore
        options.quantity =
          Math.abs(parseFloat(position?.positionAmt) || 0) + parseFloat(amount)
        // if (!isBuy) {
        //   // @ts-ignore
        //   options.quantity = options.quantity + -1
        // }

        // const takeProfit = {
        //   ...options,
        //   type: 'TAKE_PROFIT',
        //   // quantity: options.quantity,
        //   stopPrice: TP,
        //   side: isBuy ? 'SELL' : 'BUY',
        //   reduceOnly: true
        // }

        const stopLoss = {
          ...options,
          // quantity: options.quantity * -1,
          type: 'STOP_MARKET',
          reduceOnly: true,
          stopPrice: SL,
          side: isBuy ? 'SELL' : 'BUY'
        }
        console.log([options, stopLoss])

        // const params = {
        //   batchOrders: encodeURIComponent(
        //     JSON.stringify([takeProfit, stopLoss])
        //   )
        // }
        const t = await this.fapiPrivatePostOrder(options)
        const t2 = await this.fapiPrivatePostOrder(stopLoss)
        // // const t = await this.fapiPrivatePostBatchOrders(params)
        // console.log(t, t2)
      }
    } catch (error) {
      console.log(error)
    }
  }
}