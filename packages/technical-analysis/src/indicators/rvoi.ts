import * as takeRight from 'lodash/takeRight'

export function rvoi(candels, count = 20): Promise<number> {
  const volumes = takeRight(candels, count).map(c => c[5])
  return new Promise((resolve, reject) => {
    const average = arr => arr.reduce((p, c) => p + c, 0) / arr.length
    const rvoi = volumes[volumes.length - 1] / average(volumes)
    resolve(parseFloat(rvoi.toFixed(3)))
  })
}
