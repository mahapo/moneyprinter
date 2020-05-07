import * as program from "commander";
import { TraderLeveraged } from "./runners";
import { Bybit } from "./exchanges";
require("dotenv").config();
// import Trader from "./trader";

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1e3);

function toDate(val) {
  return new Date(val * 1e3);
}

program
  .version("1.0.0")
  .option(
    "-i, --interval [interval]",
    "Interval in seconds for candlestick",
    parseInt
  )
  .option("-p, --product [product]", "Product identifier", "BTC-USD")
  .option(
    "-s, --start [start]",
    "Start time in unix seconds",
    toDate,
    yesterday
  )

  .option("-e, --end [end]", "End time in unix seconds", toDate, now)
  .option("-t, --strategy [strategy]", "Strategy Type")
  .option("-r, --type [type]", "Run type")
  .option("-f, --funds [funds]", "Amount of money to use", parseInt)
  .option("-l, --live", "Run live")
  .parse(process.argv);

const main = async function () {
  try {
    const account = new Bybit(
      {
        apiKey: process.env.BYBITID,
        secret: process.env.BYBITSECRET,
        enableRateLimit: true,
        rate_limit: 1000,
        // verbose: true,
      },
      true
    );

    const trader = new TraderLeveraged(account, {});
    await account.init();
    await account.reset("BTC/USD");
    await account.startWebSocket();
    trader.start({
      symbol: "BTC/USD",
      leverage: 100,
      ratio: 3,
    });
  } catch (error) {
    console.debug("Main failed", error.message);
  }
};

main();
