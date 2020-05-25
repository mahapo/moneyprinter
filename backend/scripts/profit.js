const accounts = require("../data/accounts/demo.json");
const { bybit } = require("ccxt");

const main = async function () {
  const b = new bybit(accounts[0].account);
  b.setSandboxMode(true);
  const { result } = await b.openapiGetWalletFundRecords({
    type: "RealisedPNL",
  }); //openApiGetWalletFundRecords
  console.log(result.data);

  accounts;
  //   try {
  //     const index = parseInt(process.env.INDEX);

  //     const account = new Bybit(
  //       {
  //         ...accounts[index].account,
  //         enableRateLimit: true,
  //         rate_limit: 2000,
  //       },
  //       true
  //     );
  //     await account.init();
  //     await account.startWebSocket();

  //     const traderSettings = accounts[index].symbols.map((symbol) => ({
  //       symbol,
  //       ...accounts[index].settings,
  //     }));

  //     for (let setting of traderSettings) {
  //       const trader = new TraderLeveraged(account, setting);
  //       trader.start();
  //       await new Promise((resolve) => setTimeout(resolve, 2000));
  //     }
  //   } catch (error) {
  //     await new Promise((resolve) => setTimeout(resolve, 10000));
  //     throw new Error(error);
  //   }
};

main();
