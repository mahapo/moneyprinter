import { binance } from 'ccxt'
import { rsi, rvoi } from '@moneyprinter/technical-analysis'
import * as markets from '@moneyprinter/config/trade.json'
import { Firebase } from '@moneyprinter/adapters'
;(async () => {
  try {
    const exchange = new binance({
      timeout: 30000,
      enableRateLimit: true
    })

    //   const times = ['1m', '5m', '15m', '30m', '1h', '4h']
    const times = ['15m', '30m', '1h', '4h', '1d']
    const firebase = new Firebase()

    for (const market of markets) {
      let temp = {}
      for (const time of times) {
        const candels = await exchange.fetchOHLCV(
          market.symbol,
          time,
          undefined,
          100
        )
        temp[time] = {
          rvoi: await rvoi(candels),
          rsi: await rsi(candels)
        }
      }
      firebase.saveTa(market.symbol, temp)
      console.table(temp)
    }
  } catch (error) {
    console.error(error)
  }
})()
