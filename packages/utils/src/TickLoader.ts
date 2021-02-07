import * as fs from 'fs'
import * as glob from 'glob'
import * as path from 'path'
import * as csv from 'csv-parser'

export class TickLoader {
  static async getTestTickes(filePath) {
    const results = await this.loadCSV(filePath)

    return (
      results
        // @ts-ignore
        .map(tick => {
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
        .filter(tick => !Number.isNaN(tick.timestamp))
    )
  }

  static async loadCSV(filePath) {
    let data = []
    return new Promise(resolve => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', d => data.push(d))
        .on('end', () => resolve(data))
    })
  }

  static getFiles() {
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
