import * as EtherdeltaABI from './abis/Etherdelta.abi.json'

const Web3 = require('web3')
const Tx = require('ethereumjs-tx')

var web3 = new Web3(
  new Web3.providers.WebsocketProvider(
    'wss://mainnet.infura.io/ws/v3/f9943db4650d46d382a3c490b0a5c113'
  )
)

const etherdelta = new web3.eth.Contract(
  EtherdeltaABI,
  '0x8d12A197cB00D4747a1fe03395095ce2A5CC6819'
)

const address = '0xbf0b2296d609d42cb138ee24cb546446fdd5bb97'
const key = '0x950a5629de352df375a4d8b9d0ec296775e28485bb5bffe05e6755139bff8951'
const token = '0x0000000000000000000000000000000000000000'

web3.eth.accounts.wallet.add(key)

etherdelta.methods
  .balanceOf(token, address)
  .call()
  .then(function (amount) {
    console.log(amount)
    const withdrawToken = etherdelta.methods.withdrawToken(token, amount)

    withdrawToken
      .send({ from: address, gasPrice: 60, gas: 1600000 })
      .on('transactionHash', function (hash) {
        console.log('transactionHash', hash)
      })
      .on('confirmation', function (confirmationNumber, receipt) {
        console.log('confirmation', confirmationNumber, receipt)
      })
      .on('receipt', function (receipt) {
        // receipt example
        console.log('receipt', receipt)
      })
      .on('error', function (error, receipt) {
        // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.log('error', error, receipt)
      })
  })
