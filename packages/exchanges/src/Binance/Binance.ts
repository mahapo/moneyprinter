import { ExchangeBase } from '..'
import { OrderFutures } from '@moneyprinter/models'
import { binance as BinanceCCXT, ExchangeNotAvailable } from 'ccxt'
import { Logger } from '@moneyprinter/utils'
import SocketClient from './socketClient'
export class Binance extends ExchangeBase {
  instance: BinanceCCXT

  workingType: 'MARK_PRICE'

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
        const isTakeProfit = c.includes('-TP')
        const isStopLoss = c.endsWith('-SL')
        const isWebtrade = c.startsWith('web')
        const order = { clientOrderId: c, id: i }
        if (X === 'FILLED' && !isWebtrade && ot !== 'MARKET') {
          console.table(order)
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

  async setupSymbol(symbol, leverage) {
    try {
      const { info } = await this.instance.fetchBalance(symbol)
      const position = info.positions.find(
        pos => pos.symbol === symbol.replace('/', '')
      )

      if (parseFloat(position.positionAmt) !== 0) {
        Logger.info(symbol, `: Close Position`)
        const isBuy = parseFloat(position.positionAmt) >= 0
        await this.instance.fapiPrivatePostOrder({
          symbol: position.symbol,
          side: isBuy ? 'SELL' : 'BUY',
          type: 'MARKET',
          reduceOnly: true,
          quantity: isBuy
            ? position.positionAmt
            : parseFloat(position.positionAmt) * -1,
          positionSide: 'BOTH'
        })
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (!position.isolated) {
        console.log(symbol, ': Change mode to ISOLATED')

        await this.instance.fapiPrivatePostMarginType({
          symbol: symbol.replace('/', ''),
          marginType: 'ISOLATED'
        })
      }

      if (parseFloat(position.leverage) !== leverage) {
        console.log(symbol, ': Change leverage to ', leverage)
        await this.instance.fapiPrivatePostLeverage({
          symbol: symbol.replace('/', ''),
          leverage
        })
      }
    } catch (error) {
      throw Logger.error(this.formatError(error))
    }
  }

  async deleteOpenOrders(symbol) {
    try {
      Logger.info(symbol, `: Close open orders`)
      await this.instance.fapiPrivateDeleteAllOpenOrders({
        symbol: symbol.replace('/', '')
      })
    } catch (error) {
      throw Logger.error(this.formatError(error))
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

  async fetchOHLCV(symbol: string, time = '5m', limit = 16) {
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
          workingType: this.workingType
        }
        neworders.push(mainOrder)
      }
      const results = await this.placeBatchOrders(neworders)

      let i = 0
      for (const result of results) {
        if (result.orderId) {
          orders[i].id = result.orderId
          orders[i].idExchange.push(result.orderId)
          i++
        } else {
          throw result.msg || result
        }
      }
    } catch (error) {
      if (error instanceof ExchangeNotAvailable) {
        throw 'ExchangeNotAvailable'
      }
      throw this.formatError(error)
    }
  }

  async placeSlTs(order: OrderFutures) {
    try {
      Logger.info(`Set Stop Loss/Trailing Stop: ${order.toString()}`)
      const side = order.side === 'buy' ? 'sell' : 'buy'
      let price = order.takeProfit

      if (side === 'buy') {
        price = price * 1.01
      }

      if (side === 'sell') {
        price = price * 0.99
      }

      const orderStopLoss = await this.instance.createOrder(
        order.symbol,
        'STOP_MARKET',
        side,
        this.instance.amountToPrecision(order.symbol, order.amountLoss),
        null,
        {
          stopPrice: this.instance.priceToPrecision(
            order.symbol,
            order.stopLoss
          ),
          workingType: 'MARK_PRICE',
          newClientOrderId: order.clientOrderIdTP
        }
      )
      const orderTailingStop = await this.instance.createOrder(
        order.symbol,
        'TRAILING_STOP_MARKET',
        side,
        this.instance.amountToPrecision(order.symbol, order.amount),
        null,
        {
          stopPrice: this.instance.priceToPrecision(order.symbol, price),
          callbackRate: 0.1,
          workingType: this.workingType,
          newClientOrderId: order.clientOrderIdSL
        }
      )

      order.idTakeProfit = orderStopLoss.id
      order.idStopLoss = orderTailingStop.id
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
          workingType: this.workingType
        }

        const takeProfits = [...new Array(4)].map((t, i, a) => {
          // @ts-ignore
          const stepStop = parseFloat(order.takeProfit) * 0.001
          const stepPrice = stepStop / 4

          let stopPrice
          let price

          if (common.side === 'BUY') {
            stopPrice =
              // @ts-ignore
              parseFloat(order.takeProfit) - stepStop * i
            price = stopPrice - stepPrice
          } else {
            stopPrice =
              // @ts-ignore
              parseFloat(order.takeProfit) + stepStop * i
            price = stopPrice + stepPrice
          }

          const o = {
            ...common,
            type: 'STOP',
            quantity: this.instance.amountToPrecision(
              order.symbol,
              order.amount
            ),
            stopPrice: this.instance.priceToPrecision(order.symbol, stopPrice),
            price: this.instance.priceToPrecision(order.symbol, price),
            newClientOrderId: order.clientOrderIdTP + i
            // reduceOnly: true
          }
          if (a.length - 1 === i) {
            o.type = 'TAKE_PROFIT_MARKET'
            delete o.price
          }
          return o
        })

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
        const results = await this.placeBatchOrders([stopLoss, ...takeProfits])
        order.idStopLoss = results[0].orderId
        order.idTakeProfit = results[1].orderId

        results.forEach(result => order.idExchange.push(result.orderId))

        if (!results[1].orderId) {
          throw 'TakeProfit' + results[0].msg
        }

        if (!results[0].orderId) {
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
        Logger.error('ExchangeNotAvailable')
        for (const order of orders) {
          try {
            results.push(await this.instance.fapiPrivatePostOrder(order))
          } catch (error2) {
            errors.push(error2)
          }
        }
        if (!errors.length) return results
        else throw this.formatError(errors)
      } else {
        errors.push(error)
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
