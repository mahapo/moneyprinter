// https://phemex.com/references/articles/liquidation-price
// https://antiliquidation.gitlab.io/assets/scripts/main.js
// liquidationPrice -Liquidation Price
// long: "i.price + (i.price * rl.Change_PL_P) / 100",
// short: "i.price + (i.price * rs.Change_PL_P) / 100"

// Change_PL_P - Change in Price to Liquidation (%)
// long: "rl.Change_PB_P + (a.Adjusted_Long * 100)",
// short: "rs.Change_PB_P - (a.Adjusted_Short * 100)"

function round(value, step) {
  step || (step = 1.0);
  var inv = 1.0 / step;
  return Math.round(value * inv) / inv;
}

export class TradeLeveraged {
  [x: string]: any;

  constructor({ price, time, size, leverage = 100, ratio = 2, side = "long" }) {
    this.price = price;
    this.time = time;
    this.size = size;
    this.leverage = leverage;
    this.ratio = ratio;
    this.side = side;

    this.maintenanceMargin = 0.005;
  }

  get formatedTime() {
    return this.time.toLocaleString();
  }

  get adjustedLong() {
    return (
      this.maintenanceMargin -
      (1 / this.leverage) * this.maintenanceMargin
    ).toFixed(4);
  }

  get adjustedShort() {
    return (
      this.maintenanceMargin +
      (1 / this.leverage) * this.maintenanceMargin
    ).toFixed(4);
  }

  // Change in Price to Bankruptcy (%)
  get Change_PB_P()  : number {
    if (this.side) return (1 / (this.leverage + 1)) * -1 * 100;
    else return (1 / (this.leverage - 1)) * 100;
  }

  // Change in Price to Liquidation (%)
  get Change_PL_P()  : number {
    if (this.side) return this.Change_PB_P + this.adjustedLong * 100;
    return this.Change_PB_P - this.adjustedShort * 100;
  }

  // Liquidation Price
  get liquidationPrice()  : number {
    if (this.side)
      return round(
        this.price + (this.price * this.Change_PL_P) / 100,
        0.5
      );
    return round(
      this.price + (this.price * this.Change_PL_P) / 100,
      0.5
    );
  }

  // Change in Price to Liquidation ($)
  get Change_PL_USD() : number {
    return ((this.price - this.liquidationPrice) * -1).toFixed(1);
  }

  get stopLoss()  : number {
    if (this.side) return this.liquidationPrice + 5;
    return this.liquidationPrice - 5;
  }

  get takeProfit()  : number {
    if (this.side)
      return round(
        this.price + Math.abs(this.Change_PL_USD) * this.Ratio,
        0.5
      );
    return round(
      this.price - Math.abs(this.Change_PL_USD) * this.Ratio,
      0.5
    );
  }

  get takeProfit_P() {
    return (this.takeProfit / this.price) * 100 - 100;
  }

  get stopLoss_P() {
    return (this.stopLoss / this.price) * 100 - 100;
  }

  get maxLoss() {
    return Math.abs((this.size / this.leverage) * this.stopLoss_P);
  }

  get maxWin() {
    return (this.size / this.leverage) * this.takeProfit_P;
  }
}
