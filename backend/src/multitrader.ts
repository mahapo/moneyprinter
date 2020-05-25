import { TraderLeveraged } from "./runners";
import { Bybit } from "./exchanges";
import * as accounts from "../data/accounts/demo.json";
require("dotenv").config();
import * as Sentry from "@sentry/node";
Sentry.init({
  dsn:
    "https://4a350580542f46bdb422be3fe3db3901@o395422.ingest.sentry.io/5247177",
});

const main = async function () {
  try {
    const index = parseInt(process.env.INDEX);

    const options = accounts[index].account;

    const account = new Bybit(
      {
        ...options,
        enableRateLimit: true,
        rate_limit: 2000,
      },
      true
    );
    await account.init();
    await account.startWebSocket();

    const traderSettings = accounts[index].symbols.map((symbol) => ({
      symbol,
      ...accounts[index].settings,
    }));

    console.log(traderSettings);

    for (let setting of traderSettings) {
      const trader = new TraderLeveraged(account, setting);
      trader.start();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    throw new Error(error);
  }
};

main();
