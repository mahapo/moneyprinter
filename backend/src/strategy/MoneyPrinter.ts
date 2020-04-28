import { StrategyBase } from "./StrategyBase";
import { PositionLeveraged, Position, OrderLeveraged } from "../models";
export class MoneyPrinter extends StrategyBase {
  static steps: any;
  static maxStep: number = 0;
  static id: string = "aa";
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
  side: string;

  long: OrderLeveraged;
  short: OrderLeveraged;

  priceRange: number;
  priceTop: number;
  priceBottom: number;

  constructor() {
    super();
    MoneyPrinter.calcSteps();
  }

  async run({ price, time }) {
    if (!this.positions.length) {
      // console.log(`Time: ${time.toLocaleString()}  Price: ${price.toFixed(2)}`);
      this.emit("signal", { price, time });
    } else {
      // console.log(`Price: ${price.toFixed(2)}`);
      PositionLeveraged.updatePositions({ price, time });
    }
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

    this.priceRange = Math.round(this.short.changePriceLiquidation * 0.7);
    this.priceTop = Math.round(this.options.price + this.priceRange / 2);
    this.priceBottom = Math.round(price - this.priceRange / 2);

    this.long.price = this.short.stopLoss = this.priceTop;
    this.short.price = this.long.stopLoss = this.priceBottom;

    new PositionLeveraged({
      order: this.long,
      id: this.id,
    });
    new PositionLeveraged({
      order: this.short,
      id: this.id,
    });

    this.positions.forEach(this.initPositionEvents.bind(this));
  }

  get id(): string {
    let options = [
      MoneyPrinter.id,
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

  get positions() {
    return Position.positionsArray.filter((position) =>
      position.id.includes(`${MoneyPrinter.id}-${this.options.time.getTime()}`)
    );
  }

  static optionsFromId(id) {
    return MoneyPrinter.idKeys.reduce(
      (accumulator, key, index) => {
        accumulator[key] = id.split("-")[index];
        return accumulator;
      },
      { oldId: id }
    );
  }

  initPositionEvents(position) {
    // console.log("initPositionEvents", position.order.size);
    position.on("filled", () => {
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
        this.positions.push(position);
        this.initPositionEvents(position);
      }
      this.count++;
      MoneyPrinter.maxStep = Math.max(MoneyPrinter.maxStep, this.count);
    });
    position.on("done", (win) => {
      if (win) {
        this.positions.forEach((p) => {
          if (p.state === "open") p.state = "closed";
        });

        this.options.time = new Date();
      }
    });
  }

  static calcSteps(ratio = 2, count = 15) {
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
