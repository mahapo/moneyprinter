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

  updatePositions({ price, time }) {
    [...this.activePositions,...this.openPositions].forEach(p => p.onTick({ price, time }))
  }

  get openPositions() {
    return this.getPositions().filter((p) => p.state === "order");
  }

  get activePositions() {
    return this.getPositions().filter((p) => p.state === "active");
  }

  // async positionOpened({ price, time, size, id, leverage }) {
  //   const trade = new TradeLeveraged({ price, time, size, leverage });
  //   const position = new PositionLeveraged({ trade, id });
  //   this.positions[id] = position;
  // }

  // async positionClosed({ price, time, size, id, leverage }) {
  //   const trade = new TradeLeveraged({ price, time, size, leverage });
  //   const position = this.positions[id];

  //   if (position) {
  //     position.close({ trade });
  //   }
  // }
}
