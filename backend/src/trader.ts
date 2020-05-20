import { TraderLeveraged } from "./runners";
import { Bybit } from "./exchanges";
require("dotenv").config();
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: 'https://4a350580542f46bdb422be3fe3db3901@o395422.ingest.sentry.io/5247177' });

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

    const account = new Bybit(
      {
        ...options,
        enableRateLimit: true,
        rate_limit: 2000,
      },
      isDemo
    );
    await account.init();
    await account.startWebSocket();

    const traderSettings = isDemo ? [
      {
        symbol: "BTC/USD",
        leverage: 75,
        ratio: 5,
        maxSteps: 4,
        percentOfMaxRange: 40
      },
      {
        symbol: "ETH/USD",
        leverage: 50,
        ratio: 4.5,
        maxSteps: 4,
        percentOfMaxRange: 40
      },
      {
        symbol: "EOS/USD",
        leverage: 50,
        ratio: 4.5,
        maxSteps: 4,
        percentOfMaxRange: 40
      },
      {
        symbol: "XRP/USD",
        leverage: 50,
        ratio: 4.5,
        maxSteps: 4,
        percentOfMaxRange: 40
      },
    ] : [
      {
        symbol: "BTC/USD",
        leverage: 75,
        ratio: 5,
        maxSteps: 4,
        percentOfMaxRange: 40
      }
    ]

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
