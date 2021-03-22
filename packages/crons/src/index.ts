import { binance } from 'ccxt'
import { intrend } from '@moneyprinter/technical-analysis'
import { Firebase } from '@moneyprinter/adapters'
;(async () => {
  try {
    const spot = new binance({
      timeout: 30000,
      enableRateLimit: true
    })
    const furure = new binance({
      timeout: 30000,
      enableRateLimit: true,
      options: { defaultType: 'future', adjustForTimeDifference: true }
    })

    const times = ['1m', '5m', '15m', '30m']
    // const times = ['5m', '15m', '30m', '1h', '4h']
    // const times = ['15m', '30m', '1h', '4h', '1d']
    const firebase = new Firebase()
    const markets = await furure.fetchMarkets()

    for (const market of markets) {
      let temp = {}
      try {
        for (const time of times) {
          const candels = await spot.fetchOHLCV(
            market.symbol,
            time,
            undefined,
            300
          )
          temp[time] = await intrend(candels)
          if (temp[time].signal !== 0) {
            console.log(`${market.symbol}: ${time} ${temp[time].signal}`)
          }
        }
        // console.table(temp)
        // firebase.saveTa(market.symbol, temp)
      } catch (error) {
        console.log(error)
      }
    }
  } catch (error) {
    console.error(error)
  }
})()
