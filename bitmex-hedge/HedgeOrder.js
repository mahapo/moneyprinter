import Order from "./Order";

export default class HedgeOrder {
  constructor(Entry_Price, PositionSize, Ratio) {
    this.PositionSize = PositionSize;
    this.Ratio = Ratio;
    this.Entry_Price = parseFloat(Entry_Price);
    this.longOrder = new Order(
      "long",
      this.Entry_Price,
      this.PositionSize,
      this.Ratio
    );
    this.shortOrder = new Order(
      "short",
      this.Entry_Price,
      this.PositionSize,
      this.Ratio
    );

    // console.log(`====Order ${this.Entry_Price}====`);
    // console.log(
    //   `Long - TP: ${this.longOrder.Take_Profit} SL: ${this.longOrder.Stop_Loss}`
    // );
    // console.log(
    //   `Short - TP: ${this.shortOrder.Take_Profit} SL: ${
    //     this.shortOrder.Stop_Loss
    //   }`
    // );
  }

  get MaxLoss() {
    return this.longOrder.MaxLoss + this.shortOrder.MaxLoss;
  }

  get MaxWin() {
    return this.longOrder.MaxWin - this.shortOrder.MaxLoss;
  }
}
