import { Binance } from '@moneyprinter/exchanges'
const app = require('http').createServer()
const io = require('socket.io')(app)
import { OHLCV } from 'candlestick-convert'

app.listen(5000)
;(async () => {
  const exchange = new Binance({})
  const periods = exchange.periods
  const candels = {}
  const lastCandels = {}
  const currentCandels = {}
  const symbols = ['BTC/USDT']

  for (const symbol of symbols) {
    const id = symbol.replace('/', '')
    candels[id] = {}
    currentCandels[id] = {}
    for (const period of Object.keys(periods)) {
      const c = await exchange.fetchOHLCV(symbol, period, 3)
      candels[id][period] = c
      currentCandels[id][period] = candels[id][period][c.length - 1]
      candels[id][period].pop()
    }
    exchange.ws.subscribeCandles({
      id
    })
    console.table(candels[id]['1m'])
  }

  exchange.ws.on('candle', (candle, { id }) => {
    candle = Object.values(candle).map(number => parseFloat(number as string))

    if (lastCandels[id] && lastCandels[id][0] !== candle[0]) {
      console.log('new candle')

      for (const [period, time] of Object.entries(periods)) {
        let current = currentCandels[id][period]
        // @ts-ignore
        if (parseInt(candle[0]) % time === 0) {
          if (current) {
            candels[id][period].push(current)
            console.log(period)
            console.table(candels[id][period])
          } else console.log(period, 'not set yet')
          current = [...candle]
        } else if (current) {
          console.log(period, 'update')
          current[2] = Math.max(current[2], candle[2])
          current[3] = Math.min(current[3], candle[3])
          current[4] = candle[4]
          current[5] = parseFloat(candle[5]) + parseFloat(current[5])
          currentCandels[id][period] = [...current]
        }
      }
    }
    lastCandels[id] = candle
  })

  io.on('connection', async socket => {
    console.log('a user connected', socket.id)

    // socket.emit('files', files)
    // socket.on('backtestMatrix', options => backtester.startMatrix(options))

    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
  })
})()

process.on('uncaughtException', err => {
  console.log('There was an uncaught error', err)
  process.exit(1) //mandatory (as per the Node.js docs)
})
