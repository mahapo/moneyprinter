import * as fs from "fs";
import * as csv from "csv-parser";

import * as phemex from "../../../../ccxt/js/phemex";
import { Candlestick } from "../../models";

export class Phemex {
  instance: any;
  onTick: any;

  constructor(options) {
    this.instance = new phemex(options);
  }

  initTicker({onTick}) {
    this.onTick = onTick
  }

  async startTicker(interval = 1) {
    let ticks = await this.getTestTickes()
    console.log(ticks.length);
    for (let tick of ticks) {
      await new Promise(resolve => setInterval(resolve, 1000))
      this.onTick(tick)
    }
  }

  async getTestTickes() {
    const results = await this.loadCSV("data/BTCUSD_Test_Prints.csv");
    return results.slice(0, 20).map((tick) => {
      const time = new Date(parseFloat(tick.unix))
      // @ts-ignore
      time.setHours(...tick.date.split(':').join('.').split('.'))

      return {
        time,
        price: parseFloat(tick.price),
        volume: parseFloat(tick.amount)
      }
    });
  }

  async loadCSV(file = "data/BTCUSDT_August2019_Binance_prints.csv") {
    // http://www.cryptodatadownload.com/data/northamerican/
    let data = [];
    return new Promise((resolve) => {
      fs.createReadStream(file)
        .pipe(csv())
        .on("data", (d) => data.push(d))
        .on("end", () => resolve(data));
    });
  }
}
