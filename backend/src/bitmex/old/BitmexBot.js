import ccxt from "../../ccxt";
import firebase from 'firebase';
import symbols from './symbols.json';
import consola from 'consola';
import Order from "./Order";

//ps aux | grep python | grep telegram.py
//nohup python3 telegram.py &

var firebaseConfig = {
  apiKey: "AIzaSyCu2Yv_jHvdOG5-hDTSvz7GsXAhT-GLDWs",
  authDomain: "trading-ada0e.firebaseapp.com",
  databaseURL: "https://trading-ada0e.firebaseio.com",
  projectId: "trading-ada0e",
  storageBucket: "trading-ada0e.appspot.com",
  messagingSenderId: "71493175723"
};
export default class BitmexBot {

  constructor(config) {
    this.leverage = 20
    this.bankroll = 0.1
    this.config = config

    this.symbols = symbols
    this.initFirebase()
    this.initExchange()
    this.initTelegramEvents()
  }

  async initFirebase() {
    firebase.initializeApp(firebaseConfig);
    this.telegramDb = firebase.database().ref('telegram')
  }

  async initExchange() {
    this.bitmex = await new ccxt.bitmex(this.config.bitmex)
    consola.start("Bot init")

    // await this.closeAll("XBTUSD")
    // this.markets = await this.bitmex.fetchMarkets()
    // consola.log(this.markets.find(m => m.symbol === "XBTUSD"));

    await this.loadPrices()
    await this.setLeverage()
  }

  async setLeverage() {
    try {
      await this.asyncForEach(this.symbols, async (symbol, i) => {
        await this.bitmex.privatePostPositionLeverage({
          symbol: symbol.bitmex,
          leverage: this.leverage
        })
      })
    } catch (error) {
      consola.error(error)
    }
  }

  initTelegramEvents() {
    this.config.telegram.forEach(group => {
      let newItems = false
      this.telegramDb.child(group).on('child_added', snapshot => {
        if (!newItems) {
          return
        }
        this.onNewMessage(snapshot.val(), group + "_" + snapshot.key);
      })
      this.telegramDb.child(group).once('value', () => {
        newItems = true
      })
    })
  }

  onNewMessage(message, id = "") {
    // consola.debug(JSON.stringify(message))
    if (!message.raw_text) return
    let orderData = this.messageToOrderObject(message.raw_text)
    if (!orderData || !orderData.symbol || !orderData.bitmex) return
    if (orderData.ticker) orderData.priceLimit = this.scalePrice(orderData)
    if (!orderData.priceLimit) return
    this.makeOrder(orderData.ccxt, orderData.side, orderData.priceLimit, id)
  }

  async makeOrder(symbol, side, price, text = "") {
    // let size = await this.calcSize(price)
    let size = Math.round(0.02 * price * this.leverage)

    let order = new Order(symbol, side, price)

    let factor = side == "buy" ? 1 : -1
    let otherSide = side == "buy" ? "sell" : "buy"
    let precentTakeProfit = 30
    let precentStopLoss = 10
    let priceLimit = price
    let priceTakeProfit =
      priceLimit + (priceLimit / 100) * precentTakeProfit * factor
    let priceStopLoss =
      priceLimit - (priceLimit / 100 / precentStopLoss) * factor
    priceTakeProfit = priceTakeProfit.toFixed(this.retr_dec(price))
    priceStopLoss = priceStopLoss.toFixed(this.retr_dec(price))

    let orders = []

    try {
      // let orders = await this.bitmex.privateDeleteOrderAll({
      //   symbol
      // })
      // let positions = await this.bitmex.privatePostOrderClosePosition({
      //   symbol
      // })
      //Limit order
      consola.log(order.symbol, size, order.side, priceLimit, priceTakeProfit, priceStopLoss)
      orders[0] = await this.bitmex.create_order(
        symbol,
        "limit",
        side,
        size,
        priceLimit, {
          // simpleOrderQty: size,
          text
        }
      )

      orders[1] = await this.bitmex.create_order(
        symbol,
        "marketiftouched",
        otherSide,
        size,
        undefined, {
          // simpleOrderQty: size,
          ordType: "MarketIfTouched",
          execInst: "Close,LastPrice",
          stopPx: priceTakeProfit,
          text
        }
      )
      orders[2] = await this.bitmex.create_order(
        symbol,
        "stop",
        otherSide,
        size,
        undefined, {
          // simpleOrderQty: size,
          execInst: "Close,LastPrice",
          stopPx: priceStopLoss,
          text
        }
      )
    } catch (error) {
      consola.error(error)
    }
  }

  async loadPrices() {
    try {
      await this.asyncForEach(this.symbols, async (symbol, i) => {
        this.symbols[i].ticker = await this.bitmex.fetchTicker(symbol.ccxt)
      })
    } catch (error) {
      consola.error(error)
    }
  }

  async calcSize(price) {
    try {
      await this.loadBalance()
      return (this.balance.free * this.bankroll * this.leverage).toFixed(3)
    } catch (error) {
      consola.error(error)
    }
  }

  async loadBalance() {
    try {
      let balance = await this.bitmex.fetchBalance()
      this.balance = balance.BTC
    } catch (error) {
      consola.error(error)
    }
  }

  async setTakeProfitForAllPosition(symbol) {
    try {
      let positions = await this.bitmex.privateGetPosition()
      positions = positions.filter(p => p.isOpen)
    } catch (error) {
      consola.error(error)
    }
  }

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

  scalePrice(orderData) {
    let sum = orderData.prices.reduce(function (a, b) {
      return a + b;
    });
    let avg = Math.round(sum / orderData.prices.length)
    const scaleToRage = (price, last) => {
      let factor = (price / last)
      if (factor > 1.5) {
        return scaleToRage((price / 10), last)
      } else if (factor < 0.5) {
        return scaleToRage((price * 10), last)
      } else {
        return price
      }
    }
    return scaleToRage(avg, orderData.ticker.last)
  }

  messageToOrderObject(message) {
    let regexSymbol = /(BTC|TRX|ADA|ETH|XRP|EOS|BCH|LTC)/g
    let regexSide = /(SHORT|DOWN|BUY|SELL)/g
    let regexPrice = /\b[\+-]?[0-9]*[\.]?[0-9]+([eE][\+-]?[0-9]+)?\b/g

    let data = {
      symbol: message.toUpperCase().match(regexSymbol),
      side: message.toUpperCase().match(regexSide),
      prices: message.match(regexPrice)
    }
    if (!data.symbol || !data.side || !data.prices) {
      return
    }
    data = {
      ...data,
      ...this.symbols.find(s => s.telegram === data.symbol[0]),
      symbol: data.symbol[0],
      side: data.side[0] === "BUY" ? "buy" : "sell",
      prices: data.prices.map(p => Math.abs(p))
    }
    return data
  }

  retr_dec(num) {
    return (num.toString().split('.')[1] || []).length;
  }
}
