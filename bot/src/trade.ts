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
  firebase.refAccounts.doc('real-2').onSnapshot(async doc => {
    var { options } = doc.data()

    try {
      const account = new Binance(options, false)
      await account.init()
      await account.startWebSocket()

      const commonSettings = {
        recoveryGapDynamicAdd: 5,
        recoveryGapInitial: 20,
        maxSteps: 5,
        ratio: 3,
        useLimit: false
      }

      const markets = await account.leverageBracket(50, 50)
      markets.length = 30
      console.table(markets)
      for (let setting of markets) {
        setTimeout(() => {
          const trader = new TraderFutures(account, {
            ...setting,
            ...commonSettings
          })
          trader.start()
        }, 0)
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      throw new Error(error)
    }
  })
})()
