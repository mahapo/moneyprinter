import { Runner } from "./runner";
import { OrderBybit, ZoneRecovery } from "../models";
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
    percentOfMaxRange: 80,
  };

  async startMatrix(options, matrix) {
    await this.initTicks(options.file);
    delete options.matrix;
    delete options.strategy;
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
    // this.ticks = this.ticks.slice(0, 20000);
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
      percentOfMaxRange: parseInt(options.percentOfMaxRange),
      risk: parseInt(options.risk),
      file: options.file,
      update: options.update,
      matrix: options.matrix,
    };

    //TODO: Ratio: 6 Leverage: 50 MaxSteps: 4: Check why timeout

    const lastStep = ZoneRecovery.calcStep(
      this.options.maxSteps,
      this.options.ratio
    );

    this.options.risk = Math.round(lastStep.total) * 2;

    this.strategy = new MoneyPrinter(this);
    this.strategy.maxSteps = this.options.maxSteps;
    this.strategy.percentOfMaxRange = this.options.percentOfMaxRange;

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
    this.strategy.currentOrders.forEach((order: OrderBybit) => {
      if (order.status === "open" && order.filled === 0) {
        if (order.checkIfFilled(price)) {
          order.timestampFilled = timestamp;
          this.balances.push({
            timestamp,
            balance: this.balance - order.amount / order.leverage,
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
          order.timestampExit = timestamp;

          this.balances.push({
            timestamp,
            balance: this.balance,
          });

          this.strategy.onOrderDone(order, order.winTrade);
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
      const balances = this.formatedBalances.map((b) => b.balance);
      const drawdowns = this.formatedBalances
        .filter((b) => !!b.drawdown)
        .map((b) => b.drawdown);
      this.emit("backtestFinishMatrix", {
        profit: this.strategy.profitTotal.toFixed(2),
        time: this.time,
        ordersCount: this.strategy.orders.length,
        balanceMin: Math.min(...balances).toFixed(2),
        balanceMax: Math.max(...balances).toFixed(2),
        drawdownMax: Math.min(...drawdowns).toFixed(2),
        options: this.options,
        ...this.strategy.stats,
        ...this.calcOrderStats,
      });
      console.log(
        "Finish " + this.time + " ms.",
        `Ratio: ${this.options.ratio} Leverage: ${this.options.leverage} MaxSteps: ${this.options.maxSteps} Risk: ${this.options.risk} percentOfMaxRange: ${this.options.percentOfMaxRange}`
      );
    } else {
      this.emit("backtestFinish", {
        orders: this.strategy.overview,
        countMax: this.strategy.countMax,
        profit: this.strategy.profitTotal,
        startBalance: this.options.startBalance,
        time: this.time,
        balances: this.formatedBalances,
        ...this.strategy.stats,
        ...this.calcOrderStats,
      });
      console.log("Backtest took " + this.time + " milliseconds.");
    }
  }

  get calcOrderStats() {
    let lossLast;
    let lossSerie = 0;
    let winLast;
    let winSerie = 0;
    return {
      countWin: this.strategy.overview.filter((o) => o.profit > 0).length,
      countLoss: this.strategy.overview.filter((o) => o.profit < 0).length,
      countWinSerieMax: this.strategy.overview
        .filter((o) => o.status === "closed" && o.filled > 0)
        .reduce((acc, o) => {
          const isWin = o.profit > 0;
          if (isWin && winLast) acc = Math.max(acc, ++winSerie);
          else winSerie = 0;
          winLast = isWin;
          return acc;
        }, 0),
      countLossSerieMax: this.strategy.overview
        .filter((o) => o.status === "closed" && o.filled > 0)
        .reduce((acc, o) => {
          const isLoss = o.profit < 0;
          if (isLoss && lossLast) acc = Math.max(acc, ++lossSerie);
          else lossSerie = 0;
          lossLast = isLoss;
          return acc;
        }, 0),
    };
  }

  get formatedBalances() {
    let lastBalance = null;
    let lastChange = null;
    return this.balances
      .filter((balance) => !!balance.timestamp)
      .sort(function (a, b) {
        return a.timestamp - b.timestamp;
      })
      .map((balance, index) => {
        if (!index) {
          lastBalance = balance.balance;
          return balance;
        }
        const change = (1 - balance.balance / lastBalance) * 100;
        lastBalance = balance.balance;
        return { ...balance, change };
      })
      .map((balance, index) => {
        if (index < 2) {
          lastChange = balance.change;
          return balance;
        }
        const drawdown = balance.change + lastChange;
        lastChange = balance.change;
        return { ...balance, drawdown };
      });
  }

  get balance() {
    return this.options.startBalance + this.strategy.profitTotal;
  }

  get idealSize() {
    const maxSize = 10000;
    if (this.balance / this.options.risk > maxSize)
      return Math.round((maxSize / this.options.risk) * this.options.leverage);

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
