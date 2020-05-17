import { TraderLeveraged } from "./runners";
import { Bybit } from "./exchanges";
require("dotenv").config();

const main = async function () {
  try {
    const isDemo = process.env.SANDBOX == "true";

    const options = isDemo
      ? {
          apiKey: process.env.BYBIT_ID_DEMO,
          secret: process.env.BYBIT_SECRET_DEMO,
        }
      : {
          apiKey: process.env.BYBIT_ID,
          secret: process.env.BYBIT_SECRET,
        };
    console.log(options, isDemo);

    const account = new Bybit(
      {
        ...options,
        enableRateLimit: true,
        rate_limit: 1000,
      },
      isDemo
    );
    await account.init();
    await account.startWebSocket();

    const traderSettings = [
      {
        symbol: "BTC/USD",
        leverage: 100,
        ratio: 4,
        risk: 40,
      },
      {
        symbol: "ETH/USD",
        leverage: 50,
        ratio: 4,
        risk: 80,
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
