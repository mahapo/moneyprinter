// https://phemex.com/references/articles/liquidation-price
// https://antiliquidation.gitlab.io/assets/scripts/main.js

import * as colors from "colors/safe";
import { Order } from ".";

export class OrderLeveraged extends Order {
  leverage: number;
  ratio: number;
  takeProfit: number;
  stopLoss: number;
  maintenanceMargin: number = 0.005;

  stopLossSet: boolean = false;
  takeProfitSet: boolean = false;

  _idUser: string;

  constructor(options) {
    super(options);

    this.leverage = options.leverage;
    this.ratio = options.ratio;

    this.takeProfit = this.takeProfitSuggestion;
    this.stopLoss = this.stopLossSuggestion;
  }

  get idUser() {
    return `${this._idUser}-${this.side}`;
  }

  set idUser(id) {
    this._idUser = id;
  }

  get isPositon() {
    return this.status === "open" && this.filled > 0;
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
    if (this.side === "buy") return (1 / (this.leverage + 1)) * -1 * 100;
    return (1 / (this.leverage - 1)) * 100;
  }

  // Change in Price to Liquidation (%)
  get changePriceLiquidationPercent(): number {
    if (this.side === "buy")
      return this.changePriceBankruptcyPercent + this.adjustedLong * 100;
    return this.changePriceBankruptcyPercent - this.adjustedShort * 100;
  }

  // Liquidation Price
  get liquidationPrice(): number {
    if (this.side === "buy")
      return (
        this.price + (this.price * this.changePriceLiquidationPercent) / 100
      );
    return this.price + (this.price * this.changePriceLiquidationPercent) / 100;
  }

  // Change in Price to Liquidation ($)
  get changePriceLiquidation(): number {
    return (this.price - this.liquidationPrice) * -1;
  }

  get takeProfitSuggestion(): number {
    if (this.side === "buy")
      return this.price + Math.abs(this.changePriceLiquidation) * this.ratio;
    return this.price - Math.abs(this.changePriceLiquidation) * this.ratio;
  }

  get stopLossSuggestion(): number {
    if (this.side === "buy") return this.liquidationPrice + 5;
    return this.liquidationPrice - 5;
  }

  get takeProfitPercent(): number {
    return (this.takeProfit / this.price) * 100 - 100;
  }

  get stopLossPercent(): number {
    return (this.stopLoss / this.price) * 100 - 100;
  }

  get maxWin(): number {
    if (this.side === "buy")
      return (this.amount / this.leverage) * this.takeProfitPercent;
    return (this.amount / this.leverage) * this.takeProfitPercent * -1;
  }

  get maxLoss(): number {
    if (this.side === "buy")
      return (this.amount / this.leverage) * this.stopLossPercent;
    return (this.amount / this.leverage) * this.stopLossPercent * -1;
  }

  get profit(): number {
    if (this.priceExit) {
      if (this.side === "buy")
        return this.priceExit > this.price ? this.maxWin : this.maxLoss;
      else return this.priceExit < this.price ? this.maxWin : this.maxLoss;
    }
    return 0;
  }

  checkIfTriggersTakeProfit(price: number) {
    return (
      (this.side === "buy" && this.takeProfit <= price) ||
      (this.side === "sell" && this.takeProfit >= price)
    );
  }

  checkIfTriggersStopLoss(price: number) {
    return (
      (this.side === "buy" && this.stopLoss >= price) ||
      (this.side === "sell" && this.stopLoss <= price)
    );
  }

  toString(): string {
    const colored = this.side === "buy" ? colors.green("L") : colors.red("S");
    return `${colored} ${this.symbol} ${this.amount} @ ${this.price} TP:${this.takeProfit} SL:${this.stopLoss} ${this.idUser}`;
  }

  clone() {
    const order = new OrderLeveraged({
      price: this.price,
      amount: this.amount,
      leverage: this.leverage,
      side: this.side,
      symbol: this.symbol,
      timestamp: this.timestamp,
      ratio: this.ratio,
    });
    order.takeProfit = this.takeProfit;
    order.stopLoss = this.stopLoss;
    return order;
  }

  print() {
    var profit = "";
    if (this.profit !== 0) {
      const prof = `${this.profitString()}`;
      const colored = this.profit > 0 ? colors.green(prof) : colors.red(prof);
      profit = `| Profit: ${colored}`;
    }
    console.log(
      `${this.toString()} - ${this.status} (${this.filled} of ${
        this.amount
      }) ${profit}`
    );
  }

  profitString() {
    return this.profit.toFixed(2);
  }
}
