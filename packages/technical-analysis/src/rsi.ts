import * as tulind from 'tulind'

export function rsi(candels) {
  const close = candels.map(c => c[4])

  return new Promise((resolve, reject) =>
    tulind.indicators.rsi.indicator([close], [14], (err, results) => {
      if (err) reject(err)
      resolve(results[0][results.length - 1])
    })
  )
}
