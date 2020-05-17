import { Runner } from "./runner";
import { OrderLeveraged } from "../models";
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

  async startMatrix(options, matrix) {
    await this.initTicks(options.file);
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
          timestamp: tick.timestamp,
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
      this.updateOrders(tick);
      this.strategy.run(tick);
    } catch (error) {
      console.log(error);
    }
  }

  updateOrders({ price, timestamp }) {
    this.strategy.currentOrders.forEach((order: OrderLeveraged) => {
      if (order.status === "open" && order.filled === 0) {
        if (order.checkIfFilled(price)) {
          order.filled = order.amount;
          const currencyBalance = this.balance - order.amount / order.leverage;

          this.balances.push({
            timestamp,
            balance: currencyBalance,
          });
          this.strategy.onOrderFilled(order, price);
        }
      } else if (order.status === "open" && order.filled > 0) {
        if (
          order.checkIfTriggersTakeProfit(price) ||
          order.checkIfTriggersStopLoss(price)
        ) {
          order.status = "closed";
          order.priceExit = price;

          this.balances.push({
            timestamp,
            balance: this.balance, // TODO: Fix Profit
          });

          this.strategy.onOrderDone(order, order.profit > 0);
        }
      }
    });
  }

  onSignal({ price, timestamp }) {
    this.strategy.onSignal({
      price,
      timestamp,
      amount: this.idealSize,
      leverage: this.options.leverage,
      ratio: this.options.ratio, // TODO: allow ratio < 2
    });
  }

  onFinish() {
    this.strategy.orders.push(...this.strategy.currentOrders);
    if (this.options.matrix) {
      const balances = this.balances.map((b) => b.balance);
      this.emit("backtestFinishMatrix", {
        profit: this.strategy.profitTotal,
        time: this.time,
        ordersCount: this.strategy.orders.length,
        balanceMin: Math.min(...balances),
        balanceMax: Math.max(...balances),
        options: this.options,
        ...this.strategy.stats,
      });
      console.log("Backtest took " + this.time + " milliseconds.");
    } else {
      this.emit("backtestFinish", {
        orders: this.strategy.overview,
        countMax: this.strategy.countMax,
        profit: this.strategy.profitTotal,
        startBalance: this.options.startBalance,
        time: this.time,
        balances: this.balances,
      });
      console.log("Backtest took " + this.time + " milliseconds.");
    }
  }

  get balance() {
    return this.options.startBalance + this.strategy.profitTotal;
  }

  get idealSize() {
    return Math.round(
      (this.balance / this.options.risk) * this.options.leverage
    );
  }

  async getTestTickes(filePath) {
    const results = await this.loadCSV(filePath);

    // @ts-ignore
    return results.map((tick) => {
      let timestamp;
      timestamp = tick.unix;
      if (tick.unix.includes("+")) {
        timestamp = new Date(parseFloat(tick.unix));
        timestamp = timestamp.setHours(
          // @ts-ignore
          ...tick.date.split(":").join(".").split(".")
        );
        timestamp = timestamp.getTime();
      }

      return {
        timestamp: parseInt(timestamp),
        price: parseFloat(tick.price),
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
