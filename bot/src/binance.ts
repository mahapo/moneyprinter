require('dotenv').config()
import { TraderFutures } from './models/runners'
import { Binance } from './models/exchanges'

const main = async function () {
  try {
    const isDemo = true

    const options = {
      apiKey: process.env.BINANCE_ID_DEMO,
      secret: process.env.BINANCE_SECRET_DEMO
      // verbose: true
    }

    const account = new Binance(options, isDemo)
    await account.init()
    await account.startWebSocket()

    const traderSettings = [
      {
        symbol: 'BTC/USDT',
        leverage: 100,
        ratio: 2.5,
        maxSteps: 10,
        percentOfMaxRange: 30
      }
      // {
      //   symbol: "ETH/USD",
      //   leverage: 50,
      //   ratio: 4.5,
      //   maxSteps: 3,
      //   percentOfMaxRange: 30,
      // },
      // {
      //   symbol: "EOS/USD",
      //   leverage: 50,
      //   ratio: 2,
      //   maxSteps: 5,
      //   percentOfMaxRange: 30,
      // },
    ]

    for (let setting of traderSettings) {
      const trader = new TraderFutures(account, setting)
      trader.start()
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  } catch (error) {
    throw new Error(error)
  }
}

main()
