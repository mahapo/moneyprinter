export class Order {
  [x: string]: any;

  constructor({ price, time, size }) {
    this.price = price;
    this.time = time;
    this.size = size;
  }

  get formatedTime() {
    return this.time.toLocaleString();
  }
}
