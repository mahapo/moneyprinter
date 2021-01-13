// https://www.cryptodatadownload.com/data/binance/
const fs = require('fs')
const csv = require('csv-parser')
const createCsvWriter = require('csv-writer').createObjectCsvWriter

const loadCSV = filePath => {
  let data = []
  return new Promise(resolve => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', d => data.push(d))
      .on('end', () => resolve(data))
  })
}

const btcFiles = [
  './data/LTC/LTCUSDT_August2019_Binance_prints.csv',
  './data/LTC/LTCUSDT_September2019_Binance_prints.csv',
  './data/LTC/LTCUSDT_October2019_Binance_prints.csv',
  './data/LTC/LTCUSDT_November2019_Binance_prints.csv',
  './data/LTC/LTCUSDT_December2019_Binance_prints.csv',
  './data/LTC/LTCUSDT_January2020_Binance_prints.csv'
]

;(async () => {
  const data = await Promise.all(btcFiles.map(loadCSV))

  const result = data.reduce((acc, current) => {
    return [
      ...acc,
      ...current
        .map(tick => {
          let time
          if (tick.unix.includes('+')) {
            time = new Date(parseFloat(tick.unix))
            time.setHours(...tick.date.split(':').join('.').split('.'))
            tick.unix = time.getTime()
          }

          return {
            unix: tick.unix,
            price: tick.price
          }
        })
        .filter(tick => !isNaN(tick.unix))
    ]
  }, [])
  console.log(result[0])
  const csvWriter = createCsvWriter({
    path: './data/LTCUSDT_August2019_January2020.csv',
    header: [
      { id: 'unix', title: 'unix' },
      { id: 'price', title: 'price' }
    ]
  })

  csvWriter
    .writeRecords(result)
    .then(() => console.log('The CSV file was written successfully'))
})()
