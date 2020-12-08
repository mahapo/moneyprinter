import { EventEmitter } from 'events'
import { Market, Exchange, Balances, Order, Trade } from 'ccxt'
import * as WebSocket from 'ws'

export class ExchangeBase extends EventEmitter {
  instance: Exchange
  markets: Market[]
  balance: Balances
  _orders: Order[] = []
  positions: Trade[] = []
  socket: WebSocket

  lastTime: number

  constructor(public options) {
    super()
    options.defaultType = 'future'
  }

  async init() {
    try {
      this.markets = await this.instance.fetchMarkets()
    } catch (error) {
      console.log(error)
    }
  }

  async getLastPrice(symbol) {
    try {
      let { info } = await this.instance.fetchTicker(symbol, {})
      return parseFloat(info.lastPrice)
    } catch (error) {
      console.log(error)
    }
  }

  async getCurrentBalance(coin) {
    const { total } = await this.instance.fetchBalance()
    return total[coin]
  }

  get orders(): Order[] {
    return this._orders
      .filter(order => !!order.info.order_link_id)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  get activeOrders(): Order[] {
    return this.orders.filter(
      order => !!order.info.order_link_id.includes(this.lastTime)
    )
  }

  get openOrders(): Order[] {
    return this.orders.filter(order => order.status === 'open')
  }
}
