import { ExchangeBase } from '..'
import { binance as BinanceCCXT } from 'ccxt'
import { Logger } from '../../utils/Logger'
import SocketClient from './socketClient'

const WSS_BASE_URL = process.env.WSS_BASE_URL || 'wss://stream.binance.com/'

export class Binance extends ExchangeBase {
  instance: BinanceCCXT

  constructor(options, private demo) {
    super(options)
    this.instance = new BinanceCCXT({
      ...options,
      options: { defaultType: 'future' },
      timeout: 30000,
      enableRateLimit: true
    })
    this.instance.setSandboxMode(this.demo)
  }

  startWebSocket() {
    return new Promise(async (resolve, reject) => {
      let { listenKey } = await this.instance.fapiPrivatePostListenKey()
      let pairs = [listenKey].join('/')

      const socketApi = new SocketClient(
        `stream?streams=${pairs}`,
        'wss://stream.binancefuture.com/'
      )
      socketApi.setHandler('ORDER_TRADE_UPDATE', ({ data }) => {
        const { x, X, ot, s, c } = data.o.o
        if (x === 'TRADE' && X === 'FILLED' && ot === 'STOP_MARKET')
          this.emit(`${s}:Filled`, c)
      })
      // socketApi.setHandler('ACCOUNT_UPDATE  ', params =>
      //   console.info(JSON.stringify(params))
      // )
      resolve(true)
    })
  }

  async resetAll(symbol) {
    try {
      await this.instance.cancelAllOrders(symbol)
    } catch (error) {
      throw Logger.error(this.formatError(error))
    }
  }

  async setLeverage(symbol, leverage: number) {
    try {
      // console.log(symbol, leverage)
      // console.log(this.instance.dapiPrivatePostLeverage)

      await this.instance.fapiPrivate_post_leverage({
        symbol: 'BTCUSDT',
        leverage: 22
        // timestamp: this.instance.nonce()
      })
    } catch (error) {
      console.log(error)
      // Logger.error(this.formatError(error))
    }
  }

  async placeMarketStopOrder(order, newPosition = true) {
    try {
      Logger.info(`New Order: ${order.toString()}`)
      if (newPosition) this.lastTime = order.timestamp
      const { precision } = this.markets.find(
        market => market.base === order.symbol.split('/')[0]
      )
      const price = this.instance.priceToPrecision(order.symbol, order.price)

      let newOrder = await this.instance.createOrder(
        order.symbol,
        'STOP_MARKET',
        order.side,
        order.amount,
        0,
        // @ts-ignore
        {
          stopPrice: price,
          workingType: 'MARK_PRICE',
          clientOrderId: order.clientOrderId
        }
      )
      order.id = newOrder.id
      this._orders.push(newOrder)
      return newOrder
    } catch (error) {
      // TODO: Order would immediately trigger.
      if (error.message.includes('Order would immediately trigger.'))
        throw this.formatError(error)
      else {
        throw this.formatError(error)
      }
    }
  }

  async setTpSLTs(order) {
    // try {
    //   const { precision } = this.markets.find(
    //     (market) => market.base === order.symbol.split("/")[0]
    //   );
    //   let options = { symbol: order.symbol.replace("/", "") };
    //   if (!order.takeProfitSet) {
    //     Logger.info(`Set trailing: ${order.toString()}`);
    //     //options["take_profit"] = order.takeProfit
    //     options["trailing_stop"] = precision.price * 5; // Creates more Profit as take_profit
    //     options["new_trailing_active"] = order.takeProfit;
    //     order.takeProfitSet = true;
    //   }
    //   if (!order.stopLossSet) {
    //     Logger.info(`Set stop loss: ${order.toString()}`);
    //     options["stop_loss"] = order.stopLoss;
    //     order.stopLossSet = true;
    //   }
    //   let request = await this.instance.openapiPostPositionTradingStop(options);
    //   return true;
    // } catch (error) {
    //   // TODO: Handel error: TrailingProfit:201.95 set for Sell position should be less than entry_price:194.05??LastPrice and last_price:195.65
    //   // TODO: Handel 'StopLoss:211.5 set for Buy position should be between liq_price:212 and base_price:214.1??LastPrice'
    //   Logger.error(this.formatError(error));
    //   throw this.formatError(error);
    // }
  }

  async cancelOrder(order) {
    // try {
    //   Logger.info(`Delete: ${order.toString()}`);
    //   let request = await this.instance.openapiPostStopOrderCancel({
    //     order_link_id: order.clientOrderId,
    //     symbol: order.symbol.replace("/", ""),
    //   });
    //   order.id = "";
    //   return true;
    // } catch (error) {
    //   throw this.formatError(error);
    // }
  }

  async cancelAllPositions(symbol) {
    // try {
    //   let orders = await this.instance.privateGetPositionList({
    //     symbol: symbol.replace("/", ""),
    //   });
    //   if (orders.result.side === "Sell" && orders.result.size)
    //     await this.instance.createOrder(
    //       symbol,
    //       "market",
    //       "buy",
    //       orders.result.size
    //     );
    //   else if (orders.result.side === "Buy" && orders.result.size)
    //     await this.instance.createOrder(
    //       symbol,
    //       "market",
    //       "sell",
    //       orders.result.size
    //     );
    //   return true;
    // } catch (error) {
    //   throw this.formatError(error);
    // }
  }

  async getCurrentOrdersAndPosition(symbol) {
    // let positions = await this.instance.privateGetPositionList({
    //   symbol: symbol.replace("/", ""),
    // });
    // let orders = await this.instance.fetchOrders(symbol);
    // return [orders, positions];
  }

  formatedOrder(orderFromExchange) {
    // return {
    //   id: orderFromExchange.order_link_id,
    //   clientOrderId: orderFromExchange.order_id,
    //   side: orderFromExchange.side.toLowerCase(),
    //   amount: orderFromExchange.qty,
    //   price: parseFloat(orderFromExchange.trigger_price),
    //   takeProfit: parseFloat(orderFromExchange.take_profit),
    //   stopLoss: parseFloat(orderFromExchange.stop_loss),
    //   raw: JSON.stringify(orderFromExchange),
    //   symbol: orderFromExchange.symbol,
    // };
  }

  formatError(error) {
    try {
      return {
        ...error,
        message: JSON.parse(error.message.replace('binance ', ''))
      }
    } catch {
      return error
    }
  }
}
