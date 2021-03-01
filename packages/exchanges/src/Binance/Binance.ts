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
        const { x, X, ot, s, c, i, q, l, z } = data.o
        const isTakeProfit = c.endsWith('-TP')
        const isStopLoss = c.endsWith('-SL')
        const isWebtrade = c.startsWith('web')
        const order = { clientOrderId: c, id: i }
        if (X === 'FILLED' && !isWebtrade && ot !== 'MARKET') {
          // console.table({ q, l, z })
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
        const isBuy = parseFloat(position.positionAmt) > 0
        const mainOrder = {
          symbol: position.symbol,
          side: isBuy ? 'SELL' : 'BUY',
          type: 'MARKET',
          // reduceOnly: true,
          quantity: isBuy
            ? position.positionAmt
            : parseFloat(position.positionAmt) * -1,
          positionSide: 'BOTH'
        }
        if (parseFloat(position.positionAmt) !== 0) {
          Logger.info(`Close Position: ${position.symbol}`)
          neworders.push(mainOrder)
        }
      }
      if (neworders.length) {
        console.table(neworders)
        const results = await this.placeBatchOrders(neworders)
        for (const result of results) {
          if (result.code === 400) {
            throw new Error('Can not close Position')
          }
        }
      }
    } catch (error) {
      Logger.log(this.formatError(error))
    }
  }

  async setLeverage(symbol, leverage: number) {
    // try {
    //   await this.instance.fapiPrivatePostMarginType({
    //     symbol: symbol.replace('/', ''),
    //     marginType: 'ISOLATED'
    //   })
    // } catch (error) {
    // }

    try {
      await this.instance.fapiPrivatePostLeverage({
        symbol: symbol.replace('/', ''),
        leverage
      })
    } catch (error) {
      console.log(error)
      // Logger.error(this.formatError(error))
    }
  }

  amountRounder(symbol, amount) {
    return this.instance.amountToPrecision(symbol, amount)
  }

  priceRounder(symbol, price) {
    return parseFloat(this.instance.priceToPrecision(symbol, price))
  }

  round(order: OrderFutures) {
    order.amount = this.instance.amountToPrecision(order.symbol, order.amount)
    order.amountLoss = this.instance.amountToPrecision(
      order.symbol,
      order.amountLoss
    )
    order.price = this.instance.priceToPrecision(order.symbol, order.price)
    order.stopLoss = this.instance.priceToPrecision(
      order.symbol,
      order.stopLoss
    )
    order.takeProfit = this.instance.priceToPrecision(
      order.symbol,
      order.takeProfit
    )
    return order
  }

  async fetchOHLCV(symbol: string, time = '3m', limit = 15) {
    try {
      return await this.instance.fetchOHLCV(symbol, time, undefined, limit)
    } catch (error) {
      throw this.formatError(error)
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

  async placeTpSLTs(orders: OrderFutures[], trailingstop = false) {
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

        const takeProfit = trailingstop
          ? {
              ...common,
              type: 'TRAILING_STOP_MARKET',
              quantity: this.instance.amountToPrecision(
                order.symbol,
                order.amount
              ),
              activationPrice: this.instance.priceToPrecision(
                order.symbol,
                order.takeProfit
              ),
              callbackRate: 1,
              newClientOrderId: order.clientOrderIdTP
              // reduceOnly: true
            }
          : {
              ...common,
              type: 'TAKE_PROFIT_MARKET',
              quantity: this.instance.amountToPrecision(
                order.symbol,
                order.amount
              ),
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
    let errors = []
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
          if (!errors) return results
        } catch (error) {
          errors.push(error)
        }
      } else {
        errors.push(error)
      }
      throw this.formatError(error)
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
