import Bot from "./Bot";

(async function () {
  const bot = new Bot();
  // console.log(await bot.children());
  console.log(await bot.setLeverage("BTCUSD", 21.22));
  // console.log(await bot.fundAll(0, 0.11));

  //   let order = await account1.createOrder(
  //     "BTC/USD",
  //     "Stop",
  //     "Buy",
  //     1000,
  //     9000
  //   );

  //   console.log(await account1.fetchOpenOrders("BTC/USD"));

  // console.log(
  //   await account1.request("exchange/wallets/transferOut", "private", "POST", {
  //     "amount": 0.00666,
  //     "clientCnt": 1,
  //     "currency": "BTC"
  // })
  // );
})();
