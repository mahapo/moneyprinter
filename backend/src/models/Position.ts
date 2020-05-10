const colors = require("colors/safe");
const EventEmitter = require("events");

export class Position extends EventEmitter {
  status: string;
  order: any;
  exit: any;
  id: any;
  idExchange: any;
  needsUpdate: boolean = false;

  constructor({ order, id }) {
    super();
    this.status = "open";
    this.order = order;
    this.id = `${id}-${order.side}`;
  }

  close({ order }) {
    this.status = "closed";
    this.exit = order;
  }

  print() {
    const enter = `Enter | ${this.order.price} | ${this.order.formatedTime}`;
    const exit = this.exit
      ? `Exit: | ${this.exit.price} | ${this.exit.formatedTime}`
      : "";

    var profit = "";
    if (this.status === "closed") {
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
}
