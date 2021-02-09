const Web3 = require('web3')
import { getAddressesBalances } from './balance-checker/web3'
import { privateToAddress, getRandomWallet } from './vanity'
import * as range from 'lodash/range'

var web3 = new Web3(
  new Web3.providers.WebsocketProvider(
    'wss://mainnet.infura.io/ws/v3/f9943db4650d46d382a3c490b0a5c113'
  )
)

Object.defineProperty(Array.prototype, 'chunk_inefficient', {
  value: function (chunkSize) {
    var array = this
    return [].concat.apply(
      [],
      array.map(function (elem, i) {
        return i % chunkSize ? [] : [array.slice(i, i + chunkSize)]
      })
    )
  }
})

function getRange(start, end) {
  console.log('Start:', parseInt(start, 16))
  console.log('End:', parseInt(end, 16))
  console.log('Addresses:', parseInt(end, 16) - parseInt(start, 16))
  return range(parseInt(start, 16), parseInt(end, 16)).map(number =>
    number.toString(16).padStart(64, '0')
  )
}

const addressChunk = getRange('01', 'FFF')
  .map(key => web3.eth.accounts.privateKeyToAccount(key))
  .chunk_inefficient(200)
  .map(chunck =>
    chunck.reduce((a, key) => {
      a[key.address] = key.privateKey
      return a
    }, {})
  )

// const addresses = {
//   //   '0x22b7d4730f96a9e7a61efe05867d26f5636c3b65':
//   //     'decdbcae7cff6494227ff05b2ef39b0f2dcdf56ad80fff875d7fb08015a13dc9',
//   ...keys
// }
const tokens = ['0x0000000000000000000000000000000000000000']
;(async () => {
  for (const addresses of addressChunk) {
    getAddressesBalances(web3, Object.keys(addresses), tokens).then(
      balances => {
        const filteredBalances = Object.entries(balances)
          .filter(address => address[1][tokens[0]] !== '0')
          .map(([address, balance]) => [address, addresses[address], balance])
        if (filteredBalances.length) console.log(filteredBalances)
      }
    )
  }
})()
