import { Backtester } from "./runners";
require("dotenv").config();

const main = async function () {
  try {
    const backtester = new Backtester();
    backtester.start({
      file: "data/trades/BTC/BTCUSDT_September2019_Binance_prints.csv",
      symbol: "BTC/USD",
      leverage: 50,
      ratio: 4.5,
      maxSteps: 4,
      percentOfMaxRange: 40
    });
  } catch (error) {
    console.debug("Main failed", error.message);
  }
};

main();
