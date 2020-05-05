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
    this.strategy.on("signal", (tick) => this.onSignal(tick));
    this.account.on("tick", (tick) => this.onTick(tick));

    // console.log("trader start", options);
    // try {
    //   this.account.init();
    // } catch (error) {
    //   console.log(error);
    // }
  }

  async onTick(tick) {
    try {
      console.log(await this.account.instance.fetchTrades("BTC/USD"));
      // console.log(await this.account.instance.fetchOrders("BTC/USD"));

      // this.strategy.run(tick);
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
        size: 2000,
      });
      console.log(positions);
      for (const position of positions) {
        await this.account.placeOrder(position);
      }
    } catch (error) {}
  }
}
