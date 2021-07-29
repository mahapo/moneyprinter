import { binance as BinanceCCXT } from 'ccxt'

export class Binance extends BinanceCCXT {
  constructor(options = {}, private demo = false) {
    super(options)
    this.leverage = 25
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
    let quantity = Math.abs(position?.positionAmt || 0) + amount

    if (parseFloat(position.leverage) !== this.leverage) {
      try {
        await this.fapiPrivatePostLeverage({
          symbol: symbol.replace('/', ''),
          leverage: this.leverage
        })
      } catch (error) {}
    }

    if (!isBuy) {
      quantity = quantity + -1
    }

    if (position) {
      if (isBuy && parseFloat(position.positionAmt) > 0) {
        return
      }
      if (!isBuy && parseFloat(position.positionAmt) < 0) {
        return
      }
    }

    await this.fapiPrivatePostOrder({
      symbol,
      side: isBuy ? 'BUY' : 'SELL',
      type: 'MARKET',
      quantity,
      positionSide: 'BOTH'
    })
  }
}
