const colors = require("colors/safe");

export class Position {
  state: string;
  enter: any;
  id: any;
  exit: any;

  constructor({ order, id }) {
    this.state = "open";
    this.enter = order;
    this.id = id;
  }

  close({ order }) {
    this.state = "closed";
    this.exit = order;
  }

  print() {
    const enter = `Enter | ${this.enter.price} | ${this.enter.formatedTime}`;
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
}
