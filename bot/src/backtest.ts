require('dotenv').config()
import { Backtester } from './models/runners'
import { Firebase } from './models/Firebase'
import { Matrix } from './models/utils/Matrix'


const main = async function () {
  try {
    const firebase = new Firebase()
    
    const trader = new Backtester()
    // trader.on('backtestFinish', result => {
    //   const {balances, ...rest} = result    
    //   firebase.saveBacktestResult(rest,balances)
    // })

    
    let settings = [{
      key: 'leverage',
      start: 20,
      end: 50,
      step: 5
    },{
      key: 'ratio',
      start: 2,
      end: 6,
      step: 0.5
    },{
      key: 'maxSteps',
      start: 3,
      end: 8,
      step: 1
    }].map((input) => {
      const steps = (input.end - input.start) / input.step + 1
      return {
        ...input,
        total: steps,
      }
    }).map((input) => {
      return {
        key: input.key,
        steps: [...Array(input.total)].map((_step, index) =>
          parseFloat((input.start + input.step * index).toFixed(1))
        ),
      }
    })
    
    let matrix = Matrix.createTestMatrix(settings);
    console.log("Tests:", matrix.length);
    
    for (const setting of matrix) {
      
      const result = await trader.start({
        file: './src/models/exchanges/Tester/LTCUSDT_August2019_January2020.csv',
        ...setting
      })
      const {balances, ...rest} = result   
      await firebase.saveBacktestResult(rest,balances)
    }
    
    console.log("Fin");
    
  } catch (error) {
    console.debug('Main failed', error.message)
  }
}

main()
