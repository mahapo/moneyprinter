// https://phemex.com/references/articles/liquidation-price
// https://antiliquidation.gitlab.io/assets/scripts/main.js
// liquidationPrice -Liquidation Price
// long: "i.price + (i.price * rl.changePriceLiquidationPercent) / 100",
// short: "i.price + (i.price * rs.changePriceLiquidationPercent) / 100"

// changePriceLiquidationPercent - Change in Price to Liquidation (%)
// long: "rl.changePriceBankruptcyPercent + (a.Adjusted_Long * 100)",
// short: "rs.changePriceBankruptcyPercent - (a.Adjusted_Short * 100)"

function round(value, step) {
  step || (step = 1.0);
  var inv = 1.0 / step;
  return Math.round(value * inv) / inv;
}

export class TradeLeveraged {
  leverage: number;
  price: number;
  size: number;
  ratio: number;
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
    else return (1 / (this.leverage - 1)) * 100;
  }

  // Change in Price to Liquidation (%)
  get changePriceLiquidationPercent(): number {
    if (this.side === "long") return this.changePriceBankruptcyPercent + this.adjustedLong * 100;
    return this.changePriceBankruptcyPercent - this.adjustedShort * 100;
  }

  // Liquidation Price
  get liquidationPrice(): number {
    if (this.side === "long")
      return round(this.price + (this.price * this.changePriceLiquidationPercent) / 100, 0.5);
    return round(this.price + (this.price * this.changePriceLiquidationPercent) / 100, 0.5);
  }

  // Change in Price to Liquidation ($)
  get changePriceLiquidation(): number {
    return (this.price - this.liquidationPrice) * -1;
  }

  get stopLoss(): number {
    if (this.side === "long") return this.liquidationPrice + 5;
    return this.liquidationPrice - 5;
  }

  get takeProfit(): number {
    if (this.side === "long")
      return round(this.price + Math.abs(this.changePriceLiquidation) * this.ratio, 0.5);
    return round(this.price - Math.abs(this.changePriceLiquidation) * this.ratio, 0.5);
  }

  get takeProfitPercent(): number {
    return (this.takeProfit / this.price) * 100 - 100;
  }

  get stopLossPercent(): number {
    return (this.stopLoss / this.price) * 100 - 100;
  }

  get maxLoss(): number {
    return Math.abs((this.size / this.leverage) * this.stopLossPercent);
  }

  get maxWin(): number {
    return (this.size / this.leverage) * this.takeProfitPercent;
  }
}
