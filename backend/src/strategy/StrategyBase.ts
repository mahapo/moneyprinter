import { Position, Trade } from "../models";
export class StrategyBase {
  onBuySignal: any;
  onSellSignal: any;
  positions: any;

  constructor({ onBuySignal, onSellSignal }) {
    this.onBuySignal = onBuySignal;
    this.onSellSignal = onSellSignal;
    this.positions = {};
  }

  async run({ sticks, time }) {}

  getPositions() {
    return Object.keys({ ...this.positions }).map((k) => this.positions[k]);
  }

  openPositions() {
    return this.getPositions().filter((p) => p.state === "open");
  }

  async positionOpened({ price, time, size, id }) {
    const trade = new Trade({ price, time, size });
    const position = new Position({ trade, id });
    this.positions[id] = position;
  }

  async positionClosed({ price, time, size, id }) {
    const trade = new Trade({ price, time, size });
    const position = this.positions[id];

    if (position) {
      position.close({ trade });
    }
  }
}
