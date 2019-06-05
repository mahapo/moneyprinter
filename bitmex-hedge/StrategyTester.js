var fs = require("fs");
const csv = require("csv-parser");
import HedgeOrder from "./HedgeOrder";

export default class StrategyTester {
  constructor() {
    this.data = [];
    this.currentIndex = 0;
    this.currentHedgeOrder = null;
    this.stats = {
      trades: 0,
      win: 0,
      loss: 0
    };
  }

  runTest() {
    for (let index = 0; index < this.data.length; index++) {
      this.checkCandel(index);
    }
  }

  checkCandel(index) {
    if (!this.currentHedgeOrder) {
      this.currentHedgeOrder = new HedgeOrder(this.data[index]["Open"]);
      this.stats.trades++;
    }
    if (this.data[index]["High"] >= this.currentHedgeOrder.shortOrder.Stop_Loss)
      this.currentHedgeOrder.shortOrder.StopLossTouched = true;
    if (this.data[index]["Low"] <= this.currentHedgeOrder.longOrder.Stop_Loss)
      this.currentHedgeOrder.longOrder.StopLossTouched = true;

    if (
      this.currentHedgeOrder.shortOrder.StopLossTouched &&
      this.currentHedgeOrder.longOrder.StopLossTouched
    ) {
      this.stats.loss++;
      this.currentHedgeOrder = null;
    } else if (
      this.data[index]["High"] >=
        this.currentHedgeOrder.longOrder.Take_Profit ||
      this.data[index]["Low"] <= this.currentHedgeOrder.shortOrder.Take_Profit
    ) {
      this.stats.win++;
      this.currentHedgeOrder = null;
    }
  }

  async loadDemo() {
    // http://www.cryptodatadownload.com/data/northamerican/
    return new Promise(resolve => {
      fs.createReadStream(__dirname + "/../data/Gdax_BTCUSD_1h.csv")
        .pipe(csv())
        .on("data", data => {
          try {
            this.data.push(data);
          } catch (err) {
            //error handler
          }
        })
        .on("end", () => {
          this.data = this.data.reverse().map(t => ({
            ...t,
            Open: parseFloat(t.Open),
            High: parseFloat(t.High),
            Close: parseFloat(t.Close),
            Low: parseFloat(t.Low)
          }));
          resolve(this.data.length);
        });
    });
  }
}
