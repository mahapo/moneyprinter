import { binance as Binance } from 'ccxt'
import { Firebase } from './models/Firebase'
;(async () => {
  const firebase = new Firebase()
  const exchange = new Binance({
    options: { defaultType: 'future' }
  })
  const tickers = await exchange.fetchTickers()
  console.log(tickers)

  const markets = await exchange.fetchMarkets()
  const res = markets.reduce((acc, curr) => ((acc[curr.id] = curr), acc), {})
  firebase.refBinance.doc('markets').set(res)
})()
