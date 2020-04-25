const colors = require("colors/safe");

export class PositionLeveraged {
  state: string;
  triggered: string;
  trade: any;
  id: any;
  exit: number;
  onDone: any;

  constructor({ trade, id, onDone = () => {} }) {
    this.state = "order";
    this.trade = trade;
    this.id = id;
    this.onDone = onDone;
  }

  onTick({ price, time }) {
    if (this.state === "order") {
      if (this.trade.side === "long" && this.trade.price <= price)
        this.state = "active";
      else if (this.trade.side !== "long" && this.trade.price >= price)
        this.state = "active";
    } else if (this.state === "active") {
      if (this.trade.side === "long") {
        if (this.trade.takeProfit <= price || this.trade.stopLoss >= price)
          this.state = "done";
      } else {
        if (this.trade.takeProfit >= price || this.trade.stopLoss <= price)
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

    console.log(`${this.trade.toString()} - ${this.state} ${profit}`);
  }

  profit() {
    if (this.state === "done") {
      if (this.trade.side === "long")
        return this.exit > this.trade.price
          ? this.trade.maxWin
          : this.trade.maxLoss;
      else
        return this.exit < this.trade.price
          ? this.trade.maxWin
          : this.trade.maxLoss;
    }
    return 0;
  }

  profitString() {
    return this.profit().toFixed(2);
  }
}
