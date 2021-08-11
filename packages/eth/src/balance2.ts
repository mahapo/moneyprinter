const Web3 = require('web3')
import {
  getAddressesBalances
} from './balance-checker/web3'
// import * as keys from './active.json'
import * as keys from './keys-code2.json'
import {
  tokens
} from './all.json'

var web3 = new Web3(
  new Web3.providers.HttpProvider(
    // 'wss://mainnet.infura.io/ws/v3/f9943db4650d46d382a3c490b0a5c113'
    'https://api.mycryptoapi.com/eth'
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

  ;(async () => {


    let addresses = keys.reverse()
    let t = ['0x0000000000000000000000000000000000000000',...tokens.slice(0, 100).map(token => token.address)]
  // console.log('Addresses:', addresses.length)
  console.log('Start:', addresses[0])
  console.log('End:', addresses[addresses.length - 1])

  let addressChunks = addresses
    .map(key => web3.eth.accounts.privateKeyToAccount(key))
    // @ts-ignore
    .chunk_inefficient(10)
    .map(chunck =>
      chunck.reduce((a, key) => {
        a[key.address] = key.privateKey
        return a
      }, {})
    )
  // tokens = tokens.map(token => token.address)
    tokens.length = 1000

  for (const addresses of addressChunks) {
    await getAddressesBalances(web3, Object.keys(addresses), t, {
      // contractAddress: '0xB12aeC3A7e0B8CFbA307203a33c88a3BBC0D9622'
    }).then(
      balances => {
        // console.log(Object.entries(balances))

        const filteredBalances = Object.entries(balances)
          .filter(address => Object.values(address[1]).some(b => b !== '0' && parseInt(b) > 10e12))
          // .filter(address => Object.values(address[1]).some(b => b !== '0'))
          .map(([address, balance]) => [
            address,
            addresses[address],
            ...Object.entries(balance).filter(b => b[1] !== '0')
          ])
        if (filteredBalances.length) console.log(filteredBalances)
      }
    ).catch((err) => {
      console.log(err.message)
    })
  }

  console.log('End')
  process.exit()
})()