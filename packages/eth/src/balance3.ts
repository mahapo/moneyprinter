const Web3 = require('web3')
import {
  getAddressesBalances
} from './balance-checker/web3'
import * as keys from './keys-merged.json'
import {
  tokens
} from './pancakeswap.json'

var web3 = new Web3(
  new Web3.providers.HttpProvider(
    // 'wss://mainnet.infura.io/ws/v3/f9943db4650d46d382a3c490b0a5c113'
    'https://bsc-dataseed.binance.org'
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


  // const addresses = {
  //   //   '0x22b7d4730f96a9e7a61efe05867d26f5636c3b65':
  //   //     'decdbcae7cff6494227ff05b2ef39b0f2dcdf56ad80fff875d7fb08015a13dc9',
  //   ...keys
  // }
  // const tokens = [
  //   '0xdac17f958d2ee523a2206206994597c13d831ec7',
  //   '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  //   '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  //   '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
  //   '0x4fabb145d64652a948d72533023f6e7a623c7c53',
  //   '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  //   '0x514910771af9ca656af840dff83e8264ecf986ca',
  //   '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  //   '0x3883f5e181fccaf8410fa61e12b59bad963fb645',
  //   '0xd850942ef8811f2a866692a623011bde52a462c1',
  //   '0x6b175474e89094c44da98b954eedeac495271d0f',
  //   '0x6e1A19F235bE7ED8E3369eF73b196C07257494DE',
  //   '0xe1be5d3f34e89de342ee97e6e90d405884da6c67',
  //   '0x39aa39c021dfbae8fac545936693ac917d5e7563',
  //   '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
  //   '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b',
  //   '0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d',
  //   '0x75231f58b43240c9718dd58b4967c5114342a86c',
  //   '0xc00e94cb662c3520282e6f5717214004a7f26888',
  //   '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
  //   '0xff20817765cb7f73d4bde2e66e067e58d11095c2',
  //   '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  //   '0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3',
  //   '0x0000000000000000000000000000000000000000'
  // ];
  ;(async () => {


  let addresses = keys
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
    let t = ['0x0000000000000000000000000000000000000000',...tokens.map(token => token.address)]
  // tokens = 

  for (const addresses of addressChunks) {
    await getAddressesBalances(web3, Object.keys(addresses), t, {
      contractAddress: '0xB12aeC3A7e0B8CFbA307203a33c88a3BBC0D9622'
    }).then(
      balances => {
        // console.log(Object.entries(balances))

        const filteredBalances = Object.entries(balances)
          .filter(address => Object.values(address[1]).some(b => b !== '0'))
           .map(([address, balance]) => [
            address,
            addresses[address],
            ...Object.entries(balance).filter(b => b[1] !== '0')
          ])
        if (filteredBalances.length) console.log(filteredBalances)
      }
    )
  }

  console.log('End')
  process.exit()
})()