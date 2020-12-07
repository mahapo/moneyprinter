require('dotenv').config()
import { Backtester } from './models/runners'
// import { Tester } from './models/exchanges'

const main = async function () {
  try {
    const stettings = {
      file: './src/models/exchanges/Tester/BTC/BTCUSDT_Test.csv',
      symbol: 'BTC/USD',
      leverage: 50,
      ratio: 4.5,
      maxSteps: 4,
      percentOfMaxRange: 10
    }

    const trader = new Backtester()
    await trader.start(stettings)
  } catch (error) {
    console.debug('Main failed', error.message)
  }
}

main()
