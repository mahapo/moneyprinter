import { EventEmitter } from "events";
import { Market, Exchange, Balances, Order, Trade } from "ccxt";
import * as WebSocket from "ws";
import * as configuration from "../configuration";

export class ExchangeBase extends EventEmitter {
  instance: Exchange;
  markets: Market[];
  balance: Balances;
  _orders: Order[] = [];
  positions: Trade[] = [];
  socket: WebSocket;

  lastTime: number;

  constructor(private options) {
    super();
  }

  async init() {
    try {
      // this.markets = await this.instance.fetchMarkets();
      // this.balance = await this.instance.fetchBalance();
      // this._orders = await this.instance.fetchOrders();
      //   this.positions = await this.instance.fetchTrades("BTC/USD");
      //   console.log(this.positions);
      // this.emit("orders");
    } catch (error) {}
  }

  async getCurrentPrice(symbol) {
    const { bids, asks } = await this.instance.fetchOrderBook(symbol);
    return Math.max(bids[0][0]);
  }

  async reset(symbol) {
    await this.instance.loadMarkets();
    const market = this.instance.market(symbol);
    const request = {
      symbol: market["id"],
    };
    // await this.instance.privatePostOrderCancelAll(request);
    await this.instance.privatePostStopOrderCancelAll(request);
  }

  get orders(): Order[] {
    return this._orders
      .filter((order) => !!order.info.order_link_id)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  get activeOrders(): Order[] {
    return this.orders.filter(
      (order) => !!order.info.order_link_id.includes(this.lastTime)
    );
  }

  get openOrders(): Order[] {
    return this.orders.filter((order) => order.status === "open");
  }
}
