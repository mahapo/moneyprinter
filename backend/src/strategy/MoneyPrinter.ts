import { StrategyBase } from "./StrategyBase";
import { PositionLeveraged, TradeLeveraged, HedgeManager } from "../models";
export class MoneyPrinter extends StrategyBase {
  currentHedge: any;

  async run({ price, time }) {
    if ([...this.activePositions, ...this.openPositions].length == 0) {
      console.log(`================`);
      console.log(`Time: ${time.toLocaleString()}  Price: ${price.toFixed(2)}`);
      this.onStraddleSignal({ price, time });
    } else {
      console.log(`Price: ${price.toFixed(2)}`);
      this.updatePositions({ price, time });
    }
    return;
  }

  async staddleOpened({ price, time, size, id, leverage, onDone }) {
    this.currentHedge = new HedgeManager({
      price,
      time,
      size,
      leverage,
    });
    const [long, short] = this.currentHedge.createTrades();
    console.log(this.currentHedge.id);

    this.positions[`${this.currentHedge.id}-long`] = new PositionLeveraged({
      trade: long,
      id,
    });
    this.positions[`${this.currentHedge.id}-short`] = new PositionLeveraged({
      trade: short,
      id,
    });
  }

  onHedgeDone() {
    this.currentHedge = "";
  }

  onPositionDone() {
    // this.openPositions.forEach((p) => (p.state = "closed"));
  }
}
