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
  roi: 0,
  wins: 0,
  losses: 0,
}
fs.createReadStream('./TradingView_Alerts_Log_2021-08-24.csv')
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
          roi: 0,
          trades: [],
          raw: [],
        }
      }
      // markets[symbol].raw.push(result)
      let currentTrade = markets[symbol].trades.slice(-1)[0] || {};
      let side = alert.buy_strong || alert.buy ? 'buy' : 'sell'

      if (currentTrade && currentTrade.status === 'open' && currentTrade.side !== side) {
        currentTrade.status = 'closed'
        currentTrade.exit = parseFloat(alert.close)
        currentTrade.roi = (parseFloat(alert.close) / currentTrade.entry) - 1
        if (currentTrade.side === 'sell') {
          currentTrade.roi = currentTrade.roi * -1
        }
        if (currentTrade.roi >= 0) {
          statistics.wins++
        } else {
          statistics.losses++
        }
        markets[symbol].roi += currentTrade.roi
        statistics.roi += currentTrade.roi
      }

      if (currentTrade.status !== 'open') {
        const all = false
        if (alert.buy_strong || (alert.buy && all)) {
          markets[symbol].buy_strong++
          markets[symbol].trades.push({
            status: 'open',
            side: side,
            entry: parseFloat(alert.close)
          })
        } else if (alert.sell_strong || (alert.sell && all)) {
          markets[symbol].sell_strong++
          markets[symbol].trades.push({
            status: 'open',
            side: side,
            entry: parseFloat(alert.close)
          })
        }
      }

      markets[symbol].count++
    }
    const stats = Object.entries(markets).filter((a) => a[1].count > 0 && a[1].roi !== 0).sort((a, b) => b[1].roi - a[1].roi)
    stats.forEach((a) => console.log(a[0], (a[1].roi*100).toFixed(2)))
    console.table(statistics);
    console.table(statistics.roi * 100 * 20);
    // [
    //   { NAME: 'Daffy Duck', AGE: '24' },
    //   { NAME: 'Bugs Bunny', AGE: '22' }
    // ]
  });