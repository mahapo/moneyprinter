import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as bodyParser from 'koa-bodyparser'
import { ChartRoutes } from './routes'

const port = 4000
const dev = process.env.NODE_ENV === 'development'

async function main() {
  const app = new Koa()
  const router = new Router()

  ChartRoutes.forEach(route => router[route.method](route.path, route.action))

  app.use(router.routes())
  app.use(router.allowedMethods())
  app.use(bodyParser())

  const httpServer = app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}${graphQLServer.graphqlPath}`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${port}${graphQLServer.subscriptionsPath}`);
  })
}

main().catch(e => console.log(e))