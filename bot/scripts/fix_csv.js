const fs = require('fs')
const csv = require('csv-parser')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const sortBy = require('lodash/sortBy')
const uniq = require('lodash/uniq')

const loadCSV = filePath => {
  let data = []
  return new Promise(resolve => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', d => data.push(d))
      .on('end', () => resolve(data))
  })
}

;(async () => {
  const filename = 'BTC/BTCUSDT_August2019_January2020'
  let ticks = await loadCSV(`data/${filename}.csv`)
  console.log(`Before: ${ticks.length} ticks`)
  ticks = sortBy(ticks, 'unix')
  let lastPrice
  const reducer = (accumulator, currentValue) => {
    currentValue.price = parseFloat(currentValue.price).toFixed(1)
    if (currentValue.price !== lastPrice) {
      accumulator.push(currentValue)
      lastPrice = currentValue.price
    }
    return accumulator
  }
  ticks = ticks.reduce(reducer, [])
  console.log(`After: ${ticks.length} ticks`)
  const csvWriter = createCsvWriter({
    path: `data/${filename}-fixed.csv`,
    header: [
      { id: 'unix', title: 'unix' },
      { id: 'price', title: 'price' }
    ]
  })

  csvWriter
    .writeRecords(ticks)
    .then(() => console.log('The CSV file was written successfully'))
})()
