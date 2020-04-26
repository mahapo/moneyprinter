import * as randomstring from "randomstring";
import { Runner } from "./runner";

export class TraderLeveraged extends Runner {
  ticker: any;
  currentCandle: any;
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
      this.account.startTicker();
    } catch (error) {
      console.log(error);
    }
  }

  async onTick(tick) {
    try {
      this.strategy.run(tick);
      this.printPositions();
    } catch (error) {
      console.log(error);
    }
  }

  onFinish() {
    // this.printPositions();
    this.printProfit();
    process.exit(0);
  }

  async onStraddleSignal({ price, time }) {
    const id = randomstring.generate(20);
    const positions = this.strategy.staddleOpened({
      price,
      time,
      size: 1000,
      id,
    });
    for (const position of positions) {
      this.account.placeOrder(position);
    }
  }
}
