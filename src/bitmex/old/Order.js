export default class Order {
  constructor(symbol, side, price) {
    this.symbol = symbol
    this.side = side
    this.price = price
    this.factor = side == "buy" ? 1 : -1
  }

  takePrice(percent = 1, leverage = 1) {
    const p = (this.price / 100) * percent * this.factor
    return (this.price + (p / leverage)).toFixed(this.retr_dec(this.price))
  }

  stopLoss(percent = 1, leverage = 1) {
    const p = (this.price / 100) * percent * this.factor
    return (this.price - (p / leverage)).toFixed(this.retr_dec(this.price))
  }

  retr_dec(num) {
    return (num.toString().split('.')[1] || []).length;
  }
}
