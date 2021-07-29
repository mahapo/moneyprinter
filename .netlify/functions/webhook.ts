import { Handler } from '@netlify/functions'
import { Binance } from '../src/Binance'

//ticker:BLZUSDT;buy:0;sell:0;buy_strong:0;sell_strong:1;interval:1
//ticker:{{ticker}};buy:{{plot("Buy")}};sell:{{plot("Sell")}};buy_strong:{{plot("Strong Buy")}};sell_strong:{{plot("Strong Sell")}}

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

const handler: Handler = async (event, context) => {
  try {
    const options = objectFromMessage(event.body)
    if (options.ticker.includes('USDT')) {
      options.symbol = options.ticker.replace('USDT', '/USDT')
    } else if (options.ticker.includes('USD')) {
      options.symbol = options.ticker.replace('USD', '/USDT')
    } else if (options.ticker.includes('PERP')) {
      options.symbol = options.ticker.replace('PERP', '/USDT')
    }
    const binance = new Binance({
      apiKey:
        'pFRG137adrt0DbZvf9whB7kXB62ceVV9xFuub6hAa7Zh0Sil1clxhRPF0zy3kUcK',
      secret:
        'BVmZcqP64sqcYMLMiZIRIlv6AsCKdCdEJBNyhCVkBCJtz5ZqmMVXGYaEVAD3qR0o',
      enableRateLimit: true,
      options: { defaultType: 'future', adjustForTimeDifference: true }
      // verbose: true
    })
    const balance = await binance.getCurrentBalance('USDT')
    const price = await binance.getLastPrice(options.ticker)

    let amount = (balance / 20 / price) * binance.leverage
    amount = binance.amountToPrecision(options.symbol, amount)

    if (options.buy || options.buy_strong) {
      binance.placeOrder(options.ticker, true, amount)
    } else if (options.sell || options.sell_strong) {
      binance.placeOrder(options.ticker, false, amount)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Hello World' })
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify(error)
    }
  }
}

export { handler }
