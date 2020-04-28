import * as randomstring from "randomstring";
import { Runner } from "./runner";
import { Position, PositionLeveraged } from "../models";

export class Backtester extends Runner {
  ticker: any;
  currentCandle: any;
  startBalance: number = 15000;

  constructor(account, options) {
    super(account, options);
    this.account.on("tick", this.onTick.bind(this));
    this.account.on("finish", this.onFinish.bind(this));
    this.strategy.on("signal", this.onSignal.bind(this));
  }

  async start() {
    try {
      Position.positions = new Map();
      this.account.startDemoTicker();
    } catch (error) {
      console.log(error);
    }
  }

  async onTick(tick) {
    try {
      this.strategy.run(tick);
      Position.printPositions();
    } catch (error) {
      console.log(error);
    }
  }

  onFinish() {
    // Position.printPositions();
    Position.printProfit();
    this.emit("finish", {
      positions: PositionLeveraged.overview(),
      // maxSteps: HedgeManager.maxStep,
      profit: Position.profitTotal,
      startBalance: this.startBalance,
    });
  }

  async onSignal({ price, time }) {
    this.strategy.openOrders({
      price,
      time,
      size: this.idealSize,
    });
  }

  get balance() {
    return this.startBalance + Position.profitTotal;
  }

  get idealSize() {
    return (this.balance / 100) * 100;
  }
}
