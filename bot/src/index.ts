import { Firebase } from './models/Firebase'
import { TraderFutures } from './models/runners'
import { Binance } from './models/exchanges'
;(async () => {
  const firebase = new Firebase()
  firebase.refAccounts.doc('real-1').onSnapshot(async doc => {
    var { options } = doc.data()

    try {
      const isDemo = false

      const account = new Binance(options, isDemo)
      await account.init()
      await account.startWebSocket()

      const commonSettings = {
        ratio: 2,
        maxSteps: 2
      }

      const traderSettings = [
        // {
        //   symbol: 'BTC/USDT',
        //   leverage: 100
        // },
        {
          symbol: 'ETH/USDT',
          leverage: 100
        }
        // {
        //   symbol: 'XRP/USDT',
        //   leverage: 75
        // },
        // {
        //   symbol: 'EOS/USDT',
        //   leverage: 50
        // },
        // {
        //   symbol: 'BNB/USDT',
        //   leverage: 75
        // },
        // {
        //   symbol: 'LTC/USDT',
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
  })
})()
