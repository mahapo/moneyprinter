var fs = require("fs");
const csv = require("csv-parser");
import HedgeOrder from "./HedgeOrder";

export default class StrategyTester {
  constructor(Leverage = 100) {
    this.data = [];
    this.steps = [];

    this.Ratio = 2;
    this.Leverage = Leverage;
    this.reset();
  }

  calcSteps(count = 15) {
    let step = {
      betFactor: 1,
      total: 0,
      profit: 0,
      profitTotal: 0,
    };
    return (this.steps = [...Array(count)].map((_, i) => {
      if (i > 0) {
        do {
          step.betFactor += 1;
          step.profit = step.betFactor * (this.Ratio - 1);
          step.profitTotal = step.profit - step.total;
        } while (step.profitTotal < 0);
      } else {
        step.profit = step.betFactor * (this.Ratio - 1);
        step.profitTotal = step.profit - step.total;
      }
      step.total += step.betFactor;
      return { ...step };
    }));
  }

  reset() {
    this.currentIndex = 0;
    this.currentHedgeOrder = null;
    this.balance = 15000;
    this.percentPerTrade = 0.01;
    this.lossCount = 0;
    this.startOrderSize;
    this.badDates = [];
    this.stats = {
      candels: 0,
      trades: 0,
      win: 0,
      loss: 0,
      // winUSD: 0,
      // lossUSD: 0,
      // totalWin: 0,
      balanceMin: 0,
      balanceMax: 0,
      lossCount: 0,
    };
  }

  get orderSize() {
    // return 10000;
    return (this.balance * this.Leverage) / 500;
  }

  runTest(Ratio, Leverage) {
    this.Ratio = Ratio;
    this.Leverage = Leverage;
    this.stats.balanceMin = this.balance;
    for (let index = 0; index < this.data.length; index++) {
      this.checkCandel(index);
      this.stats.candels++;
    }
    this.stats.totalWin = this.stats.winUSD - this.stats.lossUSD;
  }

  checkCandel(index) {
    if (!this.currentHedgeOrder) {
      let orderSize;
      if (this.lossCount === 0) {
        orderSize = this.orderSize;
        this.startOrderSize = this.orderSize;
      } else {
        const factor = this.steps[this.lossCount].betFactor;
        orderSize = this.startOrderSize * factor;
      }

      this.currentHedgeOrder = new HedgeOrder(
        this.data[index]["Open"],
        orderSize,
        this.Ratio,
        this.Leverage
      );
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
      this.lossCount++;
      // this.stats.lossUSD += this.currentHedgeOrder.MaxLoss;
      this.balance -= this.currentHedgeOrder.MaxLoss;
      this.currentHedgeOrder = null;
    } else if (
      this.data[index]["High"] >=
        this.currentHedgeOrder.longOrder.Take_Profit ||
      this.data[index]["Low"] <= this.currentHedgeOrder.shortOrder.Take_Profit
    ) {
      this.stats.win++;
      this.lossCount = 0;
      // this.stats.winUSD += this.currentHedgeOrder.MaxWin;
      this.balance += this.currentHedgeOrder.MaxWin;
      this.currentHedgeOrder = null;
    }

    this.stats.balanceMax = Math.max(this.stats.balanceMax, this.balance);
    this.stats.balanceMin = Math.min(this.stats.balanceMin, this.balance);
    this.stats.lossCount = Math.max(this.stats.lossCount, this.lossCount);
    if (8 < this.lossCount) this.badDates.push(this.data[index]["Date"]);
  }

  async loadDemo(file = "Gdax_BTCUSD_1h.csv") {
    // http://www.cryptodatadownload.com/data/northamerican/
    return new Promise((resolve) => {
      fs.createReadStream(__dirname + "/" + file)
        .pipe(csv())
        .on("data", (data) => {
          try {
            this.data.push(data);
          } catch (err) {
            //error handler
          }
        })
        .on("end", () => {
          this.data = this.data.reverse().map((t) => ({
            ...t,
            Open: parseFloat(t.Open),
            High: parseFloat(t.High),
            Close: parseFloat(t.Close),
            Low: parseFloat(t.Low),
          }));
          resolve(this.data.length);
        });
    });
  }
}
