const csv = require('csv-parser')
const fs = require('fs')
const results = [];

function objectFromMessage(message) {
  return Object.fromEntries(
    message.split(';').map(item => {
      let [key, value] = item.split(':')
      if (value === '0') {
        value = false
      } else if (value === '1') {
        value = true
      }
      return [key, value]
    })
  )
}
const markets = {}
const statistics = {
  percent: 0
}
fs.createReadStream('./TradingView_Alerts_Log_2021-08-23.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    for (const result of results.reverse()) {
      const alert = objectFromMessage(result.Description)
      const symbol = alert.ticker.replace('PERP', '')
      if (!markets[symbol]) {
        markets[symbol] = {
          buy_strong: 0,
          sell_strong: 0,
          buy: 0,
          sell: 0,
          count: 0,
          percent: 0,
          trades: [],
          raw: [],
        }
      }
      // markets[symbol].raw.push(result)
      let currentTrade = markets[symbol].trades.slice(-1)[0];
      if (currentTrade && currentTrade.status === 'open') {
        currentTrade.status = 'closed'
        currentTrade.exit = parseFloat(alert.close)
        currentTrade.percent = (parseFloat(alert.close) / currentTrade.entry) - 1
        if (currentTrade.side === 'sell') {
          currentTrade.percent = currentTrade.percent * -1
        }
        markets[symbol].percent += currentTrade.percent
        statistics.percent += currentTrade.percent
      }

      const all = true
      if (alert.buy_strong || (alert.buy && all)) {
        markets[symbol].buy_strong++
        markets[symbol].trades.push({
          status: 'open',
          side: 'buy',
          entry: parseFloat(alert.close)
        })
      } else if (alert.sell_strong || (alert.sell && all)) {
        markets[symbol].sell_strong++
        markets[symbol].trades.push({
          status: 'open',
          side: 'sell',
          entry: parseFloat(alert.close)
        })
      }
      markets[symbol].count++
    }
    // console.log(markets);
    console.table(statistics.percent*100*20);
    // [
    //   { NAME: 'Daffy Duck', AGE: '24' },
    //   { NAME: 'Bugs Bunny', AGE: '22' }
    // ]
  });