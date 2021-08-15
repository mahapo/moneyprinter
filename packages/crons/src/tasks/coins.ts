import { CoinGeckoClient } from 'coingecko-api-v3'
import * as symbols from './symbols.json'
//ticker:{{ticker}};buy:{{plot("Buy")}};sell:{{plot("Sell")}};buy_strong:{{plot("Strong Buy")}};sell_strong:{{plot("Strong Sell")}}

;(async () => {
  // const client = new CoinGeckoClient({
  //   timeout: 10000,
  //   autoRetry: true
  // })
  // const furure = new binance({
  //   timeout: 30000,
  //   enableRateLimit: true,
  //   options: { defaultType: 'future', adjustForTimeDifference: true }
  // })
  // const coins = await client.coinList({})

  // let markets = (await furure.fetchMarkets())
  //   .filter(market => market.quote === 'USDT')
  //   .map(market => market.base.toLowerCase())

  // const ids = coins
  //   .filter(c => markets.includes(c.symbol))
  //   .map(market => market.id)
  // const data = await client.coinMarket({
  //   vs_currency: 'USD',
  //   ids: ids.join(',')
  // })
  const result = symbols
    // @ts-ignore
    .sort((a, b) => b.quoteVolume - a.quoteVolume)
    // .sort((a, b) => a.quoteVolume - b.quoteVolume)
    .map(market => ({ symbol: market.symbol, volume: market.quoteVolume }))
  console.table(result)
})()
