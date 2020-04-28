import { PositionLeveraged } from "../models";
const EventEmitter = require("events");
export class StrategyBase extends EventEmitter {
  onLongSignal: any;
  onShortSignal: any;
  onStraddleSignal: any;

  constructor() {
    super();
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
