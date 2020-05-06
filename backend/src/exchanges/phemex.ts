import * as phemex from "../../../ccxt/js/phemex";
import * as WebSocket from "ws";
import { EventEmitter } from "events";
import { performance } from "perf_hooks";
import { isEqual } from "lodash";
import * as configuration from "../configuration";

export class Phemex extends EventEmitter {
  instance: any;
  onFinish: any;
  accounts: any;
  socket: any;
  _orders: any = [];
  _positions: any = [];
  lastPosition;
  lastOrder;
  markets: any;
  ready: Boolean = false;

  id: number = 0;

  constructor(options) {
    super();
    // TODO: Add demo params
    let urls = {
      api: {
        public: "https://testnet.phemex.com/api",
        public2: "https://testnet-api.phemex.com",
        private: "https://testnet-api.phemex.com",
      },
    };
    this.instance = new phemex(options);
  }

  async init() {
    this.markets = await this.instance.fetchMarkets();
    await this.closeAllOrders(this.markets[0]);
    this.startWebSocket();
  }

  startWebSocket() {
    console.log("startTicker");
    this.socket = new WebSocket("wss://testnet.phemex.com/ws");

    const heartbeat = () => {
      if (!this.socket) return;
      if (this.socket.readyState !== 1) return;
      this.socket.send(
        JSON.stringify({
          method: "server.ping",
          params: [],
          id: this.id++,
        })
      );
      setTimeout(heartbeat, 10000);
    };

    this.socket.on("open", () => {
      this.authSocket();
      this.startTicker([".BTC"]);

      heartbeat();
    });

    this.socket.on("close", function close() {
      console.log("disconnected");
    });

    this.socket.on("message", (data) => {
      let { tick, id, accounts, orders, positions } = JSON.parse(data);
      if (tick) {
        this.emit("tick", {
          scale: tick.scale,
          symbol: tick.symbol,
          price: tick.last / Math.pow(10, 4),
          time: new Date(tick.timestmp / 1000000),
        });
      }
      if (id === 0) {
        this.socket.send(
          JSON.stringify({
            id: 1,
            method: "aop.subscribe",
            params: [],
          })
        );
      }
      if (orders) this.orders = orders;
      if (positions) this.positions = positions;
      if (accounts) this.accounts = accounts;
    });
  }

  startTicker(params) {
    this.socket.send(
      JSON.stringify({
        method: "tick.subscribe",
        params,
        id: this.id++,
      })
    );
  }

  authSocket() {
    console.log("authSocket");
    const expiry = parseInt(
      this.instance.numberToString(this.instance.seconds() + 2 * 60)
    );
    const content = this.instance.apiKey + expiry;
    const signature = this.instance.hmac(content, this.instance.secret);

    this.socket.send(
      JSON.stringify({
        method: "user.auth",
        params: ["API", this.instance.apiKey, signature, expiry],
        id: 0,
      })
    );
  }

  async closeAllOrders(market) {
    const orders = await this.instance.fetchOpenOrders("BTC/USD");
    for (const order of orders) {
      await this.instance.cancelOrder(order.id, "BTC/USD");
    }
  }

  async placeOrder(position) {
    const order = position.order;
    try {
      const options = {
        actionBy: "FromOrderPlacement",
        symbol: "BTCUSD",
        clOrdID: position.id,
        side: order.side === "buy" ? "Buy" : "Sell",
        ordType: "Stop",
        orderQty: order.size,
        priceEp: this.instance.convertToEp(order.price), // Scaled price, required for limit order
        triggerType: "ByLastPrice",
        stopPxEp: this.instance.convertToEp(order.price), // Trigger price for stop orders
        closeOnTrigger: false,
        reduceOnly: false,
        // direction: "≥",
        pegPriceType: "UNSPECIFIED",
        timeInForce: "ImmediateOrCancel",
        takeProfitEp: this.instance.convertToEp(order.takeProfit),
        stopLossEp: this.instance.convertToEp(order.stopLoss),
      };
      let { data } = await this.instance.privatePostOrders(options);
      console.log(`Order places:`, data.clOrdID);
    } catch (error) {
      console.error(error);
    }
  }

  updatePosition({ price, time }) {
    let options = {
      actionBy: "FromPosition",
      clOrdID: "45823391-43c6-febc-470f-6b9c06135f8e",
      symbol: "BTCUSD",
      side: "Sell",
      ordType: "Stop",
      orderQty: 0,
      priceEp: 75790000,
      triggerType: "ByLastPrice",
      stopPxEp: 76370000,
      closeOnTrigger: true,
      timeInForce: "ImmediateOrCancel",
      pegPriceType: "TrailingTakeProfitPeg",
      pegOffsetValueEp: -30000,
    };
  }

  async getCurrentPrice(symbol) {
    try {
      const { bids, asks } = await this.instance.fetchOrderBook(symbol);
      return Math.max(bids[0][0]);
    } catch (error) {}
  }

  set orders(orders) {
    this.emit("order_updated", orders);
    this._orders = orders.filter(({ clOrdID }) =>
      clOrdID.includes(configuration.get("KEY"))
    );
    // orders.forEach((order) => {
    //   const id = order.clOrdID;
    //   order = this.instance.parseOrder(order, this.markets[0]);
    //   order.id = id;
    //   if (id.includes(configuration.get("KEY"))) {
    //     delete order.info;
    //     const old = this._orders.get(order.id);
    //     if (old) {
    //       const same = isEqual(old, order);
    //       if (!same && old.status !== "canceled") {
    //         if (old.status === "filled") {
    //           this.lastOrder = order;
    //           this.emit("order_filled", order);
    //         }
    //         this.emit("order_updated", order);
    //         this._orders.set(order.id, order);
    //       }
    //     } else {
    //       this._orders.set(order.id, order);
    //       this.emit("order_added", order);
    //     }
    //   }
    // });
  }

  get orders() {
    return this._orders;
  }

  get openOrders() {
    return Array.from(this._orders.values()).filter(
      ({ status }) => status === "open"
    );
  }

  set positions(positions) {
    this._positions = new Map();
    positions
      // .filter((position) => position.transactTimeNs)
      .forEach((position) => {
        let id = position.transactTimeNs;
        this._positions.set(id, position);
        this.emit("position_updated", position);
        const old = this._positions.get(id);
        if (old) {
          // const same = isEqual(old, position);
          // if (!same) {
          // }
        } else {
          this._positions.set(id, position);
          this.lastPosition = position;
          if (this.lastOrder) {
            this.lastOrder.position = position;
            this.lastPosition.order = this.lastOrder;
          }
          this.emit("position_added", this.lastPosition);
          console.log(this.lastPosition);
        }
      });
  }

  get positions() {
    return this._positions;
  }
}
