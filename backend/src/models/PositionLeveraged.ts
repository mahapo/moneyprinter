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

  static updatePositions({ price, time }) {
    [...Position.openPositions, ...Position.filledPositions].forEach((p) =>
      p.onTick({ price, time })
    );
  }

  onTick({ price, time }) {
    if (this.state === "open") {
      if (
        (this.order.side === "long" && this.order.price <= price) ||
        (this.order.side === "short" && this.order.price >= price)
      ) {
        this.state = "filled";
        this.emit("filled");
      }
    } else if (this.state === "filled") {
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

  static createFromOptions(options) {
    const orderOptions = {
      price: options.price,
      time: options.time,
      size: options.size,
      leverage: options.leverage,
      side: options.side,
    };
    const order = new OrderLeveraged(orderOptions);

    order.stopLoss = options.stopLoss;
    order.takeProfit = options.takeProfit;

    new PositionLeveraged({
      order,
      id: options.oldId,
    });

    return order;
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
    return Position.positionsArray.map((position) => ({
      profit: position.profit(),
      ...position,
    }));
  }
}
