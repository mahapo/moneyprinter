import { OrderLeveraged, PositionLeveraged } from "../models";

export class HedgeManager {
  steps: any;
  price: number;
  leverage: number;
  ratio: number;
  size: number;
  time: Date;
  state: any;
  positions = [];

  long: OrderLeveraged;
  short: OrderLeveraged;

  priceRange: number;
  priceTop: number;
  priceBottom: number;

  constructor({ price, size, time, leverage = 100, ratio = 2 }) {
    this.price = price;
    this.leverage = leverage;
    this.ratio = ratio;
    this.size = size;
    this.time = time;
  }

  get id(): string {
    return `${this.time.getTime()}-${this.leverage}`;
  }

  createPositions() {
    const options = {
      price: this.price,
      time: this.time,
      size: this.size,
      leverage: this.leverage,
    };
    this.long = new OrderLeveraged({ ...options, side: "long" });
    this.short = new OrderLeveraged({ ...options, side: "short" });
    this.priceRange = Math.round(this.short.changePriceLiquidation * 0.95);
    this.priceTop = this.price + this.priceRange / 2;
    this.priceBottom = this.price - this.priceRange / 2;

    this.long.price = this.short.stopLoss = this.priceTop;
    this.short.price = this.long.stopLoss = this.priceBottom;

    this.state = "active";

    this.positions = [
      new PositionLeveraged({
        order: this.long,
        id: this.id,
      }),
      new PositionLeveraged({
        order: this.short,
        id: this.id,
      }),
    ];

    return this.positions;
  }

  calcSteps(count = 15) {
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
          step.profit = step.betFactor * (this.ratio - 1);
          step.profitTotal = step.profit - step.total;
        } while (step.profitTotal < 0);
      } else {
        step.profit = step.betFactor * (this.ratio - 1);
        step.profitTotal = step.profit - step.total;
      }
      step.total += step.betFactor;
      return { ...step };
    }));
  }
}
