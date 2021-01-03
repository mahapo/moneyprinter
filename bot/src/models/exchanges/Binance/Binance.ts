import { ExchangeBase } from '..'
import { OrderFutures } from '../../OrderFutures'
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
      options: { defaultType: 'future', adjustForTimeDifference: true },
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
        const { x, X, ot, s, c, i } = data.o
        const isTakeProfit = c.endsWith('-TP')
        const isStopLoss = c.endsWith('-SL')
        // console.log(x, X, ot, s, c, i)
        const order = { clientOrderId: c, id: i }
        console.log(ot, X, order)
        if (X === 'FILLED') {
          if (isTakeProfit) this.emit(`${s}:TakeProfit`, order)
          else if (isStopLoss) this.emit(`${s}:StopLoss`, order)
          else this.emit(`${s}:Filled`, order)
        }
      })
      socketApi.setHandler('ACCOUNT_UPDATE', () => {})
      resolve(true)
    })
  }

  async resetAll(symbol) {
    try {
      await this.instance.fapiPrivateDeleteAllOpenOrders({
        symbol: symbol.replace('/', '')
      })
    } catch (error) {
      throw Logger.error(this.formatError(error))
    }
  }

  async setLeverage(symbol, leverage: number) {
    try {
      // const i = await this.instance.fapiPrivatePostMarginType({
      //   symbol: symbol.replace('/', ''),
      //   marginType: 'ISOLATED'
      // })

      await this.instance.fapiPrivatePostLeverage({
        symbol: symbol.replace('/', ''),
        leverage
      })
    } catch (error) {
      console.log(error)
      // Logger.error(this.formatError(error))
    }
  }

  async placeNewOrders(orders: OrderFutures[]) {
    try {
      let i = 0
      for (const order of orders) {
        Logger.info(`New Order: ${order.toString()}`)
        const mainOrder = {
          symbol: order.symbol.replace('/', ''),
          side: order.side.toUpperCase(),
          // positionSide: order.side.toUpperCase() === 'BUY' ? 'LONG' : 'SHORT',
          type: 'STOP_MARKET',
          quantity: this.instance.amountToPrecision(order.symbol, order.amount),
          stopPrice: this.instance.priceToPrecision(order.symbol, order.price),
          newClientOrderId: order.clientOrderId
        }

        const params = {
          batchOrders: encodeURIComponent(JSON.stringify([mainOrder]))
        }
        const results = await this.instance.fapiPrivatePostBatchOrders(params)
        order.id = results[0].orderId
      }
    } catch (error) {
      Logger.error(error)
    }
  }

  async placeTpSLTs(orders: OrderFutures[]) {
    try {
      let i = 0
      for (const order of orders) {
        Logger.info(`Set Stop Loss/Take Profit: ${order.toString()}`)
        const takeProfit = {
          symbol: order.symbol.replace('/', ''),
          side: order.side.toUpperCase() === 'BUY' ? 'SELL' : 'BUY',
          type: 'TAKE_PROFIT_MARKET',
          quantity: this.instance.amountToPrecision(order.symbol, order.amount),
          stopPrice: this.instance.priceToPrecision(
            order.symbol,
            order.takeProfit
          ),
          newClientOrderId: order.clientOrderIdTP
          // timeInForce: 'GTC'
        }
        const stopLoss = {
          symbol: order.symbol.replace('/', ''),
          side: order.side.toUpperCase() === 'BUY' ? 'SELL' : 'BUY',
          type: 'STOP_MARKET',
          closePosition: true,
          positionSide: 'BOTH',
          quantity: 0,
          // closePosition: true,
          // quantity: this.instance.amountToPrecision(order.symbol, order.amount),
          stopPrice: this.instance
            .priceToPrecision(order.symbol, order.stopLoss)
            .toString(),
          newClientOrderId: order.clientOrderIdSL,
          workingType: 'MARK_PRICE'
          // timeInForce: 'GTE_GTC'
        }
        const params = {
          batchOrders: encodeURIComponent(
            JSON.stringify([
              takeProfit
              // , stopLoss
            ])
          )
        }
        const results = await this.instance.fapiPrivatePostBatchOrders(params)
        order.idTakeProfit = results[0].orderId
        // order.idStopLoss = results[1].orderId
        // console.log(results)
      }
    } catch (error) {
      Logger.error(error)
    }
  }

  async cancelOrders(orders: OrderFutures[]) {
    try {
      for (const order of orders) {
        Logger.info(`Delete: ${order.toString()}`)
        const ids = [order.id, order.idTakeProfit, order.idStopLoss].filter(
          Boolean
        )
        const params = {
          symbol: order.symbol.replace('/', ''),
          orderIdList: encodeURIComponent(JSON.stringify(ids))
        }
        const results = await this.instance.fapiPrivateDeleteBatchOrders(params)
        order.id = null
        order.idTakeProfit = null
        order.idStopLoss = null
      }
      return true
    } catch (error) {
      throw this.formatError(error)
    }
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
