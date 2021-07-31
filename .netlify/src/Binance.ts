import { binance as BinanceCCXT } from 'ccxt'

export class Binance extends BinanceCCXT {
  constructor(options = {}, private demo = false) {
    super(options)
    this.leverage = 50
  }

  async calcAmount(symbol, risk = 20) {
    const balance = await this.getCurrentBalance('USDT')
    const price = await this.getLastPrice(symbol)

    let amount = (balance / risk / price) * this.leverage
    return this.amountToPrecision(symbol, amount)
  }

  async getCurrentBalance(coin) {
    const { free } = await this.fetchBalance({ recvWindow: 10000000 })
    return free[coin]
  }

  async getLastPrice(symbol) {
    let { info } = await this.fetchTicker(symbol.replace('/', ''), {})
    return parseFloat(info.lastPrice)
  }

  async placeOrder(symbol, isBuy, amount) {
    const { info } = await this.fetchBalance(symbol)
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

    if (position) {
      if (isBuy && parseFloat(position.positionAmt) > 0) {
        return
      }
      if (!isBuy && parseFloat(position.positionAmt) < 0) {
        return
      }
    }

    let quantity = Math.abs(position?.positionAmt || 0) + amount

    if (!isBuy) {
      quantity = quantity + -1
    }

    if (amount === 0) {
      quantity =
        parseFloat(position.positionAmt) >= 0
          ? position.positionAmt
          : parseFloat(position.positionAmt) * -1
    }
    const options = {
      symbol,
      side: isBuy ? 'BUY' : 'SELL',
      type: 'MARKET',
      quantity,
      positionSide: 'BOTH',
      reduceOnly: amount === 0
    }

    try {
      const t = await this.fapiPrivatePostOrder(options)
      console.log(t)
    } catch (error) {
      console.log(error)
    }
  }
}
