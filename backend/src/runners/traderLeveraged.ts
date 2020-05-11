import { Runner } from "./runner";
import { Position } from "../models";
import { MoneyPrinter } from "../strategy";

import * as colors from "colors/safe";

export class TraderLeveraged extends Runner {
  ticker: any;
  currentCandle: any;

  options = {
    ratio: 2,
    leverage: 100,
    update: false,
    symbol: "",
  };

  constructor(public account, options) {
    super(options);
  }

  async start(options) {
    this.options = {
      ratio: parseFloat(options.ratio),
      leverage: parseFloat(options.leverage),
      update: options.update,
      symbol: options.symbol,
    };
    this.strategy = new MoneyPrinter(this);
    await this.account.reset(options.symbol);
    this.onTick();
    this.account.on("TakeProfit", (position) => this.onTakeProfit(position));
    this.account.on("StopLoss", (position) => this.onStopLoss(position));
    this.account.on("Filled", (position) => this.onFilled(position));
  }

  async onTick() {
    try {
      this.strategy.run({
        price: await this.account.getCurrentPrice(this.options.symbol),
        time: this.account.instance.now(),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async onSignal({ time }) {
    try {
      const price = await this.account.getCurrentPrice(this.options.symbol);
      const params = {
        price,
        time,
        size: 1000,
        leverage: this.options.leverage,
        symbol: this.options.symbol,
        ratio: this.options.ratio,
      };
      this.strategy.openOrders(params);
      await this.updatePositions();
      console.signal(params);
    } catch (error) {
      console.log("Try again");
      await this.account.reset(this.options.symbol);
      this.onTick();
    }
  }

  async onTakeProfit(order) {
    try {
      const position = this.strategy.searchPosition(order);
      console.log(colors.green("onTakeProfit"), position?.order.toString());
      await this.strategy.onPositionDone(position, true);
      this.account.lastTime = 0;
      await this.account.reset(this.options.symbol);
      this.onTick();
    } catch (error) {
      console.log(error);
    }
  }

  async onStopLoss(order) {
    try {
      const position = this.strategy.searchPosition(order);
      console.log(colors.red("onStopLoss"), position?.order.toString());
      await this.strategy.onPositionDone(position, false);
    } catch (error) {
      console.log(error);
    }
  }

  async onFilled(order) {
    try {
      const position = this.strategy.searchPosition(order);
      console.log(colors.blue("onFilled"), position?.order.toString());
      if (position) {
        this.strategy.onPositionFilled(position);
        this.updatePositions();
      }
    } catch (error) {
      console.log(error);
    }
  }

  async updatePositions() {
    for (const position of this.strategy.currentPositions) {
      if (position.status === "closed" && position.idExchange) {
        await this.account.cancelPosition(position);
      } else if (position.status === "open") {
        await this.account.placeMarketStopOrder(position);
      } else if (position.status === "filled" && !position.stopLossSet) {
        position.stopLossSet = await this.account.setTpSLTs(position);
      }
    }
  }

  onFinish() {
    this.strategy.printProfit();
    process.exit(0);
  }
}
