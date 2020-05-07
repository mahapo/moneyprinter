import * as colors from "colors/safe";
import { Position, OrderLeveraged } from "./";

export class PositionLeveraged extends Position {
  state: string;
  triggered: string;
  order: any;
  id: any;
  exit: number;
  onDone: any;

  constructor({ order, id }) {
    super({ order, id });
  }

  onTick({ price, time }) {
    if (this.status === "open") {
      if (
        (this.order.side === "buy" && this.order.price <= price) ||
        (this.order.side === "sell" && this.order.price >= price)
      ) {
        this.status = "filled";
      }
    }
    if (this.status === "filled") {
      if (
        (this.order.side === "buy" &&
          (this.order.takeProfit <= price || this.order.stopLoss >= price)) ||
        (this.order.side === "sell" &&
          (this.order.takeProfit >= price || this.order.stopLoss <= price))
      ) {
        this.status = "done";
        this.exit = price;
      }
    }
  }

  print() {
    var profit = "";
    if (this.status === "done") {
      const prof = `${this.profitString()}`;
      const colored = this.profit() > 0 ? colors.green(prof) : colors.red(prof);
      profit = `| Profit: ${colored}`;
    }

    console.log(`${this.order.toString()} - ${this.status} ${profit}`);
  }

  profit() {
    if (this.status === "done") {
      if (this.order.side === "buy")
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
}
