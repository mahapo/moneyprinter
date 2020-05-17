import { Backtester } from "./runners";
require("dotenv").config();

const main = async function () {
  try {
    const backtester = new Backtester();
    backtester.start({
      ratio: 2,
      leverage: 100,
      risk: 100,
      file: "data/TRXUSDT_August2019_Binance_prints.csv",
      startBalance: 400,
      symbol: "BTC/USD",
    });
  } catch (error) {
    console.debug("Main failed", error.message);
  }
};

main();
