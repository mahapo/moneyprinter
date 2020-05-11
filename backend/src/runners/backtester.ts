import { Runner } from "./runner";
import { performance } from "perf_hooks";

import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import * as csv from "csv-parser";
import { MoneyPrinter } from "../strategy";

export class Backtester extends Runner {
  balances = [];
  currentBalance: number = 0;
  percent: number = 0;
  time: number = 0;
  ticks: any = [];

  currentfile: string = "";

  options = {
    ratio: 2,
    leverage: 100,
    startBalance: 100,
    file: "",
    update: false,
  };

  async start(options) {
    this.options = {
      ratio: parseFloat(options.ratio),
      leverage: parseFloat(options.leverage),
      startBalance: parseFloat(options.startBalance),
      file: options.file,
      update: options.update,
    };

    this.strategy = new MoneyPrinter(this);
    this.percent = 0;
    this.currentBalance = this.options.startBalance;

    this.balances = [];
    // this.balances.push(this.currentBalance);
    let count = 0;
    let percentOld = 0;
    if (this.currentfile !== options.file)
      this.ticks = await this.getTestTickes(this.options.file);
    this.currentfile = options.file;

    this.emit("backtestUpdate", {
      percent: this.percent,
      text: "Loading trades",
    });
    this.emit("backtestUpdate", {
      text: `Test Strategy on ${this.ticks.length} Trades`,
    });

    const t0 = performance.now();
    for (let tick of this.ticks) {
      this.onTick(tick);

      if (this.options.update) {
        percentOld = this.percent;
        this.percent = Math.max(
          Math.round((count++ / this.ticks.length) * 100),
          this.percent
        );
        if (percentOld !== this.percent) {
          // console.log(this.percent);
          this.emit("backtestUpdate", {
            percent: this.percent,
          });
        }
      }
    }
    this.time = performance.now() - t0;
    console.log("Backtest took " + this.time + " milliseconds.");

    this.emit("backtestUpdate", {
      percent: 100,
      text: `Backtest on ${this.ticks.length} trades successful`,
    });
    this.onFinish();
  }

  async onTick(tick) {
    try {
      this.updatePositions(tick);
      this.strategy.run(tick);
    } catch (error) {
      console.log(error);
    }
  }

  updatePositions({ price, time }) {
    this.strategy.currentPositions.forEach((position) => {
      if (position.status === "open") {
        if (
          (position.order.side === "buy" && position.order.price <= price) ||
          (position.order.side === "sell" && position.order.price >= price)
        ) {
          position.status = "filled";
          this.strategy.onPositionFilled(position);
        }
      }
      if (position.status === "filled") {
        if (
          (position.order.side === "buy" &&
            (position.order.takeProfit <= price ||
              position.order.stopLoss >= price)) ||
          (position.order.side === "sell" &&
            (position.order.takeProfit >= price ||
              position.order.stopLoss <= price))
        ) {
          position.status = "done";
          position.exit = price;

          this.balances.push({
            time: position.order.time,
            balance:
              this.currentBalance -
              position.order.size / position.order.leverage,
          });
          this.currentBalance += position.profit(); // TODO: Fix Profit
          this.balances.push({
            time,
            balance: this.currentBalance,
          });

          this.strategy.onPositionDone(position, position.profit() > 0);
        }
      }
    });
  }

  onFinish() {
    this.strategy.positions.push(...this.strategy.currentPositions);
    // this.strategy.printPositions();
    this.strategy.printProfit();

    // console.log(this.strategy.stats, this.strategy.positions.length);
    console.log(Math.min(...this.balances), Math.max(...this.balances));

    this.emit("backtestFinish", {
      positions: this.strategy.overview,
      countMax: this.strategy.countMax,
      profit: this.strategy.profitTotal,
      startBalance: this.options.startBalance,
      time: this.time,
      balances: this.balances,
    });
  }

  onSignal({ price, time }) {
    this.strategy.openOrders({
      price,
      time,
      size: this.idealSize,
      ratio: this.options.ratio,
      leverage: this.options.leverage,
    });
  }

  // get balance() {
  //   return this.startBalance + this.strategy.profitTotal;
  // }

  get idealSize() {
    return Math.round((this.currentBalance / 500) * 100);
  }

  async getTestTickes(filePath) {
    const results = await this.loadCSV(filePath);

    return results.map((tick) => {
      let time;
      if (tick.unix.includes("+")) {
        time = new Date(parseFloat(tick.unix));
        // @ts-ignore
        time.setHours(...tick.date.split(":").join(".").split("."));
      } else {
        time = new Date(parseInt(tick.unix));
      }

      return {
        time,
        price: parseFloat(tick.price),
        volume: parseFloat(tick.amount),
      };
    });
  }

  async loadCSV(filePath) {
    let data = [];
    return new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (d) => data.push(d))
        .on("end", () => resolve(data));
    });
  }

  getFiles() {
    return new Promise((resolve) =>
      glob("./data/*.csv", {}, (er, files) => {
        resolve(
          files.map((file) => ({
            text: path.parse(file).name,
            value: file,
          }))
        );
      })
    );
  }
}
