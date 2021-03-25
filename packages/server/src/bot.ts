import fastify from 'fastify'
import socketioServer from 'fastify-socket.io'

const app = fastify({ logger: false })

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

  app.io.on('connect', socket => console.info('Socket connected!', socket.id))
})

app.listen(1337, '0.0.0.0')
