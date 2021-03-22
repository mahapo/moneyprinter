require('dotenv').config()
import { TraderFutures } from '@moneyprinter/runners'
import { Binance } from '@moneyprinter/exchanges'

const main = async function () {
  try {
    const isDemo = true

    const options = {
      apiKey: process.env.BINANCE_ID_DEMO,
      secret: process.env.BINANCE_SECRET_DEMO
      // verbose: true
    }

    const account = new Binance(options, isDemo)
    // await account.init()
    // await account.startWebSocket()

    const commonSettings = {
      ratio: 2,
      maxSteps: 2,
      percentOfMaxRange: 30
    }

    const traderSettings = await account.leverageBracket(75, 75)
    console.log(traderSettings)

    // for (let setting of traderSettings) {
    //   const trader = new TraderFutures(account, {
    //     ...setting,
    //     ...commonSettings
    //   })
    //   trader.start()
    //   await new Promise(resolve => setTimeout(resolve, 2000))
    // }
  } catch (error) {
    throw new Error(error)
  }
}

main()
