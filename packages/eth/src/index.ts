var Web3 = require('web3')
var { eth } = new Web3(Web3.givenProvider)

let found = false

while (!found) {
  const account = eth.accounts.create()
  if (/(.)\1{6}/g.test(account.address)) {
    console.log(account)
    found = true
  }
}
