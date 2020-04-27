import { PositionLeveraged } from "../models";
export class StrategyBase {
  onLongSignal: any;
  onShortSignal: any;
  onStraddleSignal: any;

  constructor({ onLongSignal, onShortSignal, onStraddleSignal }) {
    this.onLongSignal = onLongSignal;
    this.onShortSignal = onShortSignal;
    this.onStraddleSignal = onStraddleSignal;
  }

  async run({ sticks = [], time, price }) {}

  // async positionOpened({ price, time, size, id, leverage }) {
  //   const order = new OrderLeveraged({ price, time, size, leverage });
  //   const position = new PositionLeveraged({ order, id });
  //   this.positions[id] = position;
  // }

  // async positionClosed({ price, time, size, id, leverage }) {
  //   const order = new OrderLeveraged({ price, time, size, leverage });
  //   const position = this.positions[id];

  //   if (position) {
  //     position.close({ order });
  //   }
  // }
}
