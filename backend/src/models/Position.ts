const colors = require("colors/safe");
const EventEmitter = require("events");

export class Position extends EventEmitter {
  static positions = new Map();
  state: string;
  order: any;
  exit: any;
  id: any;

  constructor({ order, id }) {
    super();
    this.state = "open";
    this.order = order;
    this.id = `${id}-${order.side}`;
    Position.positions.set(this.id, this);
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

  static get positionsArray() {
    return Array.from(Position.positions.values());
  }

  static get openPositions() {
    return Position.positionsArray.filter((p) => p.state === "open");
  }

  static get filledPositions() {
    return Position.positionsArray.filter((p) => p.state === "filled");
  }

  static get profitTotal() {
    return Position.positionsArray.reduce((r, p) => {
      return r + p.profit();
    }, 0);
  }

  static printPositions() {
    // console.log(Position.positionsArray);

    Position.positionsArray.forEach((p) => {
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
