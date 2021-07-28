import fastify from 'fastify'
import socketioServer from 'fastify-socket.io'

import { Firebase } from '@moneyprinter/adapters'
import { Binance } from '@moneyprinter/exchanges'

const app = fastify({ logger: false })

// symbol: BTCUSD; timestamp: 1616769660000; period: 1; price: 53240.5925934; id: v3; side: long; tp: 54492.4789816; sl: 48528.0618064; action: entry;
// symbol: BTCUSD; timestamp: 1616770740000; period: 1; price: 53557.704564; id: v3; side: long; tp: 54486.0739374; sl: 48522.3578196; action: close;

function objectFromMessage(message) {
  return Object.fromEntries(message.split(';').map(item => item.split(':')))
}

;(async () => {
  const firebase = new Firebase()
  firebase.refAccounts.doc('demo-1').onSnapshot(async doc => {
    var { options } = doc.data()
    const message =
      'symbol:BTCUSD;timestamp:1616769660000;period:1;price:53240.5925934;id:v3;side:long;tp:54492.4789816;sl:48528.0618064;action:entry'
    console.log(objectFromMessage(message))

    try {
      const isDemo = true
      const account = new Binance(options, isDemo)
      await account.init()

      app.register(socketioServer)

      app.get('/', async (req, reply) => {
        reply.header('content-type', 'application/json')
        reply.send(true)
      })

      app.post('/webhook', async (req, reply) => {
        console.table(req.body)
        reply.header('content-type', 'application/json')
        reply.send(true)
      })

      app.ready(err => {
        if (err) throw err
        console.info(app.printRoutes())

        app.io.on('connect', socket =>
          console.info('Socket connected!', socket.id)
        )
      })

      app.listen(80, '0.0.0.0')
    } catch (error) {
      throw new Error(error)
    }
  })
})()
