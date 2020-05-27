const accounts = require("../data/accounts/demo.json");
const { bybit } = require("ccxt");

const main = async function () {
  const b = new bybit(accounts[0].account);
  b.setSandboxMode(true);
  // const { result } = await b.openapiGetWalletFundRecords({
  //   type: "RealisedPNL",
  // }); //openApiGetWalletFundRecords
  const { result } = await b.privateLinearGetTradeClosedPnlList({symbol:"ETH/USD"}); //trade/closed-pnl/list
  console.log(result.data);
};

main();
