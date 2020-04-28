import * as randomstring from "randomstring";
import { Runner, MoneyPrinter } from "./runner";
import { Position, OrderLeveraged, PositionLeveraged } from "../models";

export class TraderLeveraged extends Runner {
  ticker: any;
  currentCandle: any;
  constructor(account, options) {
    super(account, options);

    this.account.on("tick", this.onTick.bind(this));
    this.account.on("order_added", this.updatePositions.bind(this));
    this.account.on("order_updated", this.updatePositions.bind(this));
  }

  updatePositions() {
    this.account.openOrders.forEach((order) => {
      let position = Position.positions.get(order.id);

      if (!position) {
        // const options = HedgeManager.optionsFromId(order.id);
        // PositionLeveraged.createFromOptions(options);
      }
    });
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
      Position.printPositions();
    } catch (error) {
      console.log(error);
    }
  }

  onFinish() {
    // this.printPositions();
    Position.printProfit();
    process.exit(0);
  }

  async onStraddleSignal({ price, time }) {
    const id = randomstring.generate(20);
    const positions = this.strategy.staddleOpened({
      price,
      time,
      size: 1000,
      id,
    });
    for (const position of positions) {
      this.account.placeOrder(position);
    }
  }
}
