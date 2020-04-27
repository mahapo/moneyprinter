// https://phemex.com/references/articles/liquidation-price
// https://antiliquidation.gitlab.io/assets/scripts/main.js

import * as colors from "colors/safe";

function round(value, step) {
  step || (step = 1.0);
  var inv = 1.0 / step;
  return Math.round(value * inv) / inv;
}

export class OrderLeveraged {
  leverage: number;
  price: number;
  size: number;
  ratio: number;
  takeProfit: number;
  stopLoss: number;
  maintenanceMargin: number;
  time: any;
  side: string;

  constructor({ price, time, size, leverage = 100, ratio = 2, side = "long" }) {
    this.price = price;
    this.time = time;
    this.size = size;
    this.leverage = leverage;
    this.ratio = ratio;
    this.side = side;

    this.maintenanceMargin = 0.005;

    this.takeProfit = this.takeProfitSuggestion;
    this.stopLoss = this.stopLossSuggestion;
  }

  get formatedTime(): number {
    return this.time.toLocaleString();
  }

  get adjustedLong(): number {
    return (
      this.maintenanceMargin - (1 / this.leverage) * this.maintenanceMargin
    );
  }

  get adjustedShort(): number {
    return (
      this.maintenanceMargin + (1 / this.leverage) * this.maintenanceMargin
    );
  }

  // Change in Price to Bankruptcy (%)
  get changePriceBankruptcyPercent(): number {
    if (this.side === "long") return (1 / (this.leverage + 1)) * -1 * 100;
    return (1 / (this.leverage - 1)) * 100;
  }

  // Change in Price to Liquidation (%)
  get changePriceLiquidationPercent(): number {
    if (this.side === "long")
      return this.changePriceBankruptcyPercent + this.adjustedLong * 100;
    return this.changePriceBankruptcyPercent - this.adjustedShort * 100;
  }

  // Liquidation Price
  get liquidationPrice(): number {
    if (this.side === "long")
      return round(
        this.price + (this.price * this.changePriceLiquidationPercent) / 100,
        0.5
      );
    return round(
      this.price + (this.price * this.changePriceLiquidationPercent) / 100,
      0.5
    );
  }

  // Change in Price to Liquidation ($)
  get changePriceLiquidation(): number {
    return (this.price - this.liquidationPrice) * -1;
  }

  get takeProfitSuggestion(): number {
    if (this.side === "long")
      return round(
        this.price + Math.abs(this.changePriceLiquidation) * this.ratio,
        0.5
      );
    return round(
      this.price - Math.abs(this.changePriceLiquidation) * this.ratio,
      0.5
    );
  }

  get stopLossSuggestion(): number {
    if (this.side === "long") return this.liquidationPrice + 5;
    return this.liquidationPrice - 5;
  }

  get takeProfitPercent(): number {
    return (this.takeProfit / this.price) * 100 - 100;
  }

  get stopLossPercent(): number {
    return (this.stopLoss / this.price) * 100 - 100;
  }

  get maxWin(): number {
    if (this.side === "long")
      return (this.size / this.leverage) * this.takeProfitPercent;
    return (this.size / this.leverage) * this.takeProfitPercent * -1;
  }

  get maxLoss(): number {
    if (this.side === "long")
      return (this.size / this.leverage) * this.stopLossPercent;
    return (this.size / this.leverage) * this.stopLossPercent * -1;
  }

  toString(): string {
    const colored = this.side === "long" ? colors.green("L") : colors.red("S");
    return `${colored} ${this.size} @ ${this.price} TP:${this.takeProfit} SL:${this.stopLoss}`;
  }

  clone() {
    const order = new OrderLeveraged({
      price: this.price,
      time: this.time, //Remove
      size: this.size,
      leverage: this.leverage,
      side: this.side,
    });
    order.takeProfit = this.takeProfit;
    order.stopLoss = this.stopLoss;
    return order;
  }
}
