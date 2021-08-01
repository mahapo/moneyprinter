import { binance } from 'ccxt'
import { intrend } from '@moneyprinter/technical-analysis'
import { Firebase } from '@moneyprinter/adapters'
;(async () => {
  try {
    const option = {
      apiKey:
        'pFRG137adrt0DbZvf9whB7kXB62ceVV9xFuub6hAa7Zh0Sil1clxhRPF0zy3kUcK',
      secret:
        'BVmZcqP64sqcYMLMiZIRIlv6AsCKdCdEJBNyhCVkBCJtz5ZqmMVXGYaEVAD3qR0o',
      timeout: 30000,
      enableRateLimit: true
    }
    const spot = new binance(option)
    const address = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37'
    const memo = '2779980226'

    const future = new binance({
      ...option,
      options: { defaultType: 'future', adjustForTimeDifference: true }
    })

    const balances = await future.fetchBalance()
    const usdt = balances.free['USDT']
    console.log(usdt)

    await future.sapiPostAssetTransfer({
      type: 'UMFUTURE_MAIN',
      asset: 'USDT',
      amount: usdt * 0.2
    })

    // const { free } = await spot.fetchBalance()
    // const amount = spot.withdraw('XLM', free['XLM'], address, memo)
  } catch (error) {
    console.error(error)
  }
})()
