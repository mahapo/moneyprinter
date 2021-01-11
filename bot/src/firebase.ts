import { binance as Binance } from 'ccxt'
import { sortBy } from 'lodash'
import { Firebase } from './models/Firebase'
;(async () => {
  const firebase = new Firebase()
  // const exchange = new Binance({
  //   options: { defaultType: 'future' }
  // })
  // const tickers = await exchange.fetchTickers()
  // console.log(tickers)

  // const markets = await exchange.fetchMarkets()
  // const res = markets.reduce((acc, curr) => ((acc[curr.id] = curr), acc), {})
  let snapshot = await firebase.refBacktesting.get()
  snapshot = snapshot.docs.map(doc => doc.data())
  snapshot = sortBy(snapshot, ['profitPecentPerDay']).reverse()
  snapshot.length = 10
  console.log(snapshot.reverse());
  
})()
