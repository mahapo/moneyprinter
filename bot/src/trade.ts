import { Firebase } from './models/Firebase'
import { TraderFutures } from '@moneyprinter/runners'
import { Binance } from '@moneyprinter/exchanges'
;(async () => {
  const firebase = new Firebase()
  firebase.refAccounts.doc('real-2').onSnapshot(async doc => {
    var { options } = doc.data()

    try {
      const isDemo = false

      const account = new Binance(options, isDemo)
      await account.init()
      await account.startWebSocket()

      const commonSettings = {
        leverage: 75,
        recoveryGapDynamicAdd: 5,
        recoveryGapInitial: 10,
        maxSteps: 5,
        ratio: 4
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
          symbol: 'ADA/USDT',
          limit: 10000
        },
        {
          symbol: 'BNB/USDT',
          limit: 10000
        },
        {
          symbol: 'DOT/USDT',
          limit: 10000
        },
        // {
        //   symbol: 'EOS/USDT',
        //   limit: 10000
        // },
        // {
        //   symbol: 'ETC/USDT',
        //   limit: 10000
        // },
        // {
        //   symbol: 'LINK/USDT',
        //   limit: 10000
        // },
        {
          symbol: 'LTC/USDT',
          limit: 10000
        },
        // {
        //   symbol: 'TRX/USDT',
        //   limit: 10000
        // },
        // {
        //   symbol: 'XLM/USDT',
        //   limit: 10000
        // },
        {
          symbol: 'XRP/USDT',
          limit: 10000
        },
        // {
        //   symbol: 'XTZ/USDT',
        //   limit: 10000
        // },
        // {
        //   symbol: 'BCH/USDT',
        //   limit: 10000
        // }
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
