import { OrderLeveraged, ZoneRecovery } from "../models";
import { Runner } from "./runner";
import { MoneyPrinter } from "../strategy";
import { Slack as Logger } from "../utils/Slack";

import * as colors from "colors/safe";

export class TraderLeveraged extends Runner {
  ticker: any;
  currentCandle: any;

  options = {
    ratio: 2,
    leverage: 100,
    risk: 100,
    symbol: "",
    maxSteps: 5,
  };

  constructor(public account, options) {
    super(options);
    this.options = {
      ratio: parseFloat(options.ratio),
      leverage: parseFloat(options.leverage),
      risk: parseInt(options.risk),
      maxSteps: parseInt(options.maxSteps),
      symbol: options.symbol,
    };
  }

  async start() {
    this.strategy = new MoneyPrinter(this);
    const reset = true;

    const lastStep = ZoneRecovery.calcStep(
      this.options.maxSteps + 1,
      this.options.ratio
    );

    this.options.risk = Math.round(lastStep.total);

    if (reset) {
      await this.account.resetAll(this.options.symbol);
      await this.account.setLeverage(
        this.options.symbol,
        this.options.leverage
      );
      this.onTick();
      const symbol = this.options.symbol.replace("/", "");
      this.account.on(`${symbol}:Filled`, this.onFilled.bind(this));
      this.account.on(`${symbol}:Liquidation`, this.onLiquidation.bind(this));
      this.account.on(`${symbol}:StopLoss`, this.onStopLoss.bind(this));
      this.account.on(`${symbol}:TakeProfit`, this.onTakeProfit.bind(this));
      this.healthchecker();
    } else {
      // TODO: import after bot restarts
      await this.importFromOpenOrders();
    }
  }

  healthchecker() {
    setTimeout(() => {
      // TODO: check if all Orders are valid
      this.onTick();
    }, 10000);
  }

  async importFromOpenOrders() {
    let [orders, position] = await this.account.getCurrentOrdersAndPosition(
      this.options.symbol
    );
    const id = orders?.reverse()[0]?.clientOrderId;
    if (id) {
      console.table(orders[0].clientOrderId);
      orders = orders
        .filter((order) => order.status === "filled" || order.status === "open")
        .filter((order) => !!order.clientOrderId)
        .filter((order) => order.clientOrderId.includes(id.split("-")[1]));
      console.table(orders);
      // TODO: orders to this.strategy.currentOrders
    } else {
      // TODO: reset all not bot orders
    }
  }

  async onTick() {
    try {
      this.strategy.run({
        price: await this.account.getCurrentPrice(this.options.symbol),
        timestamp: this.account.instance.now(),
      });
    } catch (error) {
      Logger.error(error);
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
      Logger.signal(params);
      await this.updateOrders();
    } catch (error) {
      console.error("Try again", error);
      this.reset();
    }
  }

  async onTakeProfit(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange);
      Logger.log(colors.green("onTakeProfit"), order?.toString());
      if (order) {
        await this.strategy.onOrderDone(order, true);
        await this.account.reset();
      } else {
        console.table(orderFromExchange);
      }
    } catch (error) {
      Logger.error(error);
    }
  }

  async onLiquidation(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange);
      console.log(colors.red("onLiquidation"), order?.toString());
      if (order) {
        await this.strategy.onOrderDone(order, false);
      } else {
        console.table(orderFromExchange);
      }
    } catch (error) {
      Logger.error(error);
    }
  }

  async onStopLoss(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange);
      Logger.log(colors.red("onStopLoss"), order?.toString());
      if (order) {
        await this.strategy.onOrderDone(order, false);
      } else {
        console.table(orderFromExchange);
      }
    } catch (error) {
      Logger.error(error);
    }
  }

  async onFilled(orderFromExchange) {
    try {
      const order = this.searchOrder(orderFromExchange);
      Logger.log(colors.blue("onFilled"), order?.toString());
      if (order) {
        this.strategy.onOrderFilled(order);
        this.updateOrders();
      } else {
        console.table(orderFromExchange);
      }
    } catch (error) {
      Logger.error(error);
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
    this.strategy.currentOrders = [];
    this.account.lastTime = 0;
    await this.account.resetAll(this.options.symbol);
    this.onTick();
  }

  onFinish() {
    this.strategy.printProfit();
    process.exit(0);
  }

  searchOrder(orderFromExchange) {
    return this.strategy.currentOrders.find((order: OrderLeveraged) => {
      if (
        order.id === orderFromExchange.id ||
        order.idUser === orderFromExchange.idUser
      )
        return true;
      if (
        order.side === orderFromExchange.side &&
        order.amount === orderFromExchange.amount
      )
        return true;
      return false;
    });
  }

  // optionsFromId(id) {
  //   let options = id.split("-");
  //   return MoneyPrinter.idKeys.reduce(
  //     (accumulator, key, index) => {
  //       accumulator[key] = options[index];
  //       return accumulator;
  //     },
  //     { oldId: id, side: options[options.length - 1] }
  //   );
  // }

  // createFromOptions(options) {
  //   this.options = {
  //     price: parseFloat(options.price),
  //     time: new Date(options.time),
  //     amount: parseFloat(options.amount),
  //     leverage: parseFloat(options.leverage),
  //     ratio: parseFloat(options.ratio),
  //   };
  //   const order = new OrderLeveraged({
  //     ...this.options,
  //     side: options.side,
  //   });
  //   this.priceTop = parseFloat(options.priceTop);
  //   this.priceBottom = parseFloat(options.priceBottom);
  //   this.count = parseInt(options.count);

  //   if (options.side === "buy") {
  //     order.stopLoss = this.priceBottom;
  //     order.takeProfit = this.priceTop;
  //   } else {
  //     order.takeProfit = this.priceBottom;
  //     order.stopLoss = this.priceTop;
  //   }

  //   this.orders.push(
  //     new OrderLeveraged({
  //       order,
  //       id: options.oldId.replace("-" + options.side, ""),
  //     })
  //   );

  //   return order;
  // }
}
