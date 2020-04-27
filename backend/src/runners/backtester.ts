import * as randomstring from "randomstring";
import { Runner } from "./runner";
import { Position, HedgeManager } from "../models";

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
      console.log(HedgeManager.calcSteps());

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
    Position.printPositions();
    Position.printProfit();
    console.log(HedgeManager.maxStep);
    process.exit(0);
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
