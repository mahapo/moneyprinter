import { Runner } from "./runner";
import { performance } from "perf_hooks";

import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import * as csv from "csv-parser";
import { MoneyPrinter } from "../strategy";

export class Backtester extends Runner {
  balances = [];

  percent: number = 0;
  time: number = 0;
  ticks: any = [];

  currentfile: string = "";

  options = {
    ratio: 2,
    leverage: 100,
    startBalance: 100,
    risk: 100,
    maxSteps: 10,
    file: "",
    update: false,
    matrix: false,
  };

  async startMatrix(options) {
    function createTestMatrix(matrix) {
      function getCombn(arr) {
        if (arr.length == 1) {
          return arr[0];
        } else {
          var ans = [];
          var otherCases = getCombn(arr.slice(1));
          for (var i = 0; i < otherCases.length; i++) {
            for (var j = 0; j < arr[0].length; j++) {
              ans.push([arr[0][j], otherCases[i]]);
            }
          }
          return ans;
        }
      }
      const values = getCombn(matrix.map((i) => i.steps)).map((i) =>
        // @ts-ignore
        Array.isArray(i) ? i.flat() : i
      );
      const keys = matrix.map((i) => i.key);
      return values.map((value) =>
        keys.reduce((acc, key, i) => {
          acc[key] = value[i];
          return acc;
        }, {})
      );
    }
    await this.initTicks(options.file);

    const matrix = createTestMatrix(options.matrix);
    delete options.matrix;
    delete options.strategy;
    console.table(options);

    console.log("Starting matrix", matrix.length);

    for (const option of matrix) {
      try {
        this.run({
          ...options,
          ...option,
          update: false,
          matrix: true,
        });
      } catch (error) {
        console.log(error);
      }
    }
    console.log("Stop matrix test");
  }

  async initTicks(path) {
    if (this.currentfile !== path) this.ticks = await this.getTestTickes(path);
    this.currentfile = path;
  }

  async start(options) {
    await this.initTicks(options.file);
    this.run(options);
  }

  run(options) {
    this.options = {
      ratio: parseFloat(options.ratio),
      leverage: parseFloat(options.leverage),
      startBalance: parseFloat(options.startBalance),
      maxSteps: parseInt(options.maxSteps),
      risk: parseInt(options.risk),
      file: options.file,
      update: options.update,
      matrix: options.matrix,
    };

    this.strategy = new MoneyPrinter(this);
    this.strategy.maxSteps = this.options.maxSteps;

    this.balances = [];

    if (this.options.update) {
      // this.emit("ticks", this.ticks);
      this.emit("backtestUpdate", {
        percent: 0,
        text: "Loading trades",
      });
      this.emit("backtestUpdate", {
        text: `Test Strategy on ${this.ticks.length} Trades`,
      });
    }

    const t0 = performance.now();
    this.percent = 0;
    let percentOld = 0;
    this.ticks.forEach((tick, index) => {
      if (index === 0)
        this.balances.push({
          time: tick.time,
          balance: this.options.startBalance,
        });

      this.onTick(tick);

      if (this.options.update) {
        percentOld = this.percent;
        this.percent = Math.max(
          Math.round((index / this.ticks.length) * 100),
          this.percent
        );
        if (percentOld !== this.percent) {
          // console.log(this.percent);
          this.emit("backtestUpdate", {
            percent: this.percent,
          });
        }
      }
    });
    this.time = performance.now() - t0;

    if (this.options.update) {
      this.emit("backtestUpdate", {
        percent: 100,
        text: `Backtest on ${this.ticks.length} trades successful`,
      });
    }
    this.onFinish();
  }

  onTick(tick) {
    try {
      this.updatePositions(tick);
      this.strategy.run(tick);
    } catch (error) {
      console.log(error);
    }
  }

  updatePositions({ price, time }) {
    this.strategy.currentPositions.forEach((position) => {
      switch (position.status) {
        case "open":
          if (
            (position.order.side === "buy" && position.order.price <= price) ||
            (position.order.side === "sell" && position.order.price >= price)
          ) {
            position.status = "filled";

            const currencyBalance =
              this.balance - position.order.size / position.order.leverage;

            this.balances.push({
              time,
              balance: currencyBalance,
            });
            this.strategy.onPositionFilled(position);
          }
          break;
        case "filled":
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
              time,
              balance: this.balance, // TODO: Fix Profit
            });
            this.strategy.onPositionDone(position, position.profit() > 0);
          }
          break;
      }
    });
  }

  onSignal({ price, time }) {
    this.strategy.openOrders({
      price,
      time,
      size: this.idealSize,
      leverage: this.options.leverage,
      ratio: this.options.ratio, // TODO: allow ratio < 2
    });
  }

  onFinish() {
    this.strategy.positions.push(...this.strategy.currentPositions);
    // this.strategy.printPositions();

    if (this.options.matrix) {
      const balances = this.balances.map((b) => b.balance);
      this.emit("backtestFinishMatrix", {
        profit: this.strategy.profitTotal,
        time: this.time,
        positionsCount: this.strategy.positions.length,
        balanceMin: Math.min(...balances),
        balanceMax: Math.max(...balances),
        options: this.options,
        ...this.strategy.stats,
      });
      console.log("Backtest took " + this.time + " milliseconds.");
    } else {
      this.emit("backtestFinish", {
        positions: this.strategy.overview,
        countMax: this.strategy.countMax,
        profit: this.strategy.profitTotal,
        startBalance: this.options.startBalance,
        time: this.time,
        balances: this.balances,
      });
    }
  }

  get balance() {
    return this.options.startBalance + this.strategy.profitTotal;
  }

  get idealSize() {
    return Math.round((this.balance / this.options.risk) * this.options.leverage);
  }

  async getTestTickes(filePath) {
    const results = await this.loadCSV(filePath);

    // @ts-ignore
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
      glob("./data/**/*.csv", {}, (er, files) => {
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
