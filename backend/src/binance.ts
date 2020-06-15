import { TraderLeveraged } from "./runners";
import { Binance, OrderBinance } from "./exchanges/Binance";
require("dotenv").config();

const main = async function () {
  try {
    const isDemo = true;

    const options = {
      apiKey: process.env.BINANCE_ID_DEMO,
      secret: process.env.BINANCE_SECRET_DEMO,
    };

    console.log(options);

    const account = new Binance(
      {
        apiKey: process.env.BINANCE_ID_DEMO,
        secret: process.env.BINANCE_SECRET_DEMO,
        options: { defaultType: "future" },
        timeout: 30000,
        enableRateLimit: true,
      },
      true
    );
    let order = new OrderBinance({
      price: 9100,
      timestamp: 0,
      amount: 10,
      leverage: 100,
      symbol: "BTC/USDT",
      ratio: 2,
      side: "buy",
    });
    await account.init();
    // console.log(await account.getCurrentPrice("BTC/USDT"));
    console.log(await account.resetAll("BTC/USDT"));
    console.log(await account.placeMarketStopOrder(order));
    // await account.startWebSocket();

    // const traderSettings = isDemo
    //   ? [
    //       {
    //         symbol: "BTC/USD",
    //         leverage: 50,
    //         ratio: 4.5,
    //         maxSteps: 4,
    //         percentOfMaxRange: 10,
    //       },
    //       {
    //         symbol: "ETH/USD",
    //         leverage: 50,
    //         ratio: 4.5,
    //         maxSteps: 4,
    //         percentOfMaxRange: 10,
    //       },
    //       {
    //         symbol: "EOS/USD",
    //         leverage: 50,
    //         ratio: 4.5,
    //         maxSteps: 4,
    //         percentOfMaxRange: 10,
    //       },
    //       {
    //         symbol: "XRP/USD",
    //         leverage: 50,
    //         ratio: 4.5,
    //         maxSteps: 4,
    //         percentOfMaxRange: 10,
    //       },
    //     ]
    //   : [
    //       {
    //         symbol: "BTC/USD",
    //         leverage: 60,
    //         ratio: 2.5,
    //         maxSteps: 3,
    //         percentOfMaxRange: 30,
    //       },
    //       {
    //         symbol: "ETH/USD",
    //         leverage: 50,
    //         ratio: 4.5,
    //         maxSteps: 3,
    //         percentOfMaxRange: 30,
    //       },
    //       {
    //         symbol: "EOS/USD",
    //         leverage: 50,
    //         ratio: 2,
    //         maxSteps: 5,
    //         percentOfMaxRange: 30,
    //       },
    //     ];

    // for (let setting of traderSettings) {
    //   const trader = new TraderLeveraged(account, setting);
    //   trader.start();
    //   await new Promise((resolve) => setTimeout(resolve, 2000));
    // }
  } catch (error) {
    throw new Error(error);
  }
};

main();
