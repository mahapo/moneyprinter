import { RSI } from 'technicalindicators'

export function rsi(candels, period = 14) {
  const close = candels.map(c => c[4])

  return new Promise((resolve, reject) => {
    const results = RSI.calculate({ values: close, period })
    resolve(results[results.length - 1])
  })
}
