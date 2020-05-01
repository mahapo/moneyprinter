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

  runner;

  constructor(runner) {
    super();
    this.runner = runner;
  }

  async run(tick) {
    if (!this.activePositions.length) {
      this.runner.onSignal(tick);
    } else {
      this.updatePositions(tick);
    }
  }

  updatePositions({ price, time }) {
    this.activePositions.forEach((p) => p.onTick({ price, time }));
  }

  openOrders({ price, time, size, leverage = 100, ratio = 2 }) {
    this.options = {
      price: price,
      time: new Date(time),
      size: Math.round(size),
      leverage: leverage,
      ratio: ratio,
    };

    this.long = new OrderLeveraged({ ...this.options, side: "long" });
    this.short = new OrderLeveraged({ ...this.options, side: "short" });

    this.priceRange = Math.round(this.short.changePriceLiquidation * 0.4);
    this.priceTop = Math.round(this.options.price + this.priceRange / 2);
    this.priceBottom = Math.round(this.options.price - this.priceRange / 2);

    this.long.price = this.short.stopLoss = this.priceTop;
    this.short.price = this.long.stopLoss = this.priceBottom;

    this.positions.push(
      new PositionLeveraged({
        order: this.long,
        id: this.id,
      }),
      new PositionLeveraged({
        order: this.short,
        id: this.id,
      })
    );

    this.positions.forEach(this.initPositionEvents.bind(this));
    return this.positions;
  }

  initPositionEvents(position) {
    // console.log("initPositionEvents", position.order.size);
    position.on("filled", () => {
      position.status = "filled";
      if (this.count === 0) this.side = position.order.side;
      else {
        let side =
          this.count % 2 !== 0
            ? this.side
            : this.side === "long"
            ? "short"
            : "long";
        let order = side === "long" ? this.long.clone() : this.short.clone();
        let factor = MoneyPrinter.steps[this.count].betFactor;
        order.size = order.size * factor;

        let position = new PositionLeveraged({ order, id: this.id });
        this.initPositionEvents(position);
        this.positions.push(position);
      }
      this.count++;
      this.countMax = Math.max(this.countMax, this.count);
    });
    position.on("done", (win) => {
      position.status = "done";
      if (win) {
        this.positions.forEach((p) => {
          if (p.status === "open") p.status = "closed";
        });

        this.options.time = new Date();
        this.count = 0;
      }
    });
  }

  get id(): string {
    let options = [
      configuration.get("KEY"),
      this.options.time.getTime(),
      Math.round(this.options.price),
      this.priceTop,
      this.priceBottom,
      this.options.size,
      this.options.leverage,
      this.count,
      this.options.ratio,
    ];
    return Object.values(options).join("-");
  }

  // get positions() {
  //   return Position.positionsArray.filter((position) =>
  //     position.id.includes(
  //       `${configuration.get("KEY")}-${this.options.time.getTime()}`
  //     )
  //   );
  // }

  optionsFromId(id) {
    let options = id.split("-");
    return MoneyPrinter.idKeys.reduce(
      (accumulator, key, index) => {
        accumulator[key] = options[index];
        return accumulator;
      },
      { oldId: id, side: options[options.length - 1] }
    );
  }

  createFromOptions(options) {
    this.options = {
      price: parseFloat(options.price),
      time: new Date(options.time),
      size: parseFloat(options.size),
      leverage: parseFloat(options.leverage),
      ratio: parseFloat(options.ratio),
    };
    const order = new OrderLeveraged({
      ...this.options,
      side: options.side,
    });
    this.priceTop = parseFloat(options.priceTop);
    this.priceBottom = parseFloat(options.priceBottom);
    this.count = parseInt(options.count);

    if (options.side === "long") {
      order.stopLoss = this.priceBottom;
      order.takeProfit = this.priceTop;
    } else {
      order.takeProfit = this.priceBottom;
      order.stopLoss = this.priceTop;
    }

    this.positions.push(
      new PositionLeveraged({
        order,
        id: options.oldId.replace("-" + options.side, ""),
      })
    );

    return order;
  }

  static async calcSteps(ratio = 2, count = 15) {
    let step = {
      betFactor: 1,
      total: 0,
      profit: 0,
      profitTotal: 0,
    };
    return (this.steps = [...Array(count)].map((_, i) => {
      if (i > 0) {
        do {
          step.betFactor += 1;
          step.profit = step.betFactor * (ratio - 1);
          step.profitTotal = step.profit - step.total;
        } while (step.profitTotal < 0);
      } else {
        step.profit = step.betFactor * (ratio - 1);
        step.profitTotal = step.profit - step.total;
      }
      step.total += step.betFactor;
      return { ...step };
    }));
  }
}
