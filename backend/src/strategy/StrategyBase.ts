const EventEmitter = require("events");
const colors = require("colors/safe");
export class StrategyBase extends EventEmitter {
  static id: string = "aa";
  positions = [];

  constructor() {
    super();
  }

  async run({ sticks = [], time, price }) {}

  get activePositions() {
    return this.positions.filter(
      (position) => position.status === "open" || position.status === "filled"
    );
  }

  get overview() {
    return this.positions.map((position) => ({
      profit: position.profit(),
      ...position,
    }));
  }

  get profitTotal() {
    return this.positions.reduce((r, p) => {
      return r + p.profit();
    }, 0);
  }

  printPositions() {
    this.positions.forEach((p) => {
      p.print();
    });
  }

  printProfit() {
    const prof = `${this.profitTotal}`;
    const colored =
      this.profitTotal > 0 ? colors.green(prof) : colors.red(prof);
    console.log(`Total: ${colored}`);
  }
}
