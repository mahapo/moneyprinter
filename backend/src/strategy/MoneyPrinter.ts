import { StrategyBase } from "./StrategyBase";

export class MoneyPrinter extends StrategyBase {
  async run({ price, time }) {
    console.log(`Time: ${time.toLocaleString()}  Price: ${price.toFixed(2)}`)
    const open = this.openPositions();
    
    if (open.length == 0) {
      this.onStraddleSignal({ price, time });
    }
  }
}
