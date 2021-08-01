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
      options.ticker = options.ticker.replace('USD', 'USDT')
    } else if (options.ticker.includes('USDTPERP')) {
      options.symbol = options.ticker.replace('USDTPERP', '/USDT')
      options.ticker = options.ticker.replace('USDTPERP', 'USDT')
    } else if (options.ticker.includes('PERP')) {
      options.symbol = options.ticker.replace('PERP', '/USDT')
      options.ticker = options.ticker.replace('PERP', 'USDT')
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

    if (options.buy_strong) {
      await binance.placeOrder(options.symbol, true)
    } else if (options.sell_strong) {
      await binance.placeOrder(options.symbol, false)
    } else if (options.buy) {
      await binance.placeOrder(options.symbol, true, true)
    } else if (options.sell) {
      await binance.placeOrder(options.symbol, false, true)
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
