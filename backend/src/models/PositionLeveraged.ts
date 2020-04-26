const colors = require("colors/safe");

export class PositionLeveraged {
  static positions = [];
  state: string;
  triggered: string;
  order: any;
  id: any;
  exit: number;
  onDone: any;

  constructor({ order, id, onDone = () => {} }) {
    this.state = "order";
    this.order = order;
    // this.id = id;
    this.onDone = onDone;
    PositionLeveraged.positions.push(this);
  }

  onTick({ price, time }) {
    if (this.state === "order") {
      if (this.order.side === "long" && this.order.price <= price)
        this.state = "active";
      else if (this.order.side !== "long" && this.order.price >= price)
        this.state = "active";
    } else if (this.state === "active") {
      if (this.order.side === "long") {
        if (this.order.takeProfit <= price || this.order.stopLoss >= price)
          this.state = "done";
      } else {
        if (this.order.takeProfit >= price || this.order.stopLoss <= price)
          this.state = "done";
      }

      if (this.state === "done") {
        this.exit = price;
        this.onDone();
      }
    }
  }

  print() {
    var profit = "";
    if (this.state === "done") {
      const prof = `${this.profitString()}`;
      const colored = this.profit() > 0 ? colors.green(prof) : colors.red(prof);
      profit = `| Profit: ${colored}`;
    }

    console.log(`${this.order.toString()} - ${this.state} ${profit}`);
  }

  profit() {
    if (this.state === "done") {
      if (this.order.side === "long")
        return this.exit > this.order.price
          ? this.order.maxWin
          : this.order.maxLoss;
      else
        return this.exit < this.order.price
          ? this.order.maxWin
          : this.order.maxLoss;
    }
    return 0;
  }

  profitString() {
    return this.profit().toFixed(2);
  }
}
