import { Runner } from "./runner";
import { MoneyPrinter } from "../strategy";
import { Slack } from "../utils/Slack";

import * as colors from "colors/safe";

export class TraderLeveraged extends Runner {
  ticker: any;
  currentCandle: any;

  options = {
    ratio: 2,
    leverage: 100,
    symbol: "",
  };

  constructor(public account, options) {
    super(options);
    this.options = {
      ratio: parseFloat(options.ratio),
      leverage: parseFloat(options.leverage),
      symbol: options.symbol,
    };
  }

  async start() {
    this.strategy = new MoneyPrinter(this);
    await this.account.reset(this.options.symbol);
    await this.account.cancelAllPositions(this.options.symbol);
    this.onTick();
    const symbol = this.options.symbol.replace("/", "");
    this.account.on(`${symbol}:Filled`, this.onFilled.bind(this));
    this.account.on(`${symbol}:Liquidation`, this.onStopLoss.bind(this));
    this.account.on(`${symbol}:StopLoss`, this.onStopLoss.bind(this));
    this.account.on(`${symbol}:TakeProfit`, this.onTakeProfit.bind(this));
  }

  async onTick() {
    try {
      this.strategy.run({
        price: await this.account.getCurrentPrice(this.options.symbol),
        time: this.account.instance.now(),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async onSignal({ time }) {
    try {
      const price = await this.account.getCurrentPrice(this.options.symbol);
      const balance = await this.account.getCurrentBalance(
        this.options.symbol.split("/")[0]
      );
      const size = Math.round((balance * price * this.options.leverage) / 100);

      const params = {
        price,
        time,
        size,
        leverage: this.options.leverage,
        symbol: this.options.symbol,
        ratio: this.options.ratio,
      };
      this.strategy.openOrders(params);
      Slack.signal(params);
      await this.updatePositions();
    } catch (error) {
      console.error("Try again", error);
      this.reset();
    }
  }

  async onTakeProfit(order) {
    try {
      const position = this.strategy.searchPosition(order);
      console.log(colors.green("onTakeProfit"), position?.order.toString());
      await this.strategy.onPositionDone(position, true);
      this.account.lastTime = 0;
      await this.account.reset(this.options.symbol);
      this.onTick();
    } catch (error) {
      console.log(error);
    }
  }

  async onStopLoss(order) {
    try {
      const position = this.strategy.searchPosition(order);
      console.log(colors.red("onStopLoss"), position?.order.toString());
      await this.strategy.onPositionDone(position, false);
    } catch (error) {
      console.log(error);
    }
  }

  async onFilled(order) {
    try {
      const position = this.strategy.searchPosition(order);
      console.log(colors.blue("onFilled"), position?.order.toString());
      if (position) {
        this.strategy.onPositionFilled(position);
        this.updatePositions();
      }
    } catch (error) {
      console.log(error);
    }
  }

  async updatePositions() {
    for (const status of ["closed", "open", "filled"]) {
      for (const position of this.strategy.currentPositions.filter(
        (position) => position.status === status
      )) {
        if (position.status === "closed" && position.idExchange) {
          await this.account.cancelOrder(position);
        } else if (position.status === "filled" && !position.stopLossSet) {
          position.stopLossSet = await this.account.setTpSLTs(position);
        } else if (position.status === "open") {
          try {
            await this.account.placeMarketStopOrder(position);
          } catch ({ message }) {
            if (this.strategy.countFilled === 0) this.reset();
            else {
              message = message.replace("bybit ", "");
              message = JSON.parse(message);
              console.log("Reset", message.ret_msg);
              await this.account.placeMarketStopOrder(position);
            }
          }
        }
      }
    }
  }

  async reset() {
    console.log("Reset");
    this.strategy.currentPositions = [];
    this.account.lastTime = 0;
    await this.account.reset(this.options.symbol);
    await this.account.cancelAllPositions(this.options.symbol);
    this.onTick();
  }

  onFinish() {
    this.strategy.printProfit();
    process.exit(0);
  }
}
