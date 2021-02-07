import { ExchangeBase } from '.'

import * as fs from 'fs'
import * as glob from 'glob'
import * as path from 'path'
import * as csv from 'csv-parser'
export class Tester extends ExchangeBase {
  ticks: any = []
  balances = {}

  constructor() {
    super({})
  }

  async startTicker(symbol) {
    var resolves
    var rejects
    const promise = new Promise((resolve, reject) => {
      resolves = resolve
      rejects = reject
    })
    this.ticks = await this.getTestTickes(__dirname + '/BTC/BTCUSDT_Test.csv')
    this.ticks.forEach((tick, index) => {
      if (index === 0) {
        this.balances[symbol] = [
          {
            timestamp: tick.timestamp,
            balance: 100
          }
        ]
      }

      this.emit(`${symbol}:Tick`, tick)
    })
    this.emit(`${symbol}:Finish`)
  }

  async getCurrentBalance(symbol): Promise<number> {
    return await this.balances[symbol][0].balance
  }

  async getTestTickes(filePath) {
    const results = await this.loadCSV(filePath)

    // @ts-ignore
    return results.map(tick => {
      let timestamp
      timestamp = tick.unix
      if (tick.unix.includes('+')) {
        timestamp = new Date(parseFloat(tick.unix))
        timestamp = timestamp.setHours(
          // @ts-ignore
          ...tick.date.split(':').join('.').split('.')
        )
      }

      return {
        timestamp: parseInt(timestamp),
        price: parseFloat(tick.price)
      }
    })
  }

  async loadCSV(filePath) {
    let data = []
    return new Promise(resolve => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', d => data.push(d))
        .on('end', () => resolve(data))
    })
  }

  getFiles() {
    return new Promise(resolve =>
      glob('./data/**/*.csv', {}, (er, files) => {
        resolve(
          files.map(file => ({
            text: path.parse(file).name,
            value: file
          }))
        )
      })
    )
  }
}
