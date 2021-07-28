import { rsi, rvoi } from '../indicators'

export async function intrend(candels) {
  const indicator = {
    rvoi: await rvoi(candels),
    rsi10: await rsi(candels, 10),
    rsi250: await rsi(candels, 250)
  }

  let signal = 0

  //   if (indicator.rvoi > 3) {
  if (indicator.rsi250 > 52 && indicator.rsi10 < 30) {
    signal = 1
  }
  if (indicator.rsi250 < 48 && indicator.rsi10 > 70) {
    signal = -1
  }
  //   }
  //   console.log(indicator)

  return {
    indicator,
    signal
  }
}
