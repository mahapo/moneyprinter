// https://phemex.com/references/articles/liquidation-price
// https://antiliquidation.gitlab.io/assets/scripts/main.js

// https://help.bybit.com/hc/en-us/articles/360039260694-Unrealized-Profit-Loss-Calculation-Inverse-Contract-

import * as colors from "colors/safe";
import { Order } from "../../models";
import * as LZW from "../../utils/LZW";
import * as symbols from "./markets.json";

export class OrderBybit extends Order {
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

    // this.takeProfit = this.takeProfitSuggestion;
    // this.stopLoss = this.stopLossSuggestion;
  }

  // get idUser() {
  //   return `${this._idUser}-${this.side.charAt(0)}`;
  // }

  // set idUser(id) {
  //   this._idUser = id;
  // }

  // get info() {
  //   return symbols.find((s) => s.symbol === this.symbol);
  // }

  get precision() {
    return this.info.precision;
  }

  get encodedIdUser() {
    return LZW.lzw_decode(this.idUser)
      .split("-")
      .map((x) => x);
  }

  get isPositon() {
    return this.status === "open" && this.filled > 0;
  }

  // get adjustedLong(): number {
  //   return (
  //     this.maintenanceMargin - (1 / this.leverage) * this.maintenanceMargin
  //   );
  // }

  // get adjustedShort(): number {
  //   return (
  //     this.maintenanceMargin + (1 / this.leverage) * this.maintenanceMargin
  //   );
  // }

  // // Change in Price to Bankruptcy (%)
  // get changePriceBankruptcyPercent(): number {
  //   if (this.side === "buy") return (1 / (this.leverage + 1)) * -1 * 100;
  //   return (1 / (this.leverage - 1)) * 100;
  // }

  // // Change in Price to Liquidation (%)
  // get changePriceLiquidationPercent(): number {
  //   if (this.side === "buy")
  //     return this.changePriceBankruptcyPercent + this.adjustedLong * 100;
  //   return this.changePriceBankruptcyPercent - this.adjustedShort * 100;
  // }

  // get changePriceLiquidationPercent(): number {
  //   if (this.side === "buy")
  //     return this.changePriceBankruptcyPercent + this.adjustedLong * 100;
  //   return this.changePriceBankruptcyPercent - this.adjustedShort * 100;
  // }

  // Liquidation Price
  get liquidationPrice(): number {
    if (this.side === "buy")
      return (
        (this.price * this.leverage) /
        (this.leverage + 1 - this.maintenanceMargin * this.leverage)
      );
    return (
      (this.price * this.leverage) /
      (this.leverage - 1 + this.maintenanceMargin * this.leverage)
    );
  }

  get realAmount() {
    return this.amount / this.leverage;
  }

  get amountValue() {
    return this.amount / this.price;
  }

  get feeRate() {
    return this.type === "market" ? -0.075 : 0.025;
  }

  get feeValue() {
    return this.amountValue * this.feeRate;
  }

  get profitLossPercentage() {
    return (1 - this.price / this.priceExit) * 100;
  }

  get profitLossValue() {
    return (this.profitLossPercentage / 100) * this.amountValue;
  }

  get profit() {
    return (this.profitLossPercentage / 100) * this.amount;
  }

  get roe() {
    return this.profitLossPercentage * this.leverage;
  }

  get uPNLValue() {
    return this._uPNLValue(this.priceExit);
  }

  _uPNLValue(priceExit: number) {
    if (this.side === "buy")
      return this.amount * (1 / this.price - 1 / priceExit);
    return this.amount * (1 / priceExit - 1 / this.price);
  }

  get initialMarginRate() {
    return 1 / this.leverage;
  }

  // https://help.bybit.com/hc/en-us/articles/900000181066-Bankruptcy-Price-USDT-Contract-
  get bankruptcyPrice() {
    if (this.side === "buy") return this.price * (1 - this.initialMarginRate);
    return this.price * (1 + this.initialMarginRate);
  }

  get initialMargin() {
    return this.amount / this.leverage;
  }

  get positionMargin() {
    return this.initialMargin + this.closingTradingFee;
  }

  get closingTradingFee() {
    return (this.amount / this.bankruptcyPrice) * 0.00075;
  }

  get feeToOpen() {
    return this.amount * (1 / this.price) * 0.00075;
  }

  get feeToClose() {
    return this._feeToClose(this.priceExit);
  }

  _feeToClose(priceExit: number) {
    return this.amount * (1 / priceExit) * 0.00075;
  }

  get closedProfitValue() {
    if (this.priceExit) return this._closedProfitValue(this.priceExit);
    return 0;
  }

  _closedProfitValue(priceExit: number) {
    return (
      this._uPNLValue(priceExit) -
      (this.feeToOpen + this._feeToClose(priceExit))
    );
  }

  get closedProfit() {
    if (this.priceExit) return this.closedProfitValue * this.priceExit;
    return 0;
  }

  // =================================================================

  // Change in Price to Liquidation ($)
  get changePriceLiquidation(): number {
    return Math.abs(this.price - this.liquidationPrice);
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

  // get profit(): number {
  //   if (this.priceExit) {
  //     if (this.side === "buy")
  //       return this.priceExit > this.price ? this.maxWin : this.maxLoss;
  //     else return this.priceExit < this.price ? this.maxWin : this.maxLoss;
  //   }
  //   return 0;
  // }

  setStopLoss(percentOfMaxRange: number = 100) {
    let priceRange = this.changePriceLiquidation * (percentOfMaxRange / 100);
    if (this.side === "buy") this.stopLoss = this.price - priceRange;
    else this.stopLoss = this.price + priceRange;
  }

  setTakeProfit(ratio: number) {
    this.takeProfit = this.calcPriceForRatio(ratio);
  }

  calcPriceForRatio(ratio: number): number {
    let profitStopLoss = this._closedProfitValue(this.stopLoss);
    let profitTakeProfit = Math.abs(profitStopLoss) * ratio;
    let price = this.price;
    let profit;

    // TODO: Better implementation
    do {
      if (this.side === "buy") price += this.precision.price;
      else price -= this.precision.price;
      profit = this._closedProfitValue(price);
    } while (profit < profitTakeProfit);
    return price;
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
    const order = new OrderBybit({
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
    if (this.closedProfit !== 0) {
      const prof = `${this.profitString()}`;
      const colored =
        this.closedProfit > 0 ? colors.green(prof) : colors.red(prof);
      profit = `| Profit: ${colored}`;
    }
    console.log(
      `${this.toString()} - ${this.status} (${this.filled} of ${
        this.amount
      }) ${profit}`
    );
  }

  profitString() {
    return this.closedProfit.toFixed(2);
  }
}
