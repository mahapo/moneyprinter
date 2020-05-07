import { StrategyBase } from "./StrategyBase";
import { PositionLeveraged, Position, OrderLeveraged } from "../models";
import * as configuration from "../configuration";

export class MoneyPrinter extends StrategyBase {
  // static id: string = process.env.KEY;
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
    ratio: 2,
  };

  count: number = 0;
  countMax: number = 0;
  side: string;

  long: OrderLeveraged;
  short: OrderLeveraged;

  priceRange: number;
  priceTop: number;
  priceBottom: number;

  currentPositions = [];

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

  openOrders({ price, time, size, leverage = 100, ratio = 2 }) {
    this.options = {
      price: price,
      time: new Date(time),
      size: Math.round(size),
      leverage: leverage,
      ratio: ratio,
    };

    this.count = 0;

    this.long = new OrderLeveraged({ ...this.options, side: "buy" });
    this.short = new OrderLeveraged({ ...this.options, side: "sell" });

    this.priceRange = Math.round(this.short.changePriceLiquidation * 0.1);
    // this.priceRange = 6;
    this.priceTop = this.options.price + this.priceRange / 2;
    this.priceBottom = this.options.price - this.priceRange / 2;

    this.long.price = this.short.stopLoss = this.priceTop;
    this.short.price = this.long.stopLoss = this.priceBottom;

    // this.long.stopLoss += 1;
    // this.short.stopLoss -= 1;

    const positions = [
      new PositionLeveraged({
        order: this.long,
        id: this.createId(),
      }),
      new PositionLeveraged({
        order: this.short,
        id: this.createId(),
      }),
    ];

    this.currentPositions.push(...positions);
    return positions;
  }

  onPositionFilled(position) {
    position.status = "filled";
    if (this.countFilled === 1) {
      this.side = position.order.side;
      // let otherSide = this.openPositions.find(
      //   (p) => p.order.side !== position.order.side
      // );
      // otherSide.order.size = otherSide.order.size + position.order.size;
      // otherSide.needsUpdate = true;
    } else {
      let order =
        this.nextSide === "buy" ? this.long.clone() : this.short.clone();
      order.size = order.size * this.currentStep.factor;

      const newPosition = new PositionLeveraged({ order, id: this.createId() });
      this.currentPositions.push(newPosition);
    }

    this.countMax = Math.max(this.countMax, this.countFilled);
  }

  onPositionDone(position, win) {
    position.status = "done";
    if (win) {
      this.currentPositions.forEach((p) => {
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

  get countFilled(): number {
    return this.currentPositions.filter(
      (position) => position.status === "filled" || position.status === "done"
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
    return [...Array(this.countFilled)].reduce(
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
}
