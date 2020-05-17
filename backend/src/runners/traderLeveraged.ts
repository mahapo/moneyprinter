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
    risk: 100,
    symbol: "",
  };

  constructor(public account, options) {
    super(options);
    this.options = {
      ratio: parseFloat(options.ratio),
      leverage: parseFloat(options.leverage),
      risk: parseInt(options.risk),
      symbol: options.symbol,
    };
  }

  async start() {
    this.strategy = new MoneyPrinter(this);
    await this.account.reset(this.options.symbol);
    await this.account.cancelAllOrders(this.options.symbol);
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
        timestamp: this.account.instance.now(),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async onSignal({ timestamp }) {
    try {
      const price = await this.account.getCurrentPrice(this.options.symbol);
      const balance = await this.account.getCurrentBalance(
        this.options.symbol.split("/")[0]
      );
      const amount = Math.round(
        (balance * price * this.options.leverage) / this.options.risk
      );

      const params = {
        price,
        timestamp,
        amount,
        leverage: this.options.leverage,
        symbol: this.options.symbol,
        ratio: this.options.ratio,
      };
      this.strategy.onSignal(params);
      Slack.signal(params);
      await this.updateOrders();
    } catch (error) {
      console.error("Try again", error);
      this.reset();
    }
  }

  async onTakeProfit(orderFromExchange) {
    try {
      const order = this.strategy.searchOrder(orderFromExchange);
      console.log(colors.green("onTakeProfit"), order?.toString());
      if (order) {
        await this.strategy.onOrderDone(order, true);
        this.account.lastTime = 0;
        await this.account.reset(this.options.symbol);
        this.onTick();
      } else {
        console.table(orderFromExchange);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async onStopLoss(orderFromExchange) {
    try {
      const order = this.strategy.searchOrder(orderFromExchange);
      console.log(colors.red("onStopLoss"), order?.toString());
      if (order) {
        await this.strategy.onOrderDone(order, false);
      } else {
        console.table(orderFromExchange);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async onFilled(orderFromExchange) {
    try {
      const order = this.strategy.searchOrder(orderFromExchange);
      console.log(colors.blue("onFilled"), order?.toString());
      if (order) {
        this.strategy.onOrderFilled(order);
        this.updateOrders();
      } else {
        console.table(orderFromExchange);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async updateOrders() {
    for (const order of this.strategy.currentOrders) {
      if (order.status === "canceled" && order.id) {
        await this.account.cancelOrder(order);
      } else if (
        order.status === "open" &&
        order.filled > 0 &&
        !order.stopLossSet
      ) {
        order.stopLossSet = await this.account.setTpSLTs(order);
      } else if (order.status === "open" && order.filled === 0) {
        try {
          await this.account.placeMarketStopOrder(order);
        } catch ({ message }) {
          if (this.strategy.countFilled === 0) this.reset();
          else {
            message = message.replace("bybit ", "");
            message = JSON.parse(message);
            console.log("Reset", message.ret_msg);
            await this.account.placeMarketStopOrder(order);
          }
        }
      }
    }
  }

  async reset() {
    console.log("Reset");
    this.strategy.currentOrders = [];
    this.account.lastTime = 0;
    await this.account.reset(this.options.symbol);
    await this.account.cancelAllOrders(this.options.symbol);
    this.onTick();
  }

  onFinish() {
    this.strategy.printProfit();
    process.exit(0);
  }
}
