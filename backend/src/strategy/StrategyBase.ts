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

  getPositions() {
    return PositionLeveraged.positions;
  }

  updatePositions({ price, time }) {
    [...this.activePositions, ...this.openPositions].forEach((p) =>
      p.onTick({ price, time })
    );
  }

  get openPositions() {
    return this.getPositions().filter((p) => p.state === "order");
  }

  get activePositions() {
    return this.getPositions().filter((p) => p.state === "active");
  }

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
