import { Runner } from "./runner";
import { Position } from "../models";
import { MoneyPrinter } from "../strategy";

import * as colors from "colors/safe";

export class TraderLeveraged extends Runner {
  ticker: any;
  currentCandle: any;

  constructor(public account, options) {
    super(options);
  }

  async start(options) {
    console.log(options);
    this.strategy = new MoneyPrinter(this);
    await this.account.reset("BTC/USD");
    this.onTick();
    this.account.on("TakeProfit", (position) => this.onTakeProfit(position));
    this.account.on("StopLoss", (position) => this.onStopLoss(position));
    this.account.on("Filled", (position) => this.onFilled(position));
  }

  async onTick() {
    try {
      this.strategy.run({
        price: await this.account.getCurrentPrice("BTC/USD"),
        time: this.account.instance.now(),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async onTakeProfit(position) {
    console.log(colors.green("onTakeProfit"), position?.info?.order_link_id);
    try {
      position = this.strategy.positions.find(
        (p) => p.id === position.info.order_link_id
      );
      await this.strategy.onPositionDone(position, true);
      this.account.lastTime = 0;
      this.strategy.positions = [];
      await this.account.reset("BTC/USD");
      this.onTick();
    } catch (error) {
      console.log(error);
    }
  }

  async onStopLoss(trade) {
    console.log(colors.red("onStopLoss"), trade);
    try {
      const position = this.strategy.positions.find(
        (p) => p.id === trade?.info?.order_link_id
      );
      // await this.strategy.onPositionDone(position, false);
      // this.onTick({})
    } catch (error) {
      console.log(error);
    }
  }

  async onFilled(trade) {
    console.log(colors.blue("onFilled"), trade?.info?.order_link_id);
    try {
      const position = this.strategy.positions.find(
        (p) => p.id === trade?.info?.order_link_id
      );

      this.strategy.onPositionFilled(position);
      this.updatePositions();
    } catch (error) {
      console.log(error);
    }
  }

  async updatePositions() {
    for (const position of this.strategy.positions) {
      if (position.needsUpdate) {
        // await this.account.updateOrder(position);
        // position.needsUpdate = false;
      } else if (position.status === "open") {
        // if (this.strategy.countFilled === 0)
        //   await this.account.placeMarketStopOrder(position);
        // else
        await this.account.placeMarketStopOrder(position);
      } else if (position.status === "filled") {
        await this.account.setTpSLTs(position);
      }
    }
  }

  onFinish() {
    this.strategy.printProfit();
    process.exit(0);
  }

  async onSignal({ time }) {
    try {
      const price = await this.account.getCurrentPrice("BTC/USD");
      console.log(`=====================`);
      console.log(`New signal @ ${price}`);
      this.strategy.openOrders({
        price,
        time,
        size: 100,
      });
      await this.updatePositions();
    } catch (error) {
      console.log("Try again");
      await this.account.reset("BTC/USD");
      this.onTick();
    }
  }
}
