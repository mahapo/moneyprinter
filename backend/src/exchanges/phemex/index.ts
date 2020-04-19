import * as phemex from "../../../../ccxt/js/phemex";
import * as Candlestick from "../../models/candlestick";
import * as fs from "fs";
import * as csv from "csv-parser";

export class Phemex {
  instance: any;

  constructor(options) {
    this.instance = new phemex(options);
  }

  async getData() {
    // const intervals = this.createRequests();
    const results = await this.loadCSV();
    const timestamps = {};

    // const filtered = results.filter((x, i) => {
    //   const timestamp = x[0];
    //   const str = `${timestamp}`;
    //   if (timestamps[str] !== undefined) {
    //     return false;
    //   }
    //   timestamps[str] = true;
    //   return true;
    // });

    // console.log(filtered);

    const candlesticks = results.map((x) => {
      return new Candlestick({
        startTime: new Date(x["Date"]),
        low: x["Low"],
        high: x["High"],
        open: x["Open"],
        close: x["Close"],
        // interval: this.interval,
        volume: x["Volume"],
      });
    });

    return candlesticks.slice(0, 30);
  }

  async loadCSV(file = "data/gemini_BTCUSD_2019_1min.csv") {
    // http://www.cryptodatadownload.com/data/northamerican/
    let data = [];
    return new Promise((resolve) => {
      fs.createReadStream(__dirname + "/" + file)
        .pipe(csv())
        .on("data", (d) => data.push(d))
        .on("end", () => resolve(data));
    });
  }
}
