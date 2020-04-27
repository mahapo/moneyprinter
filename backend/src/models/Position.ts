const colors = require("colors/safe");
const EventEmitter = require("events");

export class Position extends EventEmitter {
  static positions = [];
  state: string;
  order: any;
  id: any;
  exit: any;

  constructor({ order }) {
    super();
    this.state = "open";
    this.order = order;
    Position.positions.push(this);
  }

  close({ order }) {
    this.state = "closed";
    this.exit = order;
  }

  print() {
    const enter = `Enter | ${this.order.price} | ${this.order.formatedTime}`;
    const exit = this.exit
      ? `Exit: | ${this.exit.price} | ${this.exit.formatedTime}`
      : "";

    var profit = "";
    if (this.state === "closed") {
      const prof = `${this.profitString()}`;
      const colored = this.profit() > 0 ? colors.green(prof) : colors.red(prof);
      profit = `Profit: ${colored}`;
    }

    console.log(`${enter} - ${exit} - ${profit}`);
  }

  profit() {
    const fee = 0.0025;
    const entrance = this.enter.price * (1 + fee);
    if (this.exit) {
      const exit = this.exit.price * (1 - fee);
      return exit - entrance;
    } else {
      return 0;
    }
  }

  profitString() {
    return this.profit().toFixed(2);
  }

  static get openPositions() {
    return Position.positions.filter((p) => p.state === "order");
  }

  static get activePositions() {
    return Position.positions.filter((p) => p.state === "active");
  }

  static get profitTotal() {
    return this.positions.reduce((r, p) => {
      return r + p.profit();
    }, 0);
  }

  static updatePositions({ price, time }) {
    [...this.activePositions, ...this.openPositions].forEach((p) =>
      p.onTick({ price, time })
    );
  }

  static printPositions() {
    const positions = this.positions;
    positions.forEach((p) => {
      p.print();
    });
  }

  static printProfit() {
    const prof = `${this.profitTotal}`;
    const colored =
      this.profitTotal > 0 ? colors.green(prof) : colors.red(prof);
    console.log(`Total: ${colored}`);
  }
}
