import * as ccxt from "ccxt";

export class Order implements ccxt.Order {
  id: string;
  datetime: string;
  timestamp: number;
  lastTradeTimestamp: number;
  timestampFilled: number;
  timestampExit: number;
  status: "open" | "closed" | "canceled";
  symbol: string;
  type: "market" | "limit";
  side: "buy" | "sell";
  price: number;
  amount: number;
  filled: number;
  // remaining: number;
  cost: number;
  trades: ccxt.Trade[];
  fee: ccxt.Fee;
  info: any;

  idUser: string;
  priceExit: number;

  constructor(options) {
    this.price = options.price;
    this.timestamp = options.timestamp;
    this.amount = options.amount;
    this.symbol = options.symbol;
    this.side = options.side;
    this.type = options.type;

    this.status = "open";
    this.filled = 0;
  }

  get formatedTime() {
    return this.timestamp;
  }

  get remaining(): number {
    return this.amount - this.filled;
  }

  get winTrade() {
    return this.side === "buy"
      ? this.priceExit > this.price
      : this.priceExit < this.price;
  }

  checkIfFilled(price: number) {
    return (
      (this.side === "buy" && this.price <= price) ||
      (this.side === "sell" && this.price >= price)
    );
  }
}
