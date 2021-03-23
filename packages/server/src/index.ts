import { Binance } from '@moneyprinter/exchanges'
import { duration } from 'moment'
const app = require('http').createServer()
const io = require('socket.io')(app)

app.listen(5000)
;(async () => {
  const exchange = new Binance({})
  exchange.ws.subscribeCandles({
    id: 'BTCUSDT'
  })
  //   exchange.ws.subscribeCandles({
  //     id: 'ETHUSDT'
  //   })

  const periods = [
    '1m',
    '2m',
    '3m',
    '5m',
    '15m',
    '30m',
    '1h',
    '2h',
    '4h',
    '6h',
    '8h',
    '12h',
    '1d',
    '3d',
    '1w',
    '2w',
    '1M'
  ].reduce((acc, val) => {
    acc[val] = duration(
      parseInt(val),
      // @ts-ignore
      val[val.length - 1] as string
    ).asMilliseconds()
    return acc
  }, {})
  //   console.log(duration(1, 'M').asMilliseconds())

  const lastCandel = {}
  const currentCandel = {}
  exchange.ws.on('candle', (candle, { id }) => {
    if (lastCandel[id] && lastCandel[id].timestampMs !== candle.timestampMs) {
      if (candle.timestampMs) {
        console.log('new candle')
        currentCandel[id] ??= {}

        for (const [period, time] of Object.entries(periods)) {
          let current = currentCandel[id][period]
          // @ts-ignore
          if (parseInt(candle.timestampMs) % time === 0) {
            if (current) console.log(period, current)
            else console.log(period, 'not set yet')
            current = candle
          } else if (current) {
            current.high = Math.max(current.high, candle.high)
            current.low = Math.min(current.low, candle.low)
            current.close = candle.close
            current.volume =
              parseFloat(candle.volume) + parseFloat(current.volume)
          }
          currentCandel[id][period] = current
        }
      }
    }
    lastCandel[id] = candle
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
