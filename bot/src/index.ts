import { Firebase } from './models/Firebase'
import { TraderFutures } from '@moneyprinter/runners'
import { Binance } from '@moneyprinter/exchanges'
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
        recoveryGapInitial: 10,
        maxSteps: 5,
        ratio: 2
      }

      const traderSettings = [
        {
          symbol: 'BTC/USDT'
        },
        {
          symbol: 'ETH/USDT'
        }
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
  })
})()
