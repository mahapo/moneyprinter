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

    const commonSettings = {
      ratio: 2,
      maxSteps: 2,
      percentOfMaxRange: 30
    }

    const traderSettings = [
      {
        symbol: 'BTC/USDT',
        leverage: 100
      }
      // {
      //   symbol: 'ETH/USDT',
      //   leverage: 100
      // }
      // {
      //   symbol: 'BCH/USDT',
      //   leverage: 50
      // },
      // {
      //   symbol: 'XRP/USDT',
      //   leverage: 50
      // },
      // {
      //   symbol: 'EOS/USDT',
      //   leverage: 50
      // },
      // {
      //   symbol: 'BNB/USDT',
      //   leverage: 50
      // },
      // {
      //   symbol: 'LTC/USDT',
      //   leverage: 50
      // },
      // {
      //   symbol: 'SNX/USDT',
      //   leverage: 50
      // },
      // {
      //   symbol: 'XMRUSDT',
      //   leverage: 50
      // },
      // {
      //   symbol: 'NEO/USDT',
      //   leverage: 50
      // }
    ]

    for (let setting of traderSettings) {
      const trader = new TraderFutures(account, {
        ...setting,
        ...commonSettings
      })
      trader.start()
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  } catch (error) {
    throw new Error(error)
  }
}

main()
