import { Runner } from "./runner";
import { Position } from "../models";

export class TraderLeveraged extends Runner {
  ticker: any;
  currentCandle: any;
  constructor(account, options) {
    super(account, options);

    this.account.on("tick", (tick) => this.onTick(tick));
    this.strategy.on("signal", (tick) => this.onSignal(tick));
    this.account.on("order_added", this.updatePositions.bind(this));
    this.account.on("order_updated", this.updatePositions.bind(this));
  }

  updatePositions() {
    if (!this.account.orders) console.log("No Orders found");
    else {
      // console.log(`${this.account.openOrders.length} open orders found`);
      this.account.orders.forEach((order) => {
        let position = Position.positions.get(order.id);

        if (position && position.status === "open") {
          if (order.status === "closed" && order.filled > 0) {
            console.log(`Order filled: ${order.id} ${position.id}`);
            position.emit("filled");
          }
          //   const options = this.strategy.optionsFromId(order.id);
          //   let position = this.strategy.createFromOptions(options);
          //   console.log(`Order imported: ${order.id} ${position.id}`);
        }
      });
    }
  }

  async start() {
    console.log("trader start");
    try {
      this.account.init();
    } catch (error) {
      console.log(error);
    }
  }

  async onTick(tick) {
    try {
      this.strategy.run(tick);
    } catch (error) {
      console.log(error);
    }
  }

  onFinish() {
    Position.printProfit();
    process.exit(0);
  }

  async onSignal({ price, time }) {
    const positions = this.strategy.openOrders({
      price,
      time,
      size: 1000,
    });
    for (const position of positions) {
      this.account.placeOrder(position);
    }
    Position.printPositions();
  }
}
