export class Order {
  [x: string]: any;

  constructor({ price, time, size, symbol }) {
    this.price = price;
    this.time = time;
    this.size = size;
    this.symbol = symbol;
  }

  get formatedTime() {
    return this.time.toLocaleString();
  }
}
