import * as program from "commander";
import { Backtester, TraderLeveraged } from "./runners";
import { Phemex } from "./exchanges";
// import Trader from "./trader";

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1e3);

function toDate(val) {
  return new Date(val * 1e3);
}

let urls = {
  api: {
    public: "https://testnet.phemex.com/api",
    public2: "https://testnet-api.phemex.com",
    private: "https://testnet-api.phemex.com",
  },
};
let config = {
  apiKey: process.env.ID1,
  secret: process.env.SECRET1,
  urls,
};

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
  const {
    interval,
    product,
    start,
    end,
    strategy,
    live,
    type,
    funds,
  } = program;
  const account = new Phemex(config);
  if (type == "trader") {
    const trader = new TraderLeveraged(account, {
      start,
      end,
      product,
      interval,
      strategyType: strategy,
      // live,
      // funds,
    });
    await trader.start();
  } else {
    const tester = new Backtester(account, {
      start,
      end,
      product,
      interval,
      strategyType: strategy,
    });

    await tester.start();
  }
};

main();
