import * as colors from "colors/safe";
import { Position } from "./Position";

export class PositionLeveraged extends Position {
  state: string;
  triggered: string;
  order: any;
  id: any;
  exit: number;
  onDone: any;

  constructor({ order, onDone = () => {} }) {
    super({ order });
    this.state = "order";
    this.order = order;
    // this.id = id;
    this.onDone = onDone;
  }

  onTick({ price, time }) {
    if (this.state === "order") {
      if (
        (this.order.side === "long" && this.order.price <= price) ||
        (this.order.side === "short" && this.order.price >= price)
      ) {
        this.state = "active";
        this.emit("active");
      }
    } else if (this.state === "active") {
      if (
        (this.order.side === "long" &&
          (this.order.takeProfit <= price || this.order.stopLoss >= price)) ||
        (this.order.side === "short" &&
          (this.order.takeProfit >= price || this.order.stopLoss <= price))
      ) {
        this.state = "done";
        this.exit = price;

        this.emit("done", this.profit() > 0);
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

  static overview() {
    return Position.positions.map(position => ({
      profit: position.profit(),
      ...position
    }))
  }
}
