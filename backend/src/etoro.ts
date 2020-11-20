import axios from 'axios'
import { setup } from 'axios-cache-adapter'

const etoro = setup({
  baseURL: 'https://www.etoro.com/sapi/',
  timeout: 1000,
  headers: {
    cookie: ''
    // 'intercom-session-x8o64ufr=Ukl6Qm1VQVNMdEVwcTJ2enpJNk8xRHdIRGMyM0dra1crYWExTnRuQ0RNNjdSNk1vMzQwNU1Hb3RGbmZPdTdJSC0tM2FJelNnMmdZNno2NDlZL0ZuSTI5dz09--09cc194184f94974ec0bdbe227a2fda49aad3f6e; TMIS2=9a74f8b353780f2fbe59d8dc1d9cd901437be0b823f8ee60d0ab3637053d1bd96c5fced5a3474a74b8fa2a8478e1e7d486976b6da919ae7b4b386e6ab2b19081e7b943e70cb8c90bc57f669f5b8a9ae34ad22b7dd2124a3a739f27e271236b28547bacc9a738db8c27419b0a3fd079a1b8c07362a39e1bd508267471081d8bc2ca;'
  },
  cache: {
    maxAge: 15 * 60 * 1000
  }
})

function getInstruments() {
  return etoro
    .get('/instrumentsmetadata/V1.1/instruments', {
      params: {}
    })
    .then(response => {
      // Response will not come from cache
      console.log('From cache:', response.request.fromCache)

      return response
    })
    .then(({ data }) => data)
    .then(({ InstrumentDisplayDatas }) => InstrumentDisplayDatas)
}

function getRanking() {
  return etoro
    .get('/rankings/rankings', {
      params: {
        blocked: false,
        bonusonly: false,
        copyblock: false,
        dailyddmin: -25,
        gainmin: 0,
        hasavatar: true,
        istestaccount: false,
        maxmonthlyriskscoremax: 6,
        maxmonthlyriskscoremin: 1,
        optin: true,
        pagesize: 1,
        period: 'OneYearAgo',
        popularinvestor: true,
        sort: '-copiers'
      }
    })
    .then(({ data }) => data)
    .then(({ Items }) => Items)
}

function getPositions(params) {
  return etoro
    .get('/trade-data-real/live/public/positions', {
      params
    })
    .then(({ data }) => data)
}

function getPortfolios(cid) {
  return etoro
    .get('/trade-data-real/live/public/portfolios', {
      params: {
        cid: cid,
        client_request_id: 'e29ba8f9-2903-4e55-b324-c201c3ab6528'
      }
    })
    .then(({ data }) => data)
}

;(async () => {
  try {
    const stats = {}
    const instruments = await getInstruments()
    const ranking = await getRanking()
    for (const user of ranking) {
      console.log(user.UserName, user.CustomerId)
      try {
        const portfolio = await getPortfolios(user.CustomerId)
        for (const position of portfolio.AggregatedPositions) {
          const symbol = instruments.find(
            i => i.InstrumentID === position.InstrumentID
          ).SymbolFull
          if (!stats[symbol]) {
            stats[symbol] = {
              symbol,
              buy: 0,
              sell: 0,
              count: 0
            }
          }

          stats[symbol].count++

          if (position.Direction === 'Buy') {
            stats[symbol].buy++
          } else {
            stats[symbol].sell++
          }
        }
      } catch (error) {
        console.log(error.message)
      }
    }
    const result = Object.values(stats).sort((a, b) => b.count - a.count)
    console.log(result)
  } catch (error) {
    console.log(error)
  }
})()
