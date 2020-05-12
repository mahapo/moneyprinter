import { TraderLeveraged } from "./runners";
import { Bybit } from "./exchanges";
require("dotenv").config();
// import Trader from "./trader";

const main = async function () {
  try {
    const account = new Bybit(
      {
        apiKey: process.env.BYBITID,
        secret: process.env.BYBITSECRET,
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
        leverage: 50,
        ratio: 2,
      },
      {
        symbol: "ETH/USD",
        leverage: 50,
        ratio: 2,
      },
      {
        symbol: "EOS/USD",
        leverage: 50,
        ratio: 2,
      },
      {
        symbol: "XRP/USD",
        leverage: 50,
        ratio: 2,
      },
    ];

    for (let setting of traderSettings) {
      const trader = new TraderLeveraged(account, setting);
      trader.start();
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
  } catch (error) {
    console.debug("Main failed", error.message);
  }
};

main();
