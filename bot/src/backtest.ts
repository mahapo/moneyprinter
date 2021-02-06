require('dotenv').config()
import { Backtester } from './models/runners'
import { Firebase } from './models/Firebase'
import { Matrix } from './models/utils/Matrix'
import { TickLoader } from './models/utils/TickLoader'

const main = async function () {
  try {
    const firebase = new Firebase()
    const save = true
    const trader = new Backtester()
    // trader.on('backtestFinish', result => {
    //   const {balances, ...rest} = result
    //   firebase.saveBacktestResult(rest,balances)
    // })

    let settings = [
      {
        key: 'leverage',
        start: 50,
        end: 100,
        step: 10
      },
      {
        key: 'ratio',
        start: 2,
        end: 6,
        step: 1
      },
      {
        key: 'maxSteps',
        start: 50,
        end: 50,
        step: 2
      }
    ]
      .map(input => {
        const steps = (input.end - input.start) / input.step + 1
        return {
          ...input,
          total: steps
        }
      })
      .map(input => {
        return {
          key: input.key,
          steps: [...Array(input.total)].map((_step, index) =>
            parseFloat((input.start + input.step * index).toFixed(1))
          )
        }
      })
    console.log(settings)

    let matrix = Matrix.createTestMatrix(settings)
    console.log('Tests:', matrix.length)

    let ticks = await TickLoader.getTestTickes(
      './data/BTC/BTCUSD_Gemini_Q1_2020_prints.csv'
    )

    // if (options.file.includes('BTCUSDT')) symbol = 'BTC/USD'
    // else if (options.file.includes('ETHUSDT')) symbol = 'ETH/USD'
    // else if (options.file.includes('EOSUSDT')) symbol = 'EOS/USD'
    // else if (options.file.includes('XRPUSDT')) symbol = 'XRP/USD'
    // else if (options.file.includes('LINKUSDT')) symbol = 'LINK/USD'
    // else if (options.file.includes('LTCUSDT')) symbol = 'LTC/USD'

    for (const setting of matrix) {
      console.log(JSON.stringify(setting))

      const result = await trader.run(setting, ticks)

      if (save) {
        const { balances, ...rest } = result
        await firebase.saveBacktestResult(rest, balances)
      }
      // break;
    }

    console.log('Fin')
  } catch (error) {
    console.debug('Main failed', error.message)
  }
}

main()
