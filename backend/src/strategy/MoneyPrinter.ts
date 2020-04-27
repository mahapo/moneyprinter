import { StrategyBase } from "./StrategyBase";
import { PositionLeveraged, OrderLeveraged, HedgeManager } from "../models";
export class MoneyPrinter extends StrategyBase {
  currentHedge: any;

  async run({ price, time }) {
    if (
      [...PositionLeveraged.activePositions, ...PositionLeveraged.openPositions]
        .length == 0
    ) {
      // console.log(`================`);
      // console.log(`Time: ${time.toLocaleString()}  Price: ${price.toFixed(2)}`);
      this.onStraddleSignal({ price, time });
    } else {
      // console.log(`Price: ${price.toFixed(2)}`);
      PositionLeveraged.updatePositions({ price, time });
      if (this.currentHedge) this.currentHedge.onTick({ price, time });
    }
    return;
  }

  staddleOpened({ price, time, size, id, leverage, onDone }) {
    this.currentHedge = new HedgeManager({
      price,
      time,
      size,
      leverage,
    });

    return this.currentHedge.createPositions();
  }

  onHedgeDone() {
    this.currentHedge = "";
  }

  onPositionDone() {
    // this.openPositions.forEach((p) => (p.state = "closed"));
  }
}
