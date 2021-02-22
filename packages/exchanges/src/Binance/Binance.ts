import { ExchangeBase } from '..'
import { OrderFutures } from '@moneyprinter/models'
import { binance as BinanceCCXT, ExchangeNotAvailable } from 'ccxt'
import { Logger } from '@moneyprinter/utils'
import SocketClient from './socketClient'
export class Binance extends ExchangeBase {
  instance: BinanceCCXT

  constructor(options, private demo) {
    super(options)
    this.instance = new BinanceCCXT({
      ...options,
      options: { defaultType: 'future', adjustForTimeDifference: true },
      timeout: 30000
      // enableRateLimit: true
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
        const isWebtrade = c.startsWith('web')
        const order = { clientOrderId: c, id: i }
        if (X === 'FILLED' && !isWebtrade && ot !== 'MARKET') {
          // console.table({ x, X, ot, s, c, i })
          if (isTakeProfit) this.emit(`${s}:TakeProfit`, order)
          else if (isStopLoss) this.emit(`${s}:StopLoss`, order)
          else this.emit(`${s}:Filled`, order)
        } else {
          // Logger.info(`${ot}, ${X}, ${order.clientOrderId}`)
        }
      })
      socketApi.setHandler('ACCOUNT_UPDATE', () => {})
      // renew listenkey
      setInterval(async () => {
        await this.instance.fapiPrivatePutListenKey()
        console.info('ListenKey is renewed')
      }, 1000 * 60 * 30) // review the key every 30 mins
      resolve(true)
    })
  }

  async deleteOpenOrders(symbol) {
    try {
      Logger.info(`Close open orders: ${symbol}`)
      await this.instance.fapiPrivateDeleteAllOpenOrders({
        symbol: symbol.replace('/', '')
      })
    } catch (error) {
      throw Logger.error(this.formatError(error))
    }
  }
  async deleteOpenPositions(symbol) {
    try {
      // Logger.info(`Close open positions: ${symbol}`)
      const positions = await this.instance.fapiPrivateV2GetPositionRisk({
        symbol: symbol.replace('/', '')
      })

      const neworders = []
      for (const position of positions) {
        Logger.info(`Close Position: ${position.symbol}`)
        const isBuy = parseFloat(position.positionAmt) > 0
        const mainOrder = {
          symbol: position.symbol,
          side: isBuy ? 'SELL' : 'BUY',
          type: 'MARKET',
          quantity: isBuy
            ? position.positionAmt
            : parseFloat(position.positionAmt) * -1,
          positionSide: 'BOTH'
        }
        if (parseFloat(position.positionAmt) !== 0) neworders.push(mainOrder)
      }
      if (neworders.length) {
        const results = await this.placeBatchOrders(neworders)
      }
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
          positionSide: 'BOTH',
          type: 'STOP_MARKET',
          quantity: this.instance.amountToPrecision(order.symbol, order.amount),
          stopPrice: this.instance.priceToPrecision(order.symbol, order.price),
          newClientOrderId: order.clientOrderId,
          workingType: 'MARK_PRICE'
        }
        neworders.push(mainOrder)
      }
      const results = await this.placeBatchOrders(neworders)

      let i = 0
      for (const result of results) {
        if (result.orderId) {
          orders[i].id = result.orderId
          i++
        } else {
          throw result.msg || result
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

        const common = {
          symbol: order.symbol.replace('/', ''),
          side: order.side.toUpperCase() === 'BUY' ? 'SELL' : 'BUY',
          // positionSide: 'BOTH',
          workingType: 'MARK_PRICE'
        }

        const takeProfit = {
          ...common,
          type: 'TAKE_PROFIT_MARKET',
          quantity: this.instance.amountToPrecision(order.symbol, order.amount),
          stopPrice: this.instance.priceToPrecision(
            order.symbol,
            order.takeProfit
          ),
          newClientOrderId: order.clientOrderIdTP
          // reduceOnly: true
        }

        const stopLoss = {
          ...common,
          type: 'STOP_MARKET',
          quantity: this.instance.amountToPrecision(
            order.symbol,
            order.amountLoss
          ),
          stopPrice: this.instance.priceToPrecision(
            order.symbol,
            order.stopLoss
          ),
          // priceProtect: true,
          newClientOrderId: order.clientOrderIdSL
        }

        // Logger.info(
        //   `Set TakeProfit:  ${takeProfit.quantity} @ ${takeProfit.stopPrice}`
        // )
        // Logger.info(
        //   `Set StopLoss:  ${stopLoss.quantity} @ ${stopLoss.stopPrice}`
        // )
        const results = await this.placeBatchOrders([takeProfit, stopLoss])
        order.idTakeProfit = results[0].orderId
        order.idStopLoss = results[1].orderId

        if (!results[0].orderId) {
          console.table(results)
          throw 'TakeProfit' + results[0].msg
        }

        if (!results[1].orderId) {
          throw 'StopLoss' + results[1].msg
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

  async placeBatchOrders(orders) {
    let results = []
    try {
      const params = {
        batchOrders: encodeURIComponent(JSON.stringify(orders))
      }
      return await this.instance.fapiPrivatePostBatchOrders(params)
    } catch (error) {
      if (error instanceof ExchangeNotAvailable) {
        // Logger.error('ExchangeNotAvailable')
        try {
          for (const order of orders) {
            results.push(await this.instance.fapiPrivatePostOrder(order))
          }
          return results
        } catch (error) {
          // Logger.error(error)

          throw this.formatError(error)
        }
      } else {
        throw this.formatError(error)
      }
    }
  }

  formatedOrder(orderFromExchange) {}

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
