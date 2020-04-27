import * as randomstring from "randomstring";
import { Runner } from "./runner";
import { Position, HedgeManager, PositionLeveraged } from "../models";

export class Backtester extends Runner {
  ticker: any;
  currentCandle: any;
  startBalance: number = 15000;

  constructor(account, options) {
    super(account, options);

    this.ticker = this.account.initTicker({
      onTick: this.onTick.bind(this),
      onFinish: this.onFinish.bind(this),
      // product: this.product,
      // onError: (error) => { this.onError(error) }
    });
  }

  async start() {
    try {
      HedgeManager.calcSteps();
      Position.positions = []
      this.account.startDemoTicker();
    } catch (error) {
      console.log(error);
    }
  }

  async onTick(tick) {
    try {
      this.strategy.run(tick);
      // Position.printPositions();
    } catch (error) {
      console.log(error);
    }
  }

  onFinish() {
    // Position.printPositions();
    Position.printProfit();
    this.emit("finish", {
      positions: PositionLeveraged.overview(),
      maxSteps: HedgeManager.maxStep,
      profit: Position.profitTotal,
      startBalance: this.startBalance,
    });
  }

  async onStraddleSignal({ price, time }) {
    const id = randomstring.generate(20);
    // console.log(this.balance);

    this.strategy.staddleOpened({
      price,
      time,
      size: this.idealSize,
      id,
    });
  }

  get balance() {
    return this.startBalance + Position.profitTotal;
  }

  get idealSize() {
    return (this.balance / 100) * 100;
  }
}
