import { binance } from 'ccxt'
import { rsi, rvoi } from '@moneyprinter/technical-analysis'
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

    const times = ['5m', '15m', '30m', '1h', '4h']
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
            100
          )
          temp[time] = {
            rvoi: await rvoi(candels),
            rsi: await rsi(candels)
          }
        }
        firebase.saveTa(market.symbol, temp)
        console.table(temp)
      } catch (error) {
        console.log(error)
      }
    }
  } catch (error) {
    console.error(error)
  }
})()
