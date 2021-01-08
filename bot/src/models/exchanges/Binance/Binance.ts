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
        this.demo
          ? 'wss://stream.binancefuture.com/'
          : 'wss://fstream.binance.com/'
      )
      socketApi.setHandler('ORDER_TRADE_UPDATE', ({ data }) => {
        const { x, X, ot, s, c, i } = data.o
        const isTakeProfit = c.endsWith('-TP')
        const isStopLoss = c.endsWith('-SL')
        // console.log(x, X, ot, s, c, i)
        const order = { clientOrderId: c, id: i }
        if (X === 'FILLED') {
          if (isTakeProfit) this.emit(`${s}:TakeProfit`, order)
          else if (isStopLoss) this.emit(`${s}:StopLoss`, order)
          else this.emit(`${s}:Filled`, order)
        } else {
          console.log(ot, X, order.clientOrderId)
        }
      })
      socketApi.setHandler('ACCOUNT_UPDATE', () => {})
      // renew listenkey
      setInterval(async () => {
        await this.instance.fapiPrivatePutListenKey()
        console.info('ListenKey is renewed')
      }, 1000 * 60 * 10) // review the key every 10 mins
      resolve(true)
    })
  }

  async deleteOpenOrders(symbol) {
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
      const neworders = []
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
        neworders.push(mainOrder)
      }
      const results = await this.instance.fapiPrivatePostBatchOrders({
        batchOrders: encodeURIComponent(JSON.stringify(neworders))
      })

      let i = 0
      for (const result of results) {
        if (result.orderId) {
          orders[i].id = result.orderId
          i++
        } else {
          throw new Error(result)
        }
      }
    } catch (error) {
      throw this.formatError(error)
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
          positionSide: 'BOTH',
          quantity: this.instance.amountToPrecision(order.symbol, order.amount),
          stopPrice: this.instance.priceToPrecision(
            order.symbol,
            order.takeProfit
          ),
          newClientOrderId: order.clientOrderIdTP
        }
        const stopLoss = {
          symbol: order.symbol.replace('/', ''),
          side: order.side.toUpperCase() === 'BUY' ? 'SELL' : 'BUY',
          type: 'STOP_MARKET',
          positionSide: 'BOTH',
          quantity: this.instance.amountToPrecision(
            order.symbol,
            order.amountLoss
          ),
          stopPrice: this.instance
            .priceToPrecision(order.symbol, order.stopLoss)
            .toString(),
          newClientOrderId: order.clientOrderIdSL
        }

        const params = {
          batchOrders: encodeURIComponent(
            JSON.stringify([takeProfit, stopLoss])
          )
        }
        const results = await this.instance.fapiPrivatePostBatchOrders(params)
        if (results[0].orderId) {
          order.idTakeProfit = results[0].orderId
        } else {
          throw new Error(results[0])
        }

        if (results[1].orderId) {
          order.idStopLoss = results[1].orderId
        } else {
          console.log(results[1])

          throw new Error(results[1])
        }
      }
    } catch (error) {
      throw this.formatError(error)
    }
  }

  async cancelOrders(orders: OrderFutures[]) {
    try {
      for (const order of orders) {
        Logger.info(`Delete: ${order.toString()}`)
        // TODO: Fix this
        // const ids = [order.id, order.idTakeProfit, order.idStopLoss].filter(
        //   Boolean
        // )

        // const params = {
        //   symbol: order.symbol.replace('/', ''),
        //   orderIdList: encodeURIComponent(JSON.stringify(ids))
        // }
        // const results = await this.instance.fapiPrivateDeleteBatchOrders(params)
        // const results = await this.instance.fapiPrivateDeleteOrder({
        //   symbol: order.symbol.replace('/', ''),
        //   origClientOrderId: order.clientOrderId
        // })
        await this.instance.fapiPrivateDeleteAllOpenOrders({
          symbol: order.symbol.replace('/', '')
        })
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
    console.log(JSON.stringify(error));
    
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
