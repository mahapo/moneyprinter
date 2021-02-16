var Web3 = require('web3')
// var { eth } = new Web3(Web3.givenProvider)
import * as range from 'lodash/range'
import { getRandomWallet } from './vanity'

let found = false

var hrstart = process.hrtime()
while (!found) {
  const account = getRandomWallet()
  if (/(.)\1{9}/g.test(account.address)) {
    console.log(account)
    found = true
  }
}
// for (const pad of range(0, 10000)) {
//   const account = getRandomWallet()
//   // const account = eth.accounts.create()
//   if (/(.)\1{2}/g.test(account.address)) {
//     found = true
//   }
// }
var hrend = process.hrtime(hrstart)
console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
