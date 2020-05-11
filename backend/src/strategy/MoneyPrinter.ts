import { StrategyBase } from "./StrategyBase";
import { PositionLeveraged, OrderLeveraged } from "../models";
import * as configuration from "../configuration";

export class MoneyPrinter extends StrategyBase {
  static steps: any;
  static maxStep: number = 0;
  static idKeys = [
    "id",
    "time",
    "price",
    "priceTop",
    "priceBottom",
    "size",
    "leverage",
    "count",
    "ratio",
  ];

  options = {
    price: 0,
    time: new Date(),
    size: 0,
    leverage: 100,
    symbol: "",
    ratio: 2,
  };

  stats = {
    countMax: 0,
    sizeMax: 0,
  };

  count: number = 0;
  side: string;

  long: OrderLeveraged;
  short: OrderLeveraged;

  priceRange: number;
  priceTop: number;
  priceBottom: number;

  currentPositions = [];
  currentPosition: PositionLeveraged;

  constructor(private runner) {
    super();
  }

  async run(tick) {
    if (!this.currentPositions.length) {
      this.runner.onSignal(tick);
    }
  }

  // updatePositions({ price, time }) {
  //   this.activePositions.forEach((p) => p.onTick({ price, time }));
  // }

  openOrders({ price, time, size, leverage, symbol, ratio = 2 }) {
    this.options = {
      price,
      time: new Date(time),
      size: Math.round(size),
      leverage,
      symbol,
      ratio,
    };

    this.count = 0;

    this.long = new OrderLeveraged({ ...this.options, side: "buy" });
    this.short = new OrderLeveraged({ ...this.options, side: "sell" });

    this.priceRange = this.short.changePriceLiquidation * 0.6;
    this.priceRange = Math.round(this.priceRange);
    // this.priceRange = 14;
    this.priceTop = this.options.price + this.priceRange / 2;
    this.priceBottom = this.options.price - this.priceRange / 2;

    this.long.price = this.short.stopLoss = this.priceTop;
    this.short.price = this.long.stopLoss = this.priceBottom;

    this.long.takeProfit = this.short.price + this.priceRange * ratio;
    this.short.takeProfit = this.short.price - this.priceRange * ratio;

    // this.long.stopLoss += 1;
    // this.short.stopLoss -= 1;

    this.currentPositions.push(
      // @ts-ignore
      new PositionLeveraged({
        order: this.long,
        id: this.createId(),
      })
    );
    this.currentPositions.push(
      // @ts-ignore
      new PositionLeveraged({
        order: this.short,
        id: this.createId(),
      })
    );
    return this.currentPositions;
  }

  onPositionFilled(position) {
    position.status = "filled";

    if (this.countFilled === 1) {
      this.side = position.order.side;
      let otherSide: PositionLeveraged = this.currentPositions.find(
        (position: PositionLeveraged) => position.order.side !== this.side
      );
      position.done = "done";
      if (otherSide) otherSide.status = "closed";

      let order =
        this.nextSide !== "buy" ? this.long.clone() : this.short.clone();
      order.size = order.size * this.currentStep.factor + position.order.size;

      this.currentPositions.push(
        // @ts-ignore
        new PositionLeveraged({
          order,
          id: this.createId(),
        })
      );
      // } else if (this.countFilled > Infinity) {
      //   this.onPositionDone(position, true);
      //   // TODO: Stop Trading after reach max count
    } else {
      let order =
        this.nextSide === "buy" ? this.long.clone() : this.short.clone();
      order.size = order.size * this.currentStep.factor + position.order.size

      this.currentPositions.push(
        // @ts-ignore
        new PositionLeveraged({
          order,
          id: this.createId(),
        })
      );
      this.stats.sizeMax = Math.max(this.stats.sizeMax, order.size);
    }

    this.stats.countMax = Math.max(this.stats.countMax, this.countFilled);
  }

  onPositionDone(position, win) {
    position.status = "done";
    if (win) {
      this.currentPositions.forEach((p: PositionLeveraged) => {
        if (p.status === "open") p.status = "closed";
      });

      this.options.time = new Date();
      this.count = 0;
      this.positions.push(...this.currentPositions);
      this.currentPositions = [];
    }
  }

  createId(): string {
    let options = [
      configuration.get("KEY"),
      this.options.time.getTime(),
      Math.round(this.options.price),
      this.priceTop,
      this.priceBottom,
      this.options.size,
      this.options.leverage,
      this.countFilled,
      this.options.ratio,
      this.currentStep.total,
    ];
    return Object.values(options).join("-");
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
  //     size: parseFloat(options.size),
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

  //   this.positions.push(
  //     new PositionLeveraged({
  //       order,
  //       id: options.oldId.replace("-" + options.side, ""),
  //     })
  //   );

  //   return order;
  // }

  searchPosition(order) {
    return this.currentPositions.find(
      (position: PositionLeveraged) =>
        position.id === order.id ||
        position.idExchange === order.idExchange ||
        (position.order.side === order.side &&
          position.order.size === order.size)
    );
  }

  calcStep(index) {
    return [...Array(index)].reduce(
      (step, _, i) => {
        if (i > 0) {
          do {
            step.factor += 1;
            step.profit = step.factor * (this.options.ratio - 1);
            step.profitTotal = step.profit - step.total;
          } while (step.profitTotal < 0);
        } else {
          step.profit = step.factor * (this.options.ratio - 1);
          step.profitTotal = step.profit - step.total;
        }
        step.total += step.factor;
        return step;
      },
      {
        factor: 1,
        total: 0,
        profit: 0,
        profitTotal: 0,
      }
    );
  }

  get countFilled(): number {
    return this.currentPositions.filter(
      (position: PositionLeveraged) =>
        position.status === "filled" || position.status === "done"
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
    if (this.countFilled === 0) return this.calcStep(this.countFilled);
    return (
      this.calcStep(this.countFilled)
    );
  }
}
