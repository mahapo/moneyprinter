import { TraderLeveraged } from "./runners";
import { Bybit } from "./exchanges";
require("dotenv").config();
// import Trader from "./trader";

const main = async function () {
  try {
    const options =
      process.env.DEMO === "false"
        ? {
            apiKey: process.env.BYBITID,
            secret: process.env.BYBITSECRET,
          }
        : {
            apiKey: process.env.BYBITIDDEMO,
            secret: process.env.BYBITSECRETDEMO,
          };
    const account = new Bybit(
      {
        ...options,
        enableRateLimit: true,
        rate_limit: 1000,
      },
      !!process.env.DEMO
    );
    await account.init();
    await account.startWebSocket();

    const traderSettings = [
      {
        symbol: "BTC/USD",
        leverage: 100,
        ratio: 4,
        risk: 50,
      },
      {
        symbol: "ETH/USD",
        leverage: 50,
        ratio: 4,
        risk: 50,
      },
      // {
      //   symbol: "EOS/USD",
      //   leverage: 50,
      //   ratio: 4,
      //   risk: 50,
      // },
      // {
      //   symbol: "XRP/USD",
      //   leverage: 50,
      //   ratio: 4,
      //   risk: 50,
      // },
    ];

    for (let setting of traderSettings) {
      const trader = new TraderLeveraged(account, setting);
      trader.start();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.debug("Main failed", error.message);
  }
};

main();
