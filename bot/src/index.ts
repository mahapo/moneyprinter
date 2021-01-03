require('dotenv').config()
import { Backtester } from './models/runners'
// import { Tester } from './models/exchanges'

const main = async function () {
  try {
    const stettings = {
      file:
        './src/models/exchanges/Tester/BTC/BTCUSDT_August2019_January2020.csv',
      symbol: 'BTC/USD',
      leverage: 75,
      ratio: 2,
      maxSteps: 10,
      percentOfMaxRange: 10
    }

    const trader = new Backtester()
    await trader.start(stettings)
  } catch (error) {
    console.debug('Main failed', error.message)
  }
}

main()
