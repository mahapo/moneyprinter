import { PositionLeveraged, TradeLeveraged } from "../models";
export class StrategyBase {
  onLongSignal: any;
  onShortSignal: any;
  positions: any;
  onStraddleSignal: any;

  constructor({ onLongSignal, onShortSignal, onStraddleSignal }) {
    this.onLongSignal = onLongSignal;
    this.onShortSignal = onShortSignal;
    this.onStraddleSignal = onStraddleSignal;
    this.positions = {};
  }

  async run({ sticks = [], time, price }) {}

  getPositions() {
    return Object.keys({ ...this.positions }).map((k) => this.positions[k]);
  }

  openPositions() {
    return this.getPositions().filter((p) => p.state === "open");
  }

  async positionOpened({ price, time, size, id, leverage }) {
    const trade = new TradeLeveraged({ price, time, size, leverage });
    const position = new PositionLeveraged({ trade, id });
    this.positions[id] = position;
  }

  async positionClosed({ price, time, size, id, leverage }) {
    const trade = new TradeLeveraged({ price, time, size, leverage });
    const position = this.positions[id];

    if (position) {
      position.close({ trade });
    }
  }
}
