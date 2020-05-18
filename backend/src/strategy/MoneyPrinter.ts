import { StrategyBase } from "./StrategyBase";
import { OrderLeveraged, ZoneRecovery } from "../models";
import * as configuration from "../configuration";

export class MoneyPrinter extends StrategyBase {
  static idKeys = [
    "id",
    "time",
    "price",
    "priceTop",
    "priceBottom",
    "amount",
    "leverage",
    "count",
    "ratio",
  ];

  options = {
    price: 0,
    timestamp: 0,
    amount: 0,
    leverage: 100,
    symbol: "",
    ratio: 2,
  };

  stats = {
    countMax: 0,
    amountMax: 0,
  };

  side: string;

  long: OrderLeveraged;
  short: OrderLeveraged;

  priceRange: number;
  priceTop: number;
  priceBottom: number;

  currentOrders = [];
  currentOrder: OrderLeveraged;

  maxSteps: number = 20;

  isLive: boolean;

  constructor(private runner) {
    super();
    this.isLive = !!this.runner?.account;
  }

  async run(tick) {
    if (!this.currentOrders.length) {
      this.runner.onSignal(tick);
    }
  }

  onSignal({ price, timestamp, amount, leverage, symbol, ratio }) {
    if (this.currentOrders.length) return;

    this.options = {
      price,
      timestamp,
      amount,
      leverage,
      symbol,
      ratio,
    };

    const rounder = (price: number) =>
      this.isLive
        ? parseFloat(
            this.runner.account.instance.priceToPrecision(symbol, price)
          )
        : price;

    this.long = new OrderLeveraged({ ...this.options, side: "buy" });
    this.short = new OrderLeveraged({ ...this.options, side: "sell" });

    this.priceRange = rounder(this.short.changePriceLiquidation * 0.8);

    this.priceTop = rounder(this.options.price + this.priceRange / 2);
    this.priceBottom = rounder(this.options.price - this.priceRange / 2);

    this.long.price = this.short.stopLoss = this.priceTop;
    this.short.price = this.long.stopLoss = this.priceBottom;

    this.long.takeProfit = rounder(
      this.short.price + this.priceRange * this.options.ratio
    );
    this.short.takeProfit = rounder(
      this.short.price - this.priceRange * this.options.ratio
    );

    this.long.idUser = this.createId();
    this.short.idUser = this.createId();

    this.currentOrders.push(this.long);
    this.currentOrders.push(this.short);

    return this.currentOrders;
  }

  onOrderFilled(order: OrderLeveraged) {
    order.filled = order.amount;

    if (this.countFilled === 1) {
      this.side = order.side;

      if (this.isLive) {
        let otherSide: OrderLeveraged = this.currentOrders.find(
          (order: OrderLeveraged) => order.side !== this.side
        );
        if (otherSide) otherSide.status = "canceled";
        let newOrder =
          this.nextSide !== "buy" ? this.long.clone() : this.short.clone();
        newOrder.amount =
          this.options.amount * this.currentStep.factor + order.amount;
        newOrder.idUser = this.createId();

        this.currentOrders.push(newOrder);
      }
    } else if (this.countFilled > this.maxSteps) {
      this.onOrderDone(order, true);
    } else {
      let newOrder =
        this.nextSide !== "buy" ? this.long.clone() : this.short.clone();

      if (this.isLive) {
        newOrder.amount =
          this.options.amount * this.currentStep.factor + order.amount;
        newOrder.idUser = this.createId();
      } else {
        newOrder.amount = this.options.amount * this.currentStep.factor;
      }

      this.currentOrders.push(newOrder);
      this.stats.amountMax = Math.max(this.stats.amountMax, order.amount);
    }

    this.stats.countMax = Math.max(this.stats.countMax, this.countFilled);
  }

  onOrderDone(order: OrderLeveraged, win) {
    order.status = "closed";
    if (win) {
      this.currentOrders.forEach((p: OrderLeveraged) => {
        if (p.status === "open") p.status = "canceled";
      });

      this.options.timestamp = Math.random();
      this.orders.push(...this.currentOrders);
      this.currentOrders = [];
    }
  }

  createId(): string {
    let options = [
      configuration.get("KEY"),
      this.options.timestamp,

      this.options.price,
      this.priceRange,

      this.options.amount,
      this.options.leverage,
      this.options.ratio,

      this.countFilled,
    ];
    return Object.values(options).join("-");
  }

  printActiveOrders() {
    this.currentOrders.forEach((p) => {
      p.print();
    });
  }

  get profitTotal() {
    return [...this.currentOrders, ...this.orders].reduce((r, p) => {
      return r + p.profit;
    }, 0);
  }

  get countFilled(): number {
    return this.currentOrders.filter(
      (order: OrderLeveraged) => order.filled > 0
    ).length;
  }

  get nextSide() {
    return this.countFilled % 2 !== 0
      ? this.side
      : this.side === "buy"
      ? "sell"
      : "buy";
  }

  get currentStep() {
    return ZoneRecovery.calcStep(this.countFilled, this.options.ratio);
  }
}
