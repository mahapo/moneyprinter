import Order from "./Order";

export default class HedgeOrder {
  constructor(Entry_Price) {
    this.Entry_Price = parseFloat(Entry_Price);
    this.longOrder = new Order("long", this.Entry_Price);
    this.shortOrder = new Order("short", this.Entry_Price);

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
}
