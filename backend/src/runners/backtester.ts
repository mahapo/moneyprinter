import { Runner } from "./runner";
import { Position, PositionLeveraged } from "../models";
import { Faker } from "../exchanges";
import { performance } from "perf_hooks";

import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import * as csv from "csv-parser";
import { MoneyPrinter } from "../strategy";

export class Backtester extends Runner {
  currentCandle: any;
  startBalance: number = 400;
  progress: number = 0;
  ticks: any = [];

  async start(options) {
    await MoneyPrinter.calcSteps(20);
    this.strategy = new MoneyPrinter(this);
    this.progress = 0;

    this.emit("backtestUpdate", {
      percent: this.progress,
      text: "Loading trades",
    });
    this.ticks = await this.getTestTickes(options.file);
    this.emit("backtestUpdate", {
      text: `Test Strategy on ${this.ticks.length} Trades`,
    });
    const t0 = performance.now();
    let count = 0;
    let progressOld = 0;
    for (let tick of this.ticks) {
      await this.onTick(tick);

      progressOld = this.progress;
      this.progress = Math.max(
        Math.round((count++ / this.ticks.length) * 100),
        this.progress
      );
      if (progressOld !== this.progress) {
        // console.log(this.progress);
        this.emit("backtestUpdate", {
          percent: this.progress,
        });
      }
    }
    const t1 = performance.now();
    console.log("Call to ticker took " + (t1 - t0) + " milliseconds.");
    this.emit("backtestUpdate", {
      percent: 100,
      text: `Backtest on ${this.ticks.length} trades successful`,
    });
    this.onFinish();
  }

  async onTick(tick) {
    try {
      await this.strategy.run(tick);
    } catch (error) {
      console.log(error);
    }
  }

  onFinish() {
    this.strategy.printProfit();
    this.emit("backtestFinish", {
      positions: this.strategy.overview,
      countMax: this.strategy.countMax,
      profit: this.strategy.profitTotal,
      startBalance: this.startBalance,
    });
  }

  onSignal({ price, time }) {
    this.strategy.openOrders({
      price,
      time,
      size: this.idealSize,
    });
  }

  get balance() {
    return this.startBalance + this.strategy.profitTotal;
  }

  get idealSize() {
    return (this.balance / 100) * 100;
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

  async loadCSV(filePath): any[] {
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
