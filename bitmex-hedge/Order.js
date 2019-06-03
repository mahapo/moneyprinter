// https://antiliquidation.gitlab.io/assets/scripts/main.js
// Liquidation_Price -Liquidation Price
// long: "i.Entry_Price + (i.Entry_Price * rl.Change_PL_P) / 100",
// short: "i.Entry_Price + (i.Entry_Price * rs.Change_PL_P) / 100"

// Change_PL_P - Change in Price to Liquidation (%)
// long: "rl.Change_PB_P + (a.Adjusted_Long * 100)",
// short: "rs.Change_PB_P - (a.Adjusted_Short * 100)"

function round(value, step) {
  step || (step = 1.0);
  var inv = 1.0 / step;
  return Math.round(value * inv) / inv;
}

export default class Order {
  constructor(side, Entry_Price) {
    this.symbol = "XBTUSD";
    this.Leverage = 100;

    this.side = side === "long";
    this.Entry_Price = Entry_Price;

    this.Maintenance_Margin = 0.005;
  }

  get Adjusted_Long() {
    return (
      this.Maintenance_Margin -
      (1 / this.Leverage) * this.Maintenance_Margin
    ).toFixed(4);
  }

  get Adjusted_Short() {
    return (
      this.Maintenance_Margin +
      (1 / this.Leverage) * this.Maintenance_Margin
    ).toFixed(4);
  }

  // Change in Price to Bankruptcy (%)
  get Change_PB_P() {
    if (this.side) return (1 / (this.Leverage + 1)) * -1 * 100;
    else return (1 / (this.Leverage - 1)) * 100;
  }

  // Change in Price to Liquidation (%)
  get Change_PL_P() {
    if (this.side) return this.Change_PB_P + this.Adjusted_Long * 100;
    return this.Change_PB_P - this.Adjusted_Short * 100;
  }

  // Liquidation Price
  get Liquidation_Price() {
    if (this.side)
      return round(
        this.Entry_Price + (this.Entry_Price * this.Change_PL_P) / 100,
        0.5
      );
    return round(
      this.Entry_Price + (this.Entry_Price * this.Change_PL_P) / 100,
      0.5
    );
  }

  // Change in Price to Liquidation ($)
  get Change_PL_USD() {
    return ((this.Entry_Price - this.Liquidation_Price) * -1).toFixed(1);
  }

  get Stop_Loss() {
    if (this.side) return this.Liquidation_Price + 5;
    return this.Liquidation_Price - 5;
  }

  get Take_Profit() {
    if (this.side)
      return round(this.Entry_Price + Math.abs(this.Change_PL_USD) * 2, 0.5);
    return round(this.Entry_Price - Math.abs(this.Change_PL_USD) * 2, 0.5);
  }
}
