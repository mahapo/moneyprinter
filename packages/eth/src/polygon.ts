const Web3 = require('web3')
import {
  getAddressesBalances
} from './balance-checker/web3'
import * as keys from './keys-all.json'
import {
  tokens
} from '../data/polygon/tokens.json'

var web3 = new Web3(
  new Web3.providers.HttpProvider(
    // 'wss://mainnet.infura.io/ws/v3/f9943db4650d46d382a3c490b0a5c113'
    'https://polygon-mainnet.g.alchemy.com/v2/G91Is6ouxoRzr9xEjBW2xdNJyksus7Uv'
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

;
(async () => {
  let addresses = keys
  console.log('Addresses:', addresses.length)
  console.log('Tokens:', tokens.length)
  console.log('Start:', addresses[0])
  console.log('End:', addresses[addresses.length - 1])

  let addressChunks = addresses
    // .filter(key => new RegExp(/[a-zA-Z]+/).test(key))
    .map(key => {
      try {
        return web3.eth.accounts.privateKeyToAccount(key)

      } catch (error) {
        console.log(key);

      }
    })
    // @ts-ignore
    .chunk_inefficient(10)
    .map(chunck =>
      chunck.reduce((a, key) => {
        a[key.address] = key.privateKey
        return a
      }, {})
    )
  let t = ['0x0000000000000000000000000000000000000000', ...tokens.map(token => token.address)]
  // tokens = 
  console.log(tokens.length);


  // for (const addresses of addressChunks) {
  //   try {
  //     await getAddressesBalances(web3, Object.keys(addresses), t, {
  //       contractAddress: '0x762cfc68D3630934Bb48d5343E5Dd91E09525bC8'
  //     }).then(
  //       balances => {
  //         // console.log(Object.entries(balances))

  //         const filteredBalances = Object.entries(balances)
  //           .filter(address => Object.values(address[1]).some(b => b !== '0' && parseInt(b) > 10e5))
  //           .map(([address, balance]) => [
  //             address,
  //             addresses[address],
  //             ...Object.entries(balance).filter(b => b[1] !== '0')
  //           ])
  //         if (filteredBalances.length) console.log(filteredBalances)
  //       }
  //     )
  //   } catch (error) {
  //     console.log(error.message)
  //   }
  // }

  console.log('End')
  process.exit()
})()