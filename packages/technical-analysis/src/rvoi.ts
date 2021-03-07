export function rvoi(candels): Promise<number> {
  const volumes = candels.map(c => c[5])

  return new Promise((resolve, reject) => {
    const average = arr => arr.reduce((p, c) => p + c, 0) / arr.length
    resolve(average(volumes) / volumes[volumes.length - 1])
  })
}
