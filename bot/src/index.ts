import { Firebase } from '@moneyprinter/adapters'
import { TraderFutures } from '@moneyprinter/runners'
import { Binance } from '@moneyprinter/exchanges'
import * as Sentry from '@sentry/node'
Sentry.init({
  dsn:
    'https://4a350580542f46bdb422be3fe3db3901@o395422.ingest.sentry.io/5247177'
})
;(async () => {
  const firebase = new Firebase()
  firebase.refAccounts.doc('demo-1').onSnapshot(async doc => {
    var { options } = doc.data()

    try {
      const isDemo = true

      const account = new Binance(options, isDemo)
      await account.init()
      await account.startWebSocket()

      const commonSettings = {
        leverage: 75,
        recoveryGapDynamicAdd: 5,
        recoveryGapInitial: 30,
        maxSteps: 5,
        ratio: 3.5,
        useLimit: false,
        ta: false
      }

      const traderSettings = [
        {
          symbol: 'BTC/USDT',
          limit: 250000
        },
        {
          symbol: 'ETH/USDT',
          limit: 100000
        },
        {
          symbol: 'BCH/USDT',
          limit: 10000
        },
        {
          symbol: 'LTC/USDT',
          limit: 10000
        }
      ]

      for (let setting of traderSettings) {
        const trader = new TraderFutures(account, {
          ...setting,
          ...commonSettings
        })
        trader.start()
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      throw new Error(error)
    }
  })
})()
