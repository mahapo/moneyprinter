import { Factory } from "../strategy";
import * as colors from "colors/safe";

export class Runner {
  account: any;
  startTime: any;
  endTime: any;
  interval: any;
  product: any;
  historical: any;
  strategyType: any;
  strategy: any;

  constructor(account, { start, end, interval, product, strategyType }) {
    this.account = account;
    this.startTime = start;
    this.endTime = end;
    this.interval = interval;
    this.product = product;
    // this.historical = new account.Historical({
    //   start,
    //   end,
    //   interval,
    //   product,
    // });
    this.strategyType = strategyType;
    this.strategy = Factory.create(this.strategyType, {
      onBuySignal: (x) => {
        this.onBuySignal(x);
      },
      onSellSignal: (x) => {
        this.onSellSignal(x);
      },
    });
  }

  printPositions() {
    const positions = this.strategy.getPositions();
    positions.forEach((p) => {
      p.print();
    });
  }

  printProfit() {
    const positions = this.strategy.getPositions();
    const total = positions.reduce((r, p) => {
      return r + p.profit();
    }, 0);

    const prof = `${total}`;
    const colored = total > 0 ? colors.green(prof) : colors.red(prof);
    console.log(`Total: ${colored}`);
  }

  async start() {}
  async onBuySignal(data) {}
  async onSellSignal(data) {}
}
