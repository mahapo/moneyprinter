const colors = require("colors/safe");

export class PositionLeveraged {
  state: string;
  enter: any;
  id: any;

  constructor({ trade, id }) {
    this.state = "open";
    this.enter = trade;
    this.id = id;
  }

  update({price}) {

  }

  print() {
    const enter = `${this.enter.side} | ${this.enter.price} | ${this.enter.liquidationPrice}`;

    // var profit = "";
    // if (this.state === "closed") {
    //   const prof = `${this.profitString()}`;
    //   const colored = this.profit() > 0 ? colors.green(prof) : colors.red(prof);
    //   profit = `Profit: ${colored}`;
    // }

    console.log(`${enter}`);
  }

  profit() {
    // const fee = 0.0025;
    // const entrance = this.enter.price * (1 + fee);
    // if (this.exit) {
    //   const exit = this.exit.price * (1 - fee);
    //   return exit - entrance;
    // } else {
    //   return 0;
    // }
  }

  profitString() {
    return this.profit().toFixed(2);
  }
}
