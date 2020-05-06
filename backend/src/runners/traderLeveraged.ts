import { Runner } from "./runner";
import { Position } from "../models";
import { MoneyPrinter } from "../strategy";

export class TraderLeveraged extends Runner {
  ticker: any;
  currentCandle: any;

  constructor(public account, options) {
    super(options);
    // this.account.on("order_added", this.updatePositions.bind(this));
    // this.account.on("order_updated", this.updatePositions.bind(this));
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

  async start(options) {
    console.log(options);
    this.strategy = new MoneyPrinter(this);
    await this.account.instance.cancelAllOrders("BTC/USD");
    this.onTick({})
    this.account.on("TakeProfit", (position) => this.onTakeProfit(position));
    this.account.on("StopLoss", (position) => this.onStopLoss(position));
    this.account.on("Filled", (position) => this.onFilled(position));
  }

  async onTick(tick) {
    try {
      this.strategy.run({ price: await this.account.getCurrentPrice("BTC/USD"), time:this.account.instance.now()});
    } catch (error) {
      console.log(error);
    }
  }

  async onTakeProfit(position) {
    position = this.strategy.positions.find(p => p.id === position.info.order_link_id)
    try {
      console.log("onTakeProfit", position.id);
      await this.strategy.onPositionDone(position, true);
      this.account.lastTime=0
      this.onTick({})
    } catch (error) {
      console.log(error);
    }
  }

  async onStopLoss(position) {
    position = this.strategy.positions.find(p => p.id === position.info.order_link_id)
    try {
      console.log("onStopLoss", position.id);
      await this.strategy.onPositionDone(position, false);
      this.onTick({})
    } catch (error) {
      console.log(error);
    }
  }

  async onFilled(position) {
    position = this.strategy.positions.find(p => p.id === position.info.order_link_id)
    try {
      console.log("onFilled", position.id);
      let newPosition = await this.strategy.onPositionFilled(position)
      if(newPosition) await this.account.placeOrder(newPosition);
      console.log("count", this.strategy.count);
    } catch (error) {
      console.log(error);
    }
  }

  onFinish() {
    this.strategy.printProfit();
    process.exit(0);
  }

  async onSignal({ time }) {
    try {
      const p = await this.account.getCurrentPrice("BTC/USD");
      console.log(p);
      const positions = this.strategy.openOrders({
        price: p,
        time,
        size: 100,
      });
      for (const position of positions) {
        await this.account.placeOrder(position);
      }
    } catch (error) {}
  }
}
