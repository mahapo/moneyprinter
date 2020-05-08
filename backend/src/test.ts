import * as program from "commander";
import { Backtester } from "./runners";
require("dotenv").config();

program.version("1.0.0").option("-l, --file", "Run live").parse(process.argv);

const symbols = [
  {
    symbol: "BTCUSDT",
    maxLeverage: 100,
  },
  {
    symbol: "ETHUSDT",
    maxLeverage: 50,
  },
  {
    symbol: "LINKUSDT",
    maxLeverage: 50,
  },
];

const main = async function () {
  try {
    const backtester = new Backtester();
    backtester.start({
      ratio: 2,
      leverage: 50,
      file: "data/XRPUSDT_August2019_Binance_prints.csv",
      startBalance: 400,
    });
  } catch (error) {
    console.debug("Main failed", error.message);
  }
};

main();
